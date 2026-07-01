import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { requireWorkspaceContext } from "@/lib/workspace-context";
import { tasksRepository } from "@/lib/sheets/repositories";
import { taskPriorityEnum, taskStatusEnum } from "@/lib/sheets/schema/engagement";
import { errorResponse } from "@/lib/api/errors";

const createTaskSchema = z.object({
  workspaceId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  assignee_id: z.string().optional(),
  due_date: z.string().optional(),
  priority: taskPriorityEnum.default("medium"),
  status: taskStatusEnum.default("open"),
  linked_lead_id: z.string().optional(),
  linked_campaign_id: z.string().optional(),
});

const updateTaskSchema = z.object({
  workspaceId: z.string().min(1),
  id: z.string().min(1),
  status: taskStatusEnum,
});

export async function GET(request: Request) {
  const workspaceId = new URL(request.url).searchParams.get("workspaceId");
  try {
    const session = await auth();
    const ctx = await requireWorkspaceContext(session, workspaceId, "VIEW");
    const tasks = await tasksRepository.list(ctx.spreadsheetId);
    return NextResponse.json({ tasks });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = createTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const session = await auth();
    const ctx = await requireWorkspaceContext(session, parsed.data.workspaceId, "EDIT");
    const { workspaceId: _workspaceId, ...input } = parsed.data;
    void _workspaceId;
    const task = await tasksRepository.create(ctx.spreadsheetId, {
      ...input,
      created_by: session!.user.id,
    });
    return NextResponse.json({ task });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = updateTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const session = await auth();
    const ctx = await requireWorkspaceContext(session, parsed.data.workspaceId, "EDIT");
    const task = await tasksRepository.update(
      ctx.spreadsheetId,
      parsed.data.id,
      { status: parsed.data.status },
      session!.user.id
    );
    return NextResponse.json({ task });
  } catch (err) {
    return errorResponse(err);
  }
}
