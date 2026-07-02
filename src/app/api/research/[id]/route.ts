import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { requireWorkspaceContext } from "@/lib/workspace-context";
import { respondentsRepository, activityLogRepository } from "@/lib/sheets/repositories";
import { respondentCallStatusEnum } from "@/lib/sheets/schema/research";
import { errorResponse } from "@/lib/api/errors";
import { RecordNotFoundError } from "@/lib/sheets/errors";

const updateRespondentSchema = z.object({
  workspaceId: z.string().min(1),
  name: z.string().min(1).optional(),
  username: z.string().optional(),
  phone: z.string().min(1).optional(),
  call_status: respondentCallStatusEnum.optional(),
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

export async function GET(request: Request, ctxParam: RouteContext<"/api/research/[id]">) {
  const { id } = await ctxParam.params;
  const workspaceId = new URL(request.url).searchParams.get("workspaceId");
  try {
    const session = await auth();
    const ctx = await requireWorkspaceContext(session, workspaceId, "VIEW");
    const respondent = await respondentsRepository.getById(ctx.spreadsheetId, id);
    if (!respondent) throw new RecordNotFoundError("Respondents", id);
    return NextResponse.json({ respondent });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PATCH(request: Request, ctxParam: RouteContext<"/api/research/[id]">) {
  const { id } = await ctxParam.params;
  const body = await request.json().catch(() => null);
  const parsed = updateRespondentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const session = await auth();
    const ctx = await requireWorkspaceContext(session, parsed.data.workspaceId, "EDIT");
    const { workspaceId: _workspaceId, ...patch } = parsed.data;
    void _workspaceId;

    const respondent = await respondentsRepository.update(
      ctx.spreadsheetId,
      id,
      patch,
      session!.user.id
    );

    await activityLogRepository.create(ctx.spreadsheetId, {
      actor_id: session!.user.id,
      action: "respondent_updated",
      entity_type: "respondent",
      entity_id: respondent.id,
      diff: patch,
      created_by: session!.user.id,
    });

    return NextResponse.json({ respondent });
  } catch (err) {
    return errorResponse(err);
  }
}
