import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { requireWorkspaceContext } from "@/lib/workspace-context";
import { emailHistoryRepository } from "@/lib/sheets/repositories";
import { directionEnum } from "@/lib/sheets/schema/engagement";
import { errorResponse } from "@/lib/api/errors";

const logEmailSchema = z.object({
  workspaceId: z.string().min(1),
  lead_id: z.string().min(1),
  direction: directionEnum.default("outbound"),
  subject: z.string().min(1),
  body: z.string().optional(),
});

export async function GET(request: Request) {
  const workspaceId = new URL(request.url).searchParams.get("workspaceId");
  try {
    const session = await auth();
    const ctx = await requireWorkspaceContext(session, workspaceId, "VIEW");
    const emails = await emailHistoryRepository.list(ctx.spreadsheetId);
    return NextResponse.json({ emails });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = logEmailSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const session = await auth();
    // No email provider is connected yet — this only logs an email that was
    // sent manually, it doesn't actually send anything.
    const ctx = await requireWorkspaceContext(session, parsed.data.workspaceId, "SEND_EMAIL");
    const email = await emailHistoryRepository.create(ctx.spreadsheetId, {
      lead_id: parsed.data.lead_id,
      direction: parsed.data.direction,
      subject: parsed.data.subject,
      body: parsed.data.body ?? "",
      status: "logged",
      sent_by: session!.user.id,
      sent_at: new Date().toISOString(),
      created_by: session!.user.id,
    });
    return NextResponse.json({ email });
  } catch (err) {
    return errorResponse(err);
  }
}
