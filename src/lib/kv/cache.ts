import { getKV } from "./client";

const DEFAULT_TTL_MS = 45_000;

/** Per-tab TTL overrides — slower-changing tabs can cache longer. */
const TTL_OVERRIDES_MS: Record<string, number> = {
  Settings: 120_000,
  Roles_Permissions: 120_000,
  Workspaces: 60_000,
};

function cacheKey(spreadsheetId: string, tabName: string): string {
  return `sheet:${spreadsheetId}:${tabName}`;
}

/** Cache-aside read: returns cached rows for a tab, or calls `fetcher` and caches the result. */
export async function getCachedTab(
  spreadsheetId: string,
  tabName: string,
  fetcher: () => Promise<string[][]>
): Promise<string[][]> {
  const kv = getKV();
  const key = cacheKey(spreadsheetId, tabName);
  const cached = await kv.get<string[][]>(key);
  if (cached) return cached;

  const fresh = await fetcher();
  await kv.set(key, fresh, { ttlMs: TTL_OVERRIDES_MS[tabName] ?? DEFAULT_TTL_MS });
  return fresh;
}

export async function invalidateTab(spreadsheetId: string, tabName: string): Promise<void> {
  await getKV().del(cacheKey(spreadsheetId, tabName));
}

/**
 * Dashboard stats are aggregated across several tabs and cached separately
 * from the per-tab cache above (see src/lib/analytics/cache.ts) — busting
 * this on every write keeps that cache-aside blob from going stale between
 * the once-daily cron refresh. Lives here rather than in analytics/cache.ts
 * to avoid that module's import of the repositories (which import this
 * file) becoming circular.
 */
export async function invalidateDashboardStats(spreadsheetId: string): Promise<void> {
  await getKV().del(`dashboard:${spreadsheetId}`);
}

const LAST_REFRESH_KEY_PREFIX = "sheet:last-refresh:";

export async function markTabRefreshed(spreadsheetId: string, tabName: string): Promise<void> {
  await getKV().set(`${LAST_REFRESH_KEY_PREFIX}${spreadsheetId}:${tabName}`, Date.now());
}

export async function getLastRefreshedAt(
  spreadsheetId: string,
  tabName: string
): Promise<number | null> {
  return getKV().get<number>(`${LAST_REFRESH_KEY_PREFIX}${spreadsheetId}:${tabName}`);
}
