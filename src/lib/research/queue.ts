import { respondentsRepository } from "@/lib/sheets/repositories";
import { acquireLeadLock } from "@/lib/kv/lock";
import type { RespondentRecord, RespondentCallStatus } from "@/lib/sheets/schema/research";
import type { WorkspaceContext } from "@/lib/workspace-context";

/** Respondents not yet successfully interviewed — eligible for the queue. */
export const RESEARCH_QUEUE_STATUSES: RespondentCallStatus[] = ["pending", "call_later"];

/**
 * Finds the next queueable, unlocked respondent and atomically locks it for
 * `userId`. Reuses the same KV lock primitive as the Leads calling queue —
 * it's already generic over (workspaceId, entityId, userId), no reason to
 * duplicate it for a second entity type.
 */
export async function findAndLockNextRespondent(
  ctx: WorkspaceContext,
  userId: string,
  excludeId?: string
): Promise<RespondentRecord | null> {
  const respondents = await respondentsRepository.list(ctx.spreadsheetId);
  const candidates = respondents.filter(
    (r) => r.id !== excludeId && RESEARCH_QUEUE_STATUSES.includes(r.call_status)
  );

  for (const respondent of candidates) {
    const locked = await acquireLeadLock(ctx.workspaceId, respondent.id, userId);
    if (locked) return respondent;
  }
  return null;
}
