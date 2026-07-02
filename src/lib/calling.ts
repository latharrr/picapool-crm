import { leadsRepository } from "@/lib/sheets/repositories";
import { acquireLeadLock } from "@/lib/kv/lock";
import { hasPermission } from "@/lib/auth/rbac";
import type { LeadRecord, LeadStatus } from "@/lib/sheets/schema/crm";
import type { CallOutcome } from "@/lib/sheets/schema/engagement";
import type { WorkspaceContext } from "@/lib/workspace-context";

/** Lead statuses eligible to be handed out by the calling queue. */
export const QUEUE_STATUSES: LeadStatus[] = ["new", "queued", "callback"];

export function outcomeToStatus(outcome: CallOutcome): LeadStatus {
  return outcome;
}

/**
 * Finds the next queueable, unlocked lead and atomically locks it for
 * `userId`. Tries candidates in order until a lock is acquired (another
 * caller may win the race on any given one) or the list is exhausted.
 *
 * Only roles that can also run the "Assign leads" flow (VIEW_ANALYTICS —
 * Founder/Admin/Manager) may pull from the unassigned pool; everyone else
 * (Interns) only ever gets leads an admin has explicitly assigned to them
 * via owner_id. Without this, any intern could grab any unassigned lead
 * simply by opening Calling, bypassing assignment entirely.
 */
export async function findAndLockNextLead(
  ctx: WorkspaceContext,
  userId: string,
  excludeId?: string
): Promise<LeadRecord | null> {
  const leads = await leadsRepository.list(ctx.spreadsheetId);
  const canPullUnassigned = hasPermission(ctx.role, "VIEW_ANALYTICS");
  const candidates = leads.filter(
    (lead) =>
      lead.id !== excludeId &&
      QUEUE_STATUSES.includes(lead.status) &&
      (lead.owner_id === userId || (canPullUnassigned && !lead.owner_id))
  );

  for (const lead of candidates) {
    const locked = await acquireLeadLock(ctx.workspaceId, lead.id, userId);
    if (locked) return lead;
  }
  return null;
}
