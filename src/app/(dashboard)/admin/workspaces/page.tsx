import { Building2, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { PermissionDenied } from "@/components/shared/permission-denied";
import { CreateWorkspaceDialog } from "@/components/admin/create-workspace-dialog";
import { requireSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/rbac";
import { workspacesRepository } from "@/lib/sheets/repositories";
import { getRootSpreadsheetId, getGoogleCredentials } from "@/lib/env";

import { ManageMembersDialog } from "@/components/admin/manage-members-dialog";

export const dynamic = "force-dynamic";

export default async function AdminWorkspacesPage() {
  const session = await requireSession();
  if (!hasPermission(session.user.role, "MANAGE_SETTINGS")) {
    return (
      <div className="space-y-6">
        <PageHeader title="Workspaces" />
        <PermissionDenied />
      </div>
    );
  }

  const rootId = getRootSpreadsheetId();
  const workspaces = rootId ? await workspacesRepository.list(rootId) : [];
  const serviceAccountEmail = getGoogleCredentials()?.email;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Workspaces"
        description="Each workspace auto-provisions its own Google Spreadsheet as its data store."
        actions={<CreateWorkspaceDialog serviceAccountEmail={serviceAccountEmail} />}
      />

      {workspaces.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No workspaces yet"
          description="Creating a workspace here calls the provisioning API, which creates a new spreadsheet with all operational tabs and shares it read-only with admins."
          action={<CreateWorkspaceDialog serviceAccountEmail={serviceAccountEmail} />}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workspaces.map((ws) => (
            <div key={ws.id} className="flex flex-col justify-between rounded-xl border border-border bg-card p-4">
              <div>
                <p className="text-sm font-semibold text-foreground">{ws.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {ws.admin_emails.length} admin{ws.admin_emails.length === 1 ? "" : "s"} with view access
                </p>
                <a
                  href={`https://docs.google.com/spreadsheets/d/${ws.spreadsheet_id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline animate-fade-in"
                >
                  Open spreadsheet <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <div className="mt-4 pt-3 border-t border-border">
                <ManageMembersDialog workspaceId={ws.id} workspaceName={ws.name} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
