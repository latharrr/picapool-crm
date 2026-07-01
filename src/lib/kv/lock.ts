import { getKV } from "./client";

const LOCK_TTL_MS = 10 * 60_000; // 10 minutes

function lockKey(workspaceId: string, leadId: string): string {
  return `lock:${workspaceId}:lead:${leadId}`;
}

/** Attempts to lock a lead for a caller. Returns true if the lock was acquired. */
export async function acquireLeadLock(
  workspaceId: string,
  leadId: string,
  userId: string
): Promise<boolean> {
  return getKV().setNX(lockKey(workspaceId, leadId), userId, LOCK_TTL_MS);
}

export async function isLeadLocked(workspaceId: string, leadId: string): Promise<boolean> {
  return (await getKV().get<string>(lockKey(workspaceId, leadId))) !== null;
}

export async function getLeadLockOwner(
  workspaceId: string,
  leadId: string
): Promise<string | null> {
  return getKV().get<string>(lockKey(workspaceId, leadId));
}

/** Releases the lock only if it's still owned by `userId` (avoids releasing someone else's lock). */
export async function releaseLeadLock(
  workspaceId: string,
  leadId: string,
  userId: string
): Promise<void> {
  const kv = getKV();
  const owner = await kv.get<string>(lockKey(workspaceId, leadId));
  if (owner === userId) {
    await kv.del(lockKey(workspaceId, leadId));
  }
}

/** Refreshes the lock TTL on user activity (heartbeat) without changing ownership. */
export async function extendLeadLock(
  workspaceId: string,
  leadId: string,
  userId: string
): Promise<boolean> {
  const kv = getKV();
  const owner = await kv.get<string>(lockKey(workspaceId, leadId));
  if (owner !== userId) return false;
  await kv.set(lockKey(workspaceId, leadId), userId, { ttlMs: LOCK_TTL_MS });
  return true;
}
