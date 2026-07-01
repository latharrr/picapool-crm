import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { requireWorkspaceContext } from "@/lib/workspace-context";
import { housingListingsRepository } from "@/lib/sheets/repositories";
import { housingAvailabilityEnum } from "@/lib/sheets/schema/ops";
import { errorResponse } from "@/lib/api/errors";

const createListingSchema = z.object({
  workspaceId: z.string().min(1),
  title: z.string().min(1),
  address: z.string().optional(),
  city: z.string().optional(),
  rent_amount: z.number().optional(),
  availability_status: housingAvailabilityEnum.default("available"),
  contact_id: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(request: Request) {
  const workspaceId = new URL(request.url).searchParams.get("workspaceId");
  try {
    const session = await auth();
    const ctx = await requireWorkspaceContext(session, workspaceId, "VIEW");
    const listings = await housingListingsRepository.list(ctx.spreadsheetId);
    return NextResponse.json({ listings });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = createListingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const session = await auth();
    const ctx = await requireWorkspaceContext(session, parsed.data.workspaceId, "EDIT");
    const { workspaceId: _workspaceId, ...input } = parsed.data;
    void _workspaceId;
    const listing = await housingListingsRepository.create(ctx.spreadsheetId, {
      ...input,
      created_by: session!.user.id,
    });
    return NextResponse.json({ listing });
  } catch (err) {
    return errorResponse(err);
  }
}
