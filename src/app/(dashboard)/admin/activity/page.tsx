import { PageHeader } from "@/components/shared/page-header";
import { NoWorkspace } from "@/components/shared/no-workspace";
import { PermissionDenied } from "@/components/shared/permission-denied";
import { ActivityLogTable } from "@/components/admin/activity-log-table";
import { requireSession } from "@/lib/auth/session";
import { getActiveWorkspaceContext } from "@/lib/workspace-context";
import { hasPermission } from "@/lib/auth/rbac";
import { activityLogRepository } from "@/lib/sheets/repositories";

export const dynamic = "force-dynamic";

export default async function AdminActivityPage() {
  const session = await requireSession();
  const ctx = await getActiveWorkspaceContext(session);

  if (!ctx) {
    return (
      <div className="space-y-6">
        <PageHeader title="Activity Log" />
        <NoWorkspace />
      </div>
    );
  }
  if (!hasPermission(ctx.role, "MANAGE_SETTINGS")) {
    return (
      <div className="space-y-6">
        <PageHeader title="Activity Log" />
        <PermissionDenied />
      </div>
    );
  }

  const entries = (await activityLogRepository.list(ctx.spreadsheetId, { includeDeleted: true })).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Activity Log"
        description="Append-only audit trail — every mutating action in this workspace writes one row here."
      />
      <ActivityLogTable entries={entries} />
    </div>
  );
}
