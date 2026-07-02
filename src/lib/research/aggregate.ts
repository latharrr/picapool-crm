import { respondentsRepository } from "@/lib/sheets/repositories";
import type { DistributionSlice, FunnelStage } from "@/lib/analytics/aggregate";
import type { RespondentRecord } from "@/lib/sheets/schema/research";

export interface ResearchStats {
  totalRespondents: number;
  callsAttempted: number;
  callsPending: number;
  coordinationSuccessRate: number;
  crossJtbdReturnRate: number;
  pipeline: FunnelStage[];
  jtbdDistribution: DistributionSlice[];
  acquisitionDistribution: DistributionSlice[];
  frictionDistribution: DistributionSlice[];
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

const PIPELINE_STAGES: { stage: string; status: RespondentRecord["call_status"] }[] = [
  { stage: "Pending", status: "pending" },
  { stage: "Completed", status: "completed" },
  { stage: "Call Later", status: "call_later" },
  { stage: "Refused", status: "refused" },
  { stage: "Not Answered", status: "not_answered" },
  { stage: "Wrong Number", status: "wrong_number" },
];

export async function computeResearchStats(spreadsheetId: string): Promise<ResearchStats> {
  const respondents = await respondentsRepository.list(spreadsheetId);

  const completed = respondents.filter((r) => r.call_status === "completed");
  const callsPending = respondents.filter(
    (r) => r.call_status === "pending" || r.call_status === "call_later"
  ).length;
  const callsAttempted = respondents.length - callsPending;

  const coordinationSuccessRate =
    completed.length > 0
      ? (completed.filter((r) => r.coordination_success === "Success — Found & Coordinated")
          .length /
          completed.length) *
        100
      : 0;

  const crossJtbdReturnRate =
    completed.length > 0
      ? (completed.filter((r) => r.cross_jtbd_return === "Yes — Explicitly Stated").length /
          completed.length) *
        100
      : 0;

  const pipeline: FunnelStage[] = PIPELINE_STAGES.map(({ stage, status }) => ({
    stage,
    count: respondents.filter((r) => r.call_status === status).length,
  }));

  return {
    totalRespondents: respondents.length,
    callsAttempted,
    callsPending,
    coordinationSuccessRate,
    crossJtbdReturnRate,
    pipeline,
    jtbdDistribution: topN(groupCount(respondents.map((r) => r.jtbd)), 8),
    acquisitionDistribution: topN(groupCount(respondents.map((r) => r.acquisition_source)), 8),
    frictionDistribution: topN(groupCount(respondents.map((r) => r.biggest_friction)), 8),
  };
}
