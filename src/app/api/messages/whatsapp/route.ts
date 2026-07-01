import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { requireWorkspaceContext } from "@/lib/workspace-context";
import { messageHistoryRepository } from "@/lib/sheets/repositories";
import { directionEnum } from "@/lib/sheets/schema/engagement";
import { errorResponse } from "@/lib/api/errors";

const logMessageSchema = z.object({
  workspaceId: z.string().min(1),
  lead_id: z.string().min(1),
  direction: directionEnum.default("outbound"),
  body: z.string().min(1),
});

export async function GET(request: Request) {
  const workspaceId = new URL(request.url).searchParams.get("workspaceId");
  try {
    const session = await auth();
    const ctx = await requireWorkspaceContext(session, workspaceId, "VIEW");
    const messages = await messageHistoryRepository.list(ctx.spreadsheetId);
    return NextResponse.json({ messages });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = logMessageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const session = await auth();
    // No WhatsApp provider is connected yet — this only logs a message that
    // was sent manually, it doesn't actually send anything (per spec: build
    // the interface, not a fake send button).
    const ctx = await requireWorkspaceContext(session, parsed.data.workspaceId, "SEND_WHATSAPP");
    const message = await messageHistoryRepository.create(ctx.spreadsheetId, {
      lead_id: parsed.data.lead_id,
      direction: parsed.data.direction,
      body: parsed.data.body,
      status: "logged",
      sent_by: session!.user.id,
      sent_at: new Date().toISOString(),
      created_by: session!.user.id,
    });
    return NextResponse.json({ message });
  } catch (err) {
    return errorResponse(err);
  }
}
