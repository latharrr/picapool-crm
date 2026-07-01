import { getKV } from "@/lib/kv/client";
import { computeDashboardStats, type DashboardStats } from "./aggregate";

const TTL_MS = 5 * 60_000;

function dashboardKey(spreadsheetId: string): string {
  return `dashboard:${spreadsheetId}`;
}

/** Cache-aside read, refreshed proactively by cron; computes on-demand on a cold cache. */
export async function getOrComputeDashboardStats(spreadsheetId: string): Promise<DashboardStats> {
  const kv = getKV();
  const cached = await kv.get<DashboardStats>(dashboardKey(spreadsheetId));
  if (cached) return cached;

  const stats = await computeDashboardStats(spreadsheetId);
  await kv.set(dashboardKey(spreadsheetId), stats, { ttlMs: TTL_MS });
  return stats;
}

export async function refreshDashboardStats(spreadsheetId: string): Promise<DashboardStats> {
  const stats = await computeDashboardStats(spreadsheetId);
  await getKV().set(dashboardKey(spreadsheetId), stats, { ttlMs: TTL_MS });
  return stats;
}
