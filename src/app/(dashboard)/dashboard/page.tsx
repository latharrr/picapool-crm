import { PageHeader } from "@/components/shared/page-header";
import { NoWorkspace } from "@/components/shared/no-workspace";
import { PermissionDenied } from "@/components/shared/permission-denied";
import { StatCard } from "@/components/analytics/stat-card";
import { TrendChart } from "@/components/analytics/trend-chart";
import { BarChartCard } from "@/components/analytics/bar-chart-card";
import { LeaderboardTable } from "@/components/analytics/leaderboard-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { Megaphone } from "lucide-react";
import { requireSession } from "@/lib/auth/session";
import { getActiveWorkspaceContext } from "@/lib/workspace-context";
import { hasPermission } from "@/lib/auth/rbac";
import { getOrComputeDashboardStats } from "@/lib/analytics/cache";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await requireSession();
  const ctx = await getActiveWorkspaceContext(session);

  if (!ctx) {
    return (
      <div className="space-y-6">
        <PageHeader title="Dashboard" />
        <NoWorkspace />
      </div>
    );
  }

  if (!hasPermission(ctx.role, "VIEW_ANALYTICS")) {
    return (
      <div className="space-y-6">
        <PageHeader title="Dashboard" />
        <PermissionDenied />
      </div>
    );
  }

  const stats = await getOrComputeDashboardStats(ctx.spreadsheetId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Calling activity, conversion funnel, and campaign performance across your workspace."
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Today's Calls" value={stats.todaysCalls} />
        <StatCard label="Connected" value={stats.connected} />
        <StatCard label="Interested" value={stats.interested} />
        <StatCard label="Pending" value={stats.pending} />
        <StatCard label="Callbacks" value={stats.callbacks} />
        <StatCard label="Conversion Rate" value={`${stats.conversionRate.toFixed(1)}%`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Calls trend (last 14 days)">
          <TrendChart data={stats.dailyTrend} />
        </ChartCard>
        <ChartCard title="Conversion funnel">
          <BarChartCard data={stats.funnel} dataKey="count" labelKey="stage" />
        </ChartCard>
        <ChartCard title="Top colleges">
          <BarChartCard data={stats.collegeDistribution} dataKey="count" labelKey="label" />
        </ChartCard>
        <ChartCard title="Top cities">
          <BarChartCard data={stats.cityDistribution} dataKey="count" labelKey="label" color="#16a34a" />
        </ChartCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Campaign performance">
          {stats.campaignPerformance.length === 0 ? (
            <EmptyState icon={Megaphone} title="No campaigns yet" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign</TableHead>
                  <TableHead className="text-right">Leads</TableHead>
                  <TableHead className="text-right">Converted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.campaignPerformance.map((c) => (
                  <TableRow key={c.campaignId}>
                    <TableCell className="font-medium">{c.campaignName}</TableCell>
                    <TableCell className="text-right">{c.leads}</TableCell>
                    <TableCell className="text-right">{c.converted}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </ChartCard>
        <ChartCard title="Intern leaderboard (today)">
          <LeaderboardTable entries={stats.leaderboard} />
        </ChartCard>
      </div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="mb-3 text-sm font-semibold text-foreground">{title}</h3>
      {children}
    </div>
  );
}
