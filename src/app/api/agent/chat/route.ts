import { NextResponse } from "next/server";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";
import { z } from "zod";
import { auth } from "@/auth";
import { requireWorkspaceContext } from "@/lib/workspace-context";
import { errorResponse } from "@/lib/api/errors";
import {
  leadsRepository,
  tasksRepository,
  campaignsRepository,
} from "@/lib/sheets/repositories";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "AI_API_KEY is not configured in your environment. Please add it to your .env.local file.",
      },
      { status: 400 }
    );
  }

  const body = await request.json().catch(() => null);
  if (!body || !body.messages || !body.workspaceId) {
    return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
  }

  const { messages, workspaceId } = body;

  try {
    const ctx = await requireWorkspaceContext(session, workspaceId, "VIEW");

    const customOpenAI = createOpenAI({
      baseURL: process.env.AI_API_BASE_URL || "https://api.freemodel.dev/v1",
      apiKey: apiKey,
    });

    const model = customOpenAI(process.env.AI_MODEL_NAME || "claude-3-5-sonnet");

    const result = await streamText({
      model,
      messages,
      system: `You are Picapool's CRM Agent. You have direct access to read and update data in the active workspace spreadsheet (Workspace name: "${body.workspaceName || "Active Workspace"}").
      You can perform actions on behalf of the user using your tools.
      
      When users want to import lists, multiple leads, or a dataset, ALWAYS use the 'batchCreateLeads' tool which writes all of them in a single, high-performance batch write.
      Provide helpful, structured markdown responses. Always confirm back clearly to the user what database actions you took.`,
      tools: {
        listLeads: {
          description: "List all leads in the current workspace",
          parameters: z.object({}),
          execute: async () => {
            const leads = await leadsRepository.list(ctx.spreadsheetId);
            return leads.map((l) => ({
              id: l.id,
              name: l.name,
              phone: l.phone,
              email: l.email,
              status: l.status,
              priority: l.priority,
              city: l.city,
              college: l.college,
            }));
          },
        },
        createLead: {
          description: "Create a single lead in the current workspace",
          parameters: z.object({
            name: z.string().min(1),
            phone: z.string().min(1),
            email: z.string().optional(),
            city: z.string().optional(),
            college: z.string().optional(),
            notes: z.string().optional(),
            priority: z.enum(["low", "medium", "high"]).default("medium"),
          }),
          execute: async (args: {
            name: string;
            phone: string;
            email?: string;
            city?: string;
            college?: string;
            notes?: string;
            priority: "low" | "medium" | "high";
          }) => {
            const lead = await leadsRepository.create(ctx.spreadsheetId, {
              ...args,
              status: "new",
              tags: [],
              created_by: session.user.id,
            });
            return { success: true, leadId: lead.id, name: lead.name };
          },
        },
        batchCreateLeads: {
          description: "Batch create multiple leads (up to 1000) in the current workspace",
          parameters: z.object({
            leads: z.array(
              z.object({
                name: z.string().min(1),
                phone: z.string().min(1),
                email: z.string().optional(),
                city: z.string().optional(),
                college: z.string().optional(),
                notes: z.string().optional(),
                priority: z.enum(["low", "medium", "high"]).default("medium"),
              })
            ),
          }),
          execute: async ({
            leads,
          }: {
            leads: {
              name: string;
              phone: string;
              email?: string;
              city?: string;
              college?: string;
              notes?: string;
              priority: "low" | "medium" | "high";
            }[];
          }) => {
            const inputs = leads.map((l) => ({
              ...l,
              status: "new" as const,
              tags: [] as string[],
              created_by: session.user.id,
            }));
            const created = await leadsRepository.batchCreate(ctx.spreadsheetId, inputs);
            return { success: true, count: created.length };
          },
        },
        listCampaigns: {
          description: "List all campaigns in the current workspace",
          parameters: z.object({}),
          execute: async () => {
            const campaigns = await campaignsRepository.list(ctx.spreadsheetId);
            return campaigns.map((c) => ({
              id: c.id,
              name: c.name,
              status: c.status,
              source: c.source,
            }));
          },
        },
        listTasks: {
          description: "List all tasks in the current workspace",
          parameters: z.object({}),
          execute: async () => {
            const tasks = await tasksRepository.list(ctx.spreadsheetId);
            return tasks.map((t) => ({
              id: t.id,
              title: t.title,
              status: t.status,
              priority: t.priority,
              due_date: t.due_date,
            }));
          },
        },
        createTask: {
          description: "Create and assign a task in the current workspace",
          parameters: z.object({
            title: z.string().min(1),
            description: z.string().optional(),
            dueDate: z.string().optional(), // YYYY-MM-DD
            priority: z.enum(["low", "medium", "high"]).default("medium"),
            linkedLeadId: z.string().optional(),
          }),
          execute: async (args: {
            title: string;
            description?: string;
            dueDate?: string;
            priority: "low" | "medium" | "high";
            linkedLeadId?: string;
          }) => {
            const task = await tasksRepository.create(ctx.spreadsheetId, {
              title: args.title,
              description: args.description,
              due_date: args.dueDate,
              priority: args.priority,
              status: "open",
              linked_lead_id: args.linkedLeadId,
              assignee_id: session.user.id,
              created_by: session.user.id,
            });
            return { success: true, taskId: task.id, title: task.title };
          },
        },
      },
    });

    return result.toTextStreamResponse();
  } catch (err) {
    return errorResponse(err);
  }
}
