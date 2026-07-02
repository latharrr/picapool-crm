import { PageHeader } from "@/components/shared/page-header";
import { NoWorkspace } from "@/components/shared/no-workspace";
import { PermissionDenied } from "@/components/shared/permission-denied";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InterviewConsole } from "@/components/research/interview-console";
import { RespondentsTable } from "@/components/research/respondents-table";
import { CreateRespondentDialog } from "@/components/research/create-respondent-dialog";
import { StatCard } from "@/components/analytics/stat-card";
import { BarChartCard } from "@/components/analytics/bar-chart-card";
import { requireSession } from "@/lib/auth/session";
import { getActiveWorkspaceContext } from "@/lib/workspace-context";
import { hasPermission } from "@/lib/auth/rbac";
import { respondentsRepository } from "@/lib/sheets/repositories";
import { computeResearchStats } from "@/lib/research/aggregate";

export const dynamic = "force-dynamic";

export default async function ResearchPage() {
  const session = await requireSession();
  const ctx = await getActiveWorkspaceContext(session);

  if (!ctx) {
    return (
      <div className="space-y-6">
        <PageHeader title="Research" />
        <NoWorkspace />
      </div>
    );
  }
  if (!hasPermission(ctx.role, "CALL")) {
    return (
      <div className="space-y-6">
        <PageHeader title="Research" />
        <PermissionDenied />
      </div>
    );
  }

  const respondents = await respondentsRepository.list(ctx.spreadsheetId);
  const canEdit = hasPermission(ctx.role, "EDIT");
  const canViewDashboard = hasPermission(ctx.role, "VIEW_ANALYTICS");
  const stats = canViewDashboard ? await computeResearchStats(ctx.spreadsheetId) : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Research"
        description="User research interviews — call respondents, code the signals, and track North Star metrics."
      />
      <Tabs defaultValue="interview">
        <TabsList>
          <TabsTrigger value="interview">Interview</TabsTrigger>
          <TabsTrigger value="respondents">Respondents</TabsTrigger>
          {stats && <TabsTrigger value="dashboard">Dashboard</TabsTrigger>}
        </TabsList>
        <TabsContent value="interview" className="mt-4">
          <InterviewConsole workspaceId={ctx.workspaceId} />
        </TabsContent>
        <TabsContent value="respondents" className="mt-4 space-y-4">
          {canEdit && (
            <div className="flex justify-end">
              <CreateRespondentDialog workspaceId={ctx.workspaceId} />
            </div>
          )}
          <RespondentsTable respondents={respondents} />
        </TabsContent>
        {stats && (
          <TabsContent value="dashboard" className="mt-4 space-y-6">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard label="Total Respondents" value={stats.totalRespondents} />
              <StatCard label="Calls Attempted" value={stats.callsAttempted} />
              <StatCard label="Calls Pending" value={stats.callsPending} />
              <StatCard
                label="Coordination Success"
                value={`${stats.coordinationSuccessRate.toFixed(0)}%`}
                hint="North Star 1"
              />
              <StatCard
                label="Cross-JTBD Return Intent"
                value={`${stats.crossJtbdReturnRate.toFixed(0)}%`}
                hint="North Star 2"
              />
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-xl border border-border bg-card p-4">
                <h3 className="mb-3 text-sm font-semibold text-foreground">Call pipeline</h3>
                <BarChartCard data={stats.pipeline} dataKey="count" labelKey="stage" />
              </div>
              <div className="rounded-xl border border-border bg-card p-4">
                <h3 className="mb-3 text-sm font-semibold text-foreground">JTBD breakdown</h3>
                <BarChartCard data={stats.jtbdDistribution} dataKey="count" labelKey="label" />
              </div>
              <div className="rounded-xl border border-border bg-card p-4">
                <h3 className="mb-3 text-sm font-semibold text-foreground">Acquisition source</h3>
                <BarChartCard
                  data={stats.acquisitionDistribution}
                  dataKey="count"
                  labelKey="label"
                  color="#16a34a"
                />
              </div>
              <div className="rounded-xl border border-border bg-card p-4">
                <h3 className="mb-3 text-sm font-semibold text-foreground">Biggest friction</h3>
                <BarChartCard
                  data={stats.frictionDistribution}
                  dataKey="count"
                  labelKey="label"
                  color="#dc2626"
                />
              </div>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
