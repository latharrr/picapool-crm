import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { requireWorkspaceContext } from "@/lib/workspace-context";
import { findAndLockNextLead } from "@/lib/calling";
import { getLeadTimeline } from "@/lib/leads/timeline";
import { errorResponse } from "@/lib/api/errors";

const bodySchema = z.object({ workspaceId: z.string().min(1) });

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const session = await auth();
    const ctx = await requireWorkspaceContext(session, parsed.data.workspaceId, "CALL");

    const lead = await findAndLockNextLead(ctx, session!.user.id);
    if (!lead) return NextResponse.json({ lead: null });

    const timeline = await getLeadTimeline(ctx.spreadsheetId, lead.id);
    return NextResponse.json({ lead, timeline });
  } catch (err) {
    return errorResponse(err);
  }
}
