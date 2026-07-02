import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { requireWorkspaceContext } from "@/lib/workspace-context";
import { leadsRepository, activityLogRepository } from "@/lib/sheets/repositories";
import { QUEUE_STATUSES } from "@/lib/calling";
import { errorResponse } from "@/lib/api/errors";

const bodySchema = z.object({
  workspaceId: z.string().min(1),
  allocations: z
    .array(z.object({ userId: z.string().min(1), count: z.number().int().positive() }))
    .min(1),
});

/**
 * Distributes a batch of unassigned, callable leads across users in fixed
 * counts — e.g. the first 20 (oldest first) to one intern, the next 20 to
 * another. Founder/Admin/Manager only (gated on VIEW_ANALYTICS, the same
 * permission that unlocks the Dashboard).
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const session = await auth();
    const ctx = await requireWorkspaceContext(session, parsed.data.workspaceId, "VIEW_ANALYTICS");
    const userId = session!.user.id;

    const leads = await leadsRepository.list(ctx.spreadsheetId);
    const pool = leads
      .filter((lead) => !lead.owner_id && QUEUE_STATUSES.includes(lead.status))
      .sort((a, b) => a.created_at.localeCompare(b.created_at));

    const assigned: { userId: string; count: number }[] = [];
    let cursor = 0;

    for (const allocation of parsed.data.allocations) {
      const slice = pool.slice(cursor, cursor + allocation.count);
      cursor += slice.length;

      for (const lead of slice) {
        await leadsRepository.update(ctx.spreadsheetId, lead.id, { owner_id: allocation.userId }, userId);
      }

      if (slice.length > 0) {
        assigned.push({ userId: allocation.userId, count: slice.length });
      }
    }

    await activityLogRepository.create(ctx.spreadsheetId, {
      actor_id: userId,
      action: "leads_assigned",
      entity_type: "leads",
      entity_id: ctx.workspaceId,
      diff: { assigned },
      created_by: userId,
    });

    return NextResponse.json({ assigned, unassignedRemaining: pool.length - cursor });
  } catch (err) {
    return errorResponse(err);
  }
}
