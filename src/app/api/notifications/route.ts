import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { requireWorkspaceContext } from "@/lib/workspace-context";
import { notificationsRepository } from "@/lib/sheets/repositories";
import { errorResponse } from "@/lib/api/errors";

export async function GET(request: Request) {
  const workspaceId = new URL(request.url).searchParams.get("workspaceId");
  try {
    const session = await auth();
    const ctx = await requireWorkspaceContext(session, workspaceId, "VIEW");
    const all = await notificationsRepository.list(ctx.spreadsheetId);
    const mine = all
      .filter((n) => n.user_id === session!.user.id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return NextResponse.json({ notifications: mine });
  } catch (err) {
    return errorResponse(err);
  }
}

const markReadSchema = z.object({
  workspaceId: z.string().min(1),
  id: z.string().min(1),
});

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = markReadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const session = await auth();
    const ctx = await requireWorkspaceContext(session, parsed.data.workspaceId, "VIEW");
    const existing = await notificationsRepository.getById(ctx.spreadsheetId, parsed.data.id);
    if (!existing || existing.user_id !== session!.user.id) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }
    const notification = await notificationsRepository.update(
      ctx.spreadsheetId,
      parsed.data.id,
      { is_read: true },
      session!.user.id
    );
    return NextResponse.json({ notification });
  } catch (err) {
    return errorResponse(err);
  }
}
