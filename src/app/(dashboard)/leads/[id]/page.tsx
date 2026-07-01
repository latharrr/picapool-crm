import { UserCircle } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { NoWorkspace } from "@/components/shared/no-workspace";
import { PermissionDenied } from "@/components/shared/permission-denied";
import { StatusBadge } from "@/components/leads/status-badge";
import { TimelineList } from "@/components/leads/timeline-list";
import { LeadQuickEdit } from "@/components/leads/lead-quick-edit";
import { requireSession } from "@/lib/auth/session";
import { getActiveWorkspaceContext } from "@/lib/workspace-context";
import { hasPermission } from "@/lib/auth/rbac";
import { leadsRepository } from "@/lib/sheets/repositories";
import { getLeadTimeline } from "@/lib/leads/timeline";

export const dynamic = "force-dynamic";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();
  const ctx = await getActiveWorkspaceContext(session);

  if (!ctx) {
    return (
      <div className="space-y-6">
        <PageHeader title="Lead detail" />
        <NoWorkspace />
      </div>
    );
  }
  if (!hasPermission(ctx.role, "VIEW")) {
    return (
      <div className="space-y-6">
        <PageHeader title="Lead detail" />
        <PermissionDenied />
      </div>
    );
  }

  const lead = await leadsRepository.getById(ctx.spreadsheetId, id);
  if (!lead) {
    return (
      <div className="space-y-6">
        <PageHeader title="Lead detail" description={`Lead ID: ${id}`} />
        <EmptyState icon={UserCircle} title="Lead not found" />
      </div>
    );
  }

  const timeline = await getLeadTimeline(ctx.spreadsheetId, id);
  const canEdit = hasPermission(ctx.role, "EDIT");

  return (
    <div className="space-y-6">
      <PageHeader
        title={lead.name}
        description={lead.phone}
        actions={<StatusBadge status={lead.status} />}
      />

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-sm font-semibold text-foreground">Details</h3>
            <dl className="mt-3 space-y-2 text-sm">
              <Detail label="Email" value={lead.email} />
              <Detail label="College" value={lead.college} />
              <Detail label="University" value={lead.university} />
              <Detail label="Year" value={lead.year} />
              <Detail label="City" value={lead.city} />
              <Detail label="Source" value={lead.source} />
              <Detail label="Priority" value={lead.priority} className="capitalize" />
            </dl>
          </div>

          {canEdit && (
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="mb-3 text-sm font-semibold text-foreground">Update</h3>
              <LeadQuickEdit lead={lead} workspaceId={ctx.workspaceId} />
            </div>
          )}
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold text-foreground">Activity timeline</h3>
          <TimelineList entries={timeline} />
        </div>
      </div>
    </div>
  );
}

function Detail({
  label,
  value,
  className,
}: {
  label: string;
  value?: string;
  className?: string;
}) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={className}>{value || "—"}</dd>
    </div>
  );
}
