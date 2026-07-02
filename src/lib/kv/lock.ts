import { getKV } from "./client";

const LOCK_TTL_MS = 10 * 60_000; // 10 minutes

function lockKey(workspaceId: string, leadId: string): string {
  return `lock:${workspaceId}:lead:${leadId}`;
}

/**
 * Attempts to lock a lead for a caller. Returns true if the lock was
 * acquired. If the lead is already locked to this same user (e.g. their
 * browser closed mid-call before the release fetch fired, and they come
 * back before the 10-minute TTL expires), this refreshes the TTL and
 * succeeds instead of failing — otherwise `setNX` alone would treat their
 * own stale lock as unavailable and skip the lead entirely.
 */
export async function acquireLeadLock(
  workspaceId: string,
  leadId: string,
  userId: string
): Promise<boolean> {
  const kv = getKV();
  const key = lockKey(workspaceId, leadId);
  const acquired = await kv.setNX(key, userId, LOCK_TTL_MS);
  if (acquired) return true;

  const owner = await kv.get<string>(key);
  if (owner !== userId) return false;
  await kv.set(key, userId, { ttlMs: LOCK_TTL_MS });
  return true;
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
