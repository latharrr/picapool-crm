import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { requireWorkspaceContext } from "@/lib/workspace-context";
import { respondentsRepository, activityLogRepository } from "@/lib/sheets/repositories";
import { respondentCallStatusEnum } from "@/lib/sheets/schema/research";
import { errorResponse } from "@/lib/api/errors";

const createRespondentSchema = z.object({
  workspaceId: z.string().min(1),
  name: z.string().min(1),
  username: z.string().optional(),
  phone: z.string().min(1),
  call_status: respondentCallStatusEnum.default("pending"),
});

export async function GET(request: Request) {
  const workspaceId = new URL(request.url).searchParams.get("workspaceId");
  try {
    const session = await auth();
    const ctx = await requireWorkspaceContext(session, workspaceId, "VIEW");
    const respondents = await respondentsRepository.list(ctx.spreadsheetId);
    return NextResponse.json({ respondents });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = createRespondentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const session = await auth();
    const ctx = await requireWorkspaceContext(session, parsed.data.workspaceId, "EDIT");
    const { workspaceId: _workspaceId, ...input } = parsed.data;
    void _workspaceId;

    const respondent = await respondentsRepository.create(ctx.spreadsheetId, {
      ...input,
      created_by: session!.user.id,
    });

    await activityLogRepository.create(ctx.spreadsheetId, {
      actor_id: session!.user.id,
      action: "respondent_created",
      entity_type: "respondent",
      entity_id: respondent.id,
      diff: { name: respondent.name, phone: respondent.phone },
      created_by: session!.user.id,
    });

    return NextResponse.json({ respondent });
  } catch (err) {
    return errorResponse(err);
  }
}
