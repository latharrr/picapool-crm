import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { requireWorkspaceContext } from "@/lib/workspace-context";
import { leadsRepository, activityLogRepository } from "@/lib/sheets/repositories";
import { leadPriorityEnum, leadStatusEnum } from "@/lib/sheets/schema/crm";
import { errorResponse } from "@/lib/api/errors";

const createLeadSchema = z.object({
  workspaceId: z.string().min(1),
  name: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().optional(),
  college: z.string().optional(),
  university: z.string().optional(),
  year: z.string().optional(),
  city: z.string().optional(),
  source: z.string().optional(),
  campaign_id: z.string().optional(),
  status: leadStatusEnum.default("new"),
  priority: leadPriorityEnum.default("medium"),
  notes: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

export async function GET(request: Request) {
  const workspaceId = new URL(request.url).searchParams.get("workspaceId");
  try {
    const session = await auth();
    const ctx = await requireWorkspaceContext(session, workspaceId, "VIEW");
    const leads = await leadsRepository.list(ctx.spreadsheetId);
    return NextResponse.json({ leads });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = createLeadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const session = await auth();
    const ctx = await requireWorkspaceContext(session, parsed.data.workspaceId, "EDIT");
    const { workspaceId: _workspaceId, ...leadInput } = parsed.data;
    void _workspaceId;

    const lead = await leadsRepository.create(ctx.spreadsheetId, {
      ...leadInput,
      created_by: session!.user.id,
    });

    await activityLogRepository.create(ctx.spreadsheetId, {
      actor_id: session!.user.id,
      action: "lead_created",
      entity_type: "lead",
      entity_id: lead.id,
      diff: { name: lead.name, phone: lead.phone },
      created_by: session!.user.id,
    });

    return NextResponse.json({ lead });
  } catch (err) {
    return errorResponse(err);
  }
}
