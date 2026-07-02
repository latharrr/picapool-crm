import { Users } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { NoWorkspace } from "@/components/shared/no-workspace";
import { PermissionDenied } from "@/components/shared/permission-denied";
import { CreateLeadDialog } from "@/components/leads/create-lead-dialog";
import { ImportLeadsDialog } from "@/components/leads/import-leads-dialog";
import { ExportLeadsButton } from "@/components/leads/export-leads-button";
import { AssignLeadsDialog, type AssignableMember } from "@/components/leads/assign-leads-dialog";
import { LeadsTable } from "@/components/leads/leads-table";
import { requireSession } from "@/lib/auth/session";
import { getActiveWorkspaceContext } from "@/lib/workspace-context";
import { hasPermission } from "@/lib/auth/rbac";
import { getRootSpreadsheetId } from "@/lib/env";
import { leadsRepository, usersRepository, userWorkspacesRepository } from "@/lib/sheets/repositories";
import { QUEUE_STATUSES } from "@/lib/calling";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  const session = await requireSession();
  const ctx = await getActiveWorkspaceContext(session);

  if (!ctx) {
    return (
      <div className="space-y-6">
        <PageHeader title="Leads" />
        <NoWorkspace />
      </div>
    );
  }

  if (!hasPermission(ctx.role, "VIEW")) {
    return (
      <div className="space-y-6">
        <PageHeader title="Leads" />
        <PermissionDenied />
      </div>
    );
  }

  const leads = await leadsRepository.list(ctx.spreadsheetId);
  const canEdit = hasPermission(ctx.role, "EDIT");
  const canImport = hasPermission(ctx.role, "IMPORT");
  const canExport = hasPermission(ctx.role, "EXPORT");
  const canAssign = hasPermission(ctx.role, "VIEW_ANALYTICS");

  let assignableMembers: AssignableMember[] = [];
  if (canAssign) {
    const rootId = getRootSpreadsheetId();
    if (rootId) {
      const [memberships, users] = await Promise.all([
        userWorkspacesRepository.list(rootId),
        usersRepository.list(rootId),
      ]);
      const userMap = new Map(users.map((u) => [u.id, u]));
      assignableMembers = memberships
        .filter((m) => m.workspace_id === ctx.workspaceId && hasPermission(m.role, "CALL"))
        .map((m) => ({
          userId: m.user_id,
          name: userMap.get(m.user_id)?.name ?? "Unknown user",
          role: m.role,
        }));
    }
  }
  const unassignedCount = leads.filter(
    (lead) => !lead.owner_id && QUEUE_STATUSES.includes(lead.status)
  ).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leads"
        description="Every lead across sources, colleges, and campaigns in this workspace."
        actions={
          <>
            {canImport && <ImportLeadsDialog workspaceId={ctx.workspaceId} />}
            {canAssign && (
              <AssignLeadsDialog
                workspaceId={ctx.workspaceId}
                members={assignableMembers}
                unassignedCount={unassignedCount}
              />
            )}
            {canExport && <ExportLeadsButton leads={leads} />}
            {canEdit && <CreateLeadDialog workspaceId={ctx.workspaceId} />}
          </>
        }
      />

      {leads.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No leads yet"
          description="Import a CSV or add your first lead to start building your pipeline."
          action={canEdit ? <CreateLeadDialog workspaceId={ctx.workspaceId} /> : undefined}
        />
      ) : (
        <LeadsTable leads={leads} />
      )}
    </div>
  );
}
