import { leadsRepository, callHistoryRepository, campaignsRepository, usersRepository } from "@/lib/sheets/repositories";
import { getRootSpreadsheetId } from "@/lib/env";
import type { LeadRecord } from "@/lib/sheets/schema/crm";
import type { CallHistoryRecord } from "@/lib/sheets/schema/engagement";

export interface TrendPoint {
  date: string; // YYYY-MM-DD
  calls: number;
  connected: number;
}

export interface FunnelStage {
  stage: string;
  count: number;
}

export interface DistributionSlice {
  label: string;
  count: number;
}

export interface CampaignPerformance {
  campaignId: string;
  campaignName: string;
  leads: number;
  converted: number;
}

export interface LeaderboardEntry {
  callerId: string;
  callerName: string;
  calls: number;
  connected: number;
}

export interface DashboardStats {
  computedAt: string;
  todaysCalls: number;
  connected: number;
  interested: number;
  pending: number;
  callbacks: number;
  conversionRate: number;
  dailyTrend: TrendPoint[];
  funnel: FunnelStage[];
  collegeDistribution: DistributionSlice[];
  cityDistribution: DistributionSlice[];
  campaignPerformance: CampaignPerformance[];
  leaderboard: LeaderboardEntry[];
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function groupCount(values: (string | undefined)[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const v of values) {
    if (!v) continue;
    map.set(v, (map.get(v) ?? 0) + 1);
  }
  return map;
}

function topN(map: Map<string, number>, n: number): DistributionSlice[] {
  return Array.from(map.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, n);
}

function buildDailyTrend(calls: CallHistoryRecord[], days: number): TrendPoint[] {
  const today = startOfDay(new Date());
  const buckets = new Map<string, TrendPoint>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = dateKey(d);
    buckets.set(key, { date: key, calls: 0, connected: 0 });
  }

  for (const call of calls) {
    const called = new Date(call.called_at);
    if (Number.isNaN(called.getTime())) continue;
    const key = dateKey(called);
    const bucket = buckets.get(key);
    if (!bucket) continue; // outside the window
    bucket.calls += 1;
    if (call.outcome === "connected") bucket.connected += 1;
  }

  return Array.from(buckets.values());
}

const FUNNEL_STAGES: { stage: string; statuses: LeadRecord["status"][] }[] = [
  { stage: "New", statuses: ["new", "queued"] },
  { stage: "Connected", statuses: ["connected"] },
  { stage: "Interested", statuses: ["interested"] },
  { stage: "Converted", statuses: ["converted"] },
];

function buildFunnel(leads: LeadRecord[]): FunnelStage[] {
  return FUNNEL_STAGES.map(({ stage, statuses }) => ({
    stage,
    count: leads.filter((l) => statuses.includes(l.status)).length,
  }));
}

async function buildLeaderboard(calls: CallHistoryRecord[]): Promise<LeaderboardEntry[]> {
  const rootId = getRootSpreadsheetId();
  const users = rootId ? await usersRepository.list(rootId) : [];
  const nameById = new Map(users.map((u) => [u.id, u.name]));

  const byCaller = new Map<string, { calls: number; connected: number }>();
  for (const call of calls) {
    const entry = byCaller.get(call.caller_id) ?? { calls: 0, connected: 0 };
    entry.calls += 1;
    if (call.outcome === "connected") entry.connected += 1;
    byCaller.set(call.caller_id, entry);
  }

  return Array.from(byCaller.entries())
    .map(([callerId, stats]) => ({
      callerId,
      callerName: nameById.get(callerId) ?? "Unknown",
      ...stats,
    }))
    .sort((a, b) => b.calls - a.calls)
    .slice(0, 10);
}

export async function computeDashboardStats(spreadsheetId: string): Promise<DashboardStats> {
  const [leads, calls, campaigns] = await Promise.all([
    leadsRepository.list(spreadsheetId),
    callHistoryRepository.list(spreadsheetId),
    campaignsRepository.list(spreadsheetId),
  ]);

  const today = startOfDay(new Date());
  const todaysCalls = calls.filter((c) => new Date(c.called_at) >= today);
  const connected = todaysCalls.filter((c) => c.outcome === "connected").length;
  const interested = todaysCalls.filter((c) => c.outcome === "interested").length;
  const callbacks = todaysCalls.filter((c) => c.outcome === "callback").length;
  const pending = leads.filter((l) => ["new", "queued"].includes(l.status)).length;
  const conversionRate =
    todaysCalls.length > 0 ? ((connected + interested) / todaysCalls.length) * 100 : 0;

  const campaignPerformance: CampaignPerformance[] = campaigns.map((c) => {
    const campaignLeads = leads.filter((l) => l.campaign_id === c.id);
    return {
      campaignId: c.id,
      campaignName: c.name,
      leads: campaignLeads.length,
      converted: campaignLeads.filter((l) => l.status === "converted").length,
    };
  });

  return {
    computedAt: new Date().toISOString(),
    todaysCalls: todaysCalls.length,
    connected,
    interested,
    pending,
    callbacks,
    conversionRate,
    dailyTrend: buildDailyTrend(calls, 14),
    funnel: buildFunnel(leads),
    collegeDistribution: topN(groupCount(leads.map((l) => l.college)), 8),
    cityDistribution: topN(groupCount(leads.map((l) => l.city)), 8),
    campaignPerformance,
    leaderboard: await buildLeaderboard(todaysCalls),
  };
}
