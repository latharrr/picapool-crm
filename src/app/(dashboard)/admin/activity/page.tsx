import { History } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { NoWorkspace } from "@/components/shared/no-workspace";
import { PermissionDenied } from "@/components/shared/permission-denied";
import { DataTable } from "@/components/shared/data-table";
import { requireSession } from "@/lib/auth/session";
import { getActiveWorkspaceContext } from "@/lib/workspace-context";
import { hasPermission } from "@/lib/auth/rbac";
import { activityLogRepository } from "@/lib/sheets/repositories";
import type { ActivityLogRecord } from "@/lib/sheets/schema/ops";

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
      <DataTable<ActivityLogRecord>
        items={entries}
        emptyIcon={History}
        emptyTitle="No activity yet"
        searchPlaceholder="Search action, entity type..."
        searchFn={(e, q) =>
          [e.action, e.entity_type, e.actor_id].some((f) => f.toLowerCase().includes(q))
        }
        columns={[
          { header: "When", render: (e) => new Date(e.created_at).toLocaleString() },
          { header: "Actor", render: (e) => e.actor_id },
          { header: "Action", render: (e) => <span className="font-medium">{e.action}</span> },
          { header: "Entity", render: (e) => `${e.entity_type}:${e.entity_id}` },
        ]}
      />
    </div>
  );
}
