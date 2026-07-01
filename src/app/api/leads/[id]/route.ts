import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { requireWorkspaceContext } from "@/lib/workspace-context";
import { leadsRepository, activityLogRepository } from "@/lib/sheets/repositories";
import { getLeadTimeline } from "@/lib/leads/timeline";
import { leadPriorityEnum, leadStatusEnum } from "@/lib/sheets/schema/crm";
import { errorResponse } from "@/lib/api/errors";
import { RecordNotFoundError } from "@/lib/sheets/errors";

const updateLeadSchema = z.object({
  workspaceId: z.string().min(1),
  name: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
  email: z.string().optional(),
  college: z.string().optional(),
  university: z.string().optional(),
  year: z.string().optional(),
  city: z.string().optional(),
  source: z.string().optional(),
  campaign_id: z.string().optional(),
  status: leadStatusEnum.optional(),
  priority: leadPriorityEnum.optional(),
  owner_id: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export async function GET(request: Request, ctxParam: RouteContext<"/api/leads/[id]">) {
  const { id } = await ctxParam.params;
  const workspaceId = new URL(request.url).searchParams.get("workspaceId");
  try {
    const session = await auth();
    const ctx = await requireWorkspaceContext(session, workspaceId, "VIEW");
    const lead = await leadsRepository.getById(ctx.spreadsheetId, id);
    if (!lead) throw new RecordNotFoundError("Leads", id);
    const timeline = await getLeadTimeline(ctx.spreadsheetId, id);
    return NextResponse.json({ lead, timeline });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PATCH(request: Request, ctxParam: RouteContext<"/api/leads/[id]">) {
  const { id } = await ctxParam.params;
  const body = await request.json().catch(() => null);
  const parsed = updateLeadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const session = await auth();
    const ctx = await requireWorkspaceContext(session, parsed.data.workspaceId, "EDIT");
    const { workspaceId: _workspaceId, ...patch } = parsed.data;
    void _workspaceId;

    const lead = await leadsRepository.update(ctx.spreadsheetId, id, patch, session!.user.id);

    await activityLogRepository.create(ctx.spreadsheetId, {
      actor_id: session!.user.id,
      action: "lead_updated",
      entity_type: "lead",
      entity_id: lead.id,
      diff: patch,
      created_by: session!.user.id,
    });

    return NextResponse.json({ lead });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(request: Request, ctxParam: RouteContext<"/api/leads/[id]">) {
  const { id } = await ctxParam.params;
  const workspaceId = new URL(request.url).searchParams.get("workspaceId");
  try {
    const session = await auth();
    const ctx = await requireWorkspaceContext(session, workspaceId, "DELETE");
    await leadsRepository.softDelete(ctx.spreadsheetId, id, session!.user.id);

    await activityLogRepository.create(ctx.spreadsheetId, {
      actor_id: session!.user.id,
      action: "lead_deleted",
      entity_type: "lead",
      entity_id: id,
      diff: null,
      created_by: session!.user.id,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
