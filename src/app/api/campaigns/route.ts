import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { requireWorkspaceContext } from "@/lib/workspace-context";
import { campaignsRepository } from "@/lib/sheets/repositories";
import { campaignStatusEnum } from "@/lib/sheets/schema/engagement";
import { errorResponse } from "@/lib/api/errors";

const createCampaignSchema = z.object({
  workspaceId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  source: z.string().optional(),
  status: campaignStatusEnum.default("active"),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
});

export async function GET(request: Request) {
  const workspaceId = new URL(request.url).searchParams.get("workspaceId");
  try {
    const session = await auth();
    const ctx = await requireWorkspaceContext(session, workspaceId, "VIEW");
    const campaigns = await campaignsRepository.list(ctx.spreadsheetId);
    return NextResponse.json({ campaigns });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = createCampaignSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const session = await auth();
    const ctx = await requireWorkspaceContext(session, parsed.data.workspaceId, "EDIT");
    const { workspaceId: _workspaceId, ...input } = parsed.data;
    void _workspaceId;
    const campaign = await campaignsRepository.create(ctx.spreadsheetId, {
      ...input,
      created_by: session!.user.id,
    });
    return NextResponse.json({ campaign });
  } catch (err) {
    return errorResponse(err);
  }
}
