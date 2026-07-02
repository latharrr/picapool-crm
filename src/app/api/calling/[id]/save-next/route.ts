import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { requireWorkspaceContext } from "@/lib/workspace-context";
import { findAndLockNextLead, outcomeToStatus } from "@/lib/calling";
import { getLeadLockOwner, releaseLeadLock } from "@/lib/kv/lock";
import { getLeadTimeline } from "@/lib/leads/timeline";
import { leadsRepository, callHistoryRepository, activityLogRepository } from "@/lib/sheets/repositories";
import { callOutcomeEnum } from "@/lib/sheets/schema/engagement";
import { leadGenderEnum, pgStageEnum, followUpStatusEnum, leadPriorityEnum } from "@/lib/sheets/schema/crm";
import { errorResponse } from "@/lib/api/errors";

const bodySchema = z.object({
  workspaceId: z.string().min(1),
  outcome: callOutcomeEnum,
  notes: z.string().optional(),
  durationSeconds: z.number().optional(),
  ownerName: z.string().optional(),
  beds: z.number().optional(),
  gender: leadGenderEnum.optional(),
  pgStage: pgStageEnum.optional(),
  followUp: followUpStatusEnum.optional(),
  priority: leadPriorityEnum.optional(),
});

export async function POST(request: Request, ctxParam: RouteContext<"/api/calling/[id]/save-next">) {
  const { id } = await ctxParam.params;
  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const session = await auth();
    const ctx = await requireWorkspaceContext(session, parsed.data.workspaceId, "CALL");
    const userId = session!.user.id;

    const lockOwner = await getLeadLockOwner(ctx.workspaceId, id);
    if (lockOwner !== userId) {
      return NextResponse.json(
        { error: "This lead is no longer locked to you (it may have timed out)." },
        { status: 409 }
      );
    }

    const now = new Date().toISOString();
    await callHistoryRepository.create(ctx.spreadsheetId, {
      lead_id: id,
      caller_id: userId,
      outcome: parsed.data.outcome,
      notes: parsed.data.notes,
      duration_seconds: parsed.data.durationSeconds,
      called_at: now,
      created_by: userId,
    });

    const lead = await leadsRepository.update(
      ctx.spreadsheetId,
      id,
      {
        status: outcomeToStatus(parsed.data.outcome),
        owner_id: userId,
        ...(parsed.data.notes ? { notes: parsed.data.notes } : {}),
        ...(parsed.data.ownerName ? { owner_name: parsed.data.ownerName } : {}),
        ...(parsed.data.beds !== undefined ? { beds: parsed.data.beds } : {}),
        ...(parsed.data.gender ? { gender: parsed.data.gender } : {}),
        ...(parsed.data.pgStage ? { pg_stage: parsed.data.pgStage } : {}),
        ...(parsed.data.followUp ? { follow_up_status: parsed.data.followUp } : {}),
        ...(parsed.data.priority ? { priority: parsed.data.priority } : {}),
      },
      userId
    );

    await activityLogRepository.create(ctx.spreadsheetId, {
      actor_id: userId,
      action: "call_logged",
      entity_type: "lead",
      entity_id: id,
      diff: { outcome: parsed.data.outcome },
      created_by: userId,
    });

    await releaseLeadLock(ctx.workspaceId, id, userId);

    const next = await findAndLockNextLead(ctx, userId, id);
    const nextTimeline = next ? await getLeadTimeline(ctx.spreadsheetId, next.id) : [];

    return NextResponse.json({ saved: lead, next: next ?? null, nextTimeline });
  } catch (err) {
    return errorResponse(err);
  }
}
