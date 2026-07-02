import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { requireWorkspaceContext } from "@/lib/workspace-context";
import { findAndLockNextRespondent } from "@/lib/research/queue";
import { getLeadLockOwner, releaseLeadLock } from "@/lib/kv/lock";
import { respondentsRepository, activityLogRepository } from "@/lib/sheets/repositories";
import { respondentCallStatusEnum } from "@/lib/sheets/schema/research";
import { errorResponse } from "@/lib/api/errors";

const bodySchema = z.object({
  workspaceId: z.string().min(1),
  call_status: respondentCallStatusEnum,
  jtbd: z.string().optional(),
  acquisition_source: z.string().optional(),
  initial_perception: z.string().optional(),
  current_perception: z.string().optional(),
  feature_awareness: z.string().optional(),
  activation: z.string().optional(),
  problem_solved: z.string().optional(),
  coordination_success: z.string().optional(),
  marketplace_confidence: z.string().optional(),
  trust_score: z.number().min(1).max(5).optional(),
  exp_match_score: z.number().min(1).max(5).optional(),
  return_intent_score: z.number().min(1).max(5).optional(),
  cross_jtbd_return: z.string().optional(),
  biggest_friction: z.string().optional(),
  missing_capability: z.string().optional(),
  raw_notes: z.string().optional(),
});

export async function POST(request: Request, ctxParam: RouteContext<"/api/research/[id]/save-next">) {
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
        { error: "This respondent is no longer locked to you (it may have timed out)." },
        { status: 409 }
      );
    }

    const { workspaceId: _workspaceId, ...patch } = parsed.data;
    void _workspaceId;

    const saved = await respondentsRepository.update(ctx.spreadsheetId, id, patch, userId);

    await activityLogRepository.create(ctx.spreadsheetId, {
      actor_id: userId,
      action: "interview_logged",
      entity_type: "respondent",
      entity_id: id,
      diff: { call_status: parsed.data.call_status },
      created_by: userId,
    });

    await releaseLeadLock(ctx.workspaceId, id, userId);

    const next = await findAndLockNextRespondent(ctx, userId, id);

    return NextResponse.json({ saved, next });
  } catch (err) {
    return errorResponse(err);
  }
}
