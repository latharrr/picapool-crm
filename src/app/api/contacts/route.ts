import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { requireWorkspaceContext } from "@/lib/workspace-context";
import { contactsRepository } from "@/lib/sheets/repositories";
import { errorResponse } from "@/lib/api/errors";

const createContactSchema = z.object({
  workspaceId: z.string().min(1),
  name: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().optional(),
  relation: z.string().optional(),
  lead_id: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(request: Request) {
  const workspaceId = new URL(request.url).searchParams.get("workspaceId");
  try {
    const session = await auth();
    const ctx = await requireWorkspaceContext(session, workspaceId, "VIEW");
    const contacts = await contactsRepository.list(ctx.spreadsheetId);
    return NextResponse.json({ contacts });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = createContactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const session = await auth();
    const ctx = await requireWorkspaceContext(session, parsed.data.workspaceId, "EDIT");
    const { workspaceId: _workspaceId, ...input } = parsed.data;
    void _workspaceId;
    const contact = await contactsRepository.create(ctx.spreadsheetId, {
      ...input,
      created_by: session!.user.id,
    });
    return NextResponse.json({ contact });
  } catch (err) {
    return errorResponse(err);
  }
}
