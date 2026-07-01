import { PageHeader } from "@/components/shared/page-header";
import { NoWorkspace } from "@/components/shared/no-workspace";
import { PermissionDenied } from "@/components/shared/permission-denied";
import { CallConsole } from "@/components/calling/call-console";
import { requireSession } from "@/lib/auth/session";
import { getActiveWorkspaceContext } from "@/lib/workspace-context";
import { hasPermission } from "@/lib/auth/rbac";

export const dynamic = "force-dynamic";

export default async function CallingPage() {
  const session = await requireSession();
  const ctx = await getActiveWorkspaceContext(session);

  if (!ctx) {
    return (
      <div className="space-y-6">
        <PageHeader title="Calling" />
        <NoWorkspace />
      </div>
    );
  }

  if (!hasPermission(ctx.role, "CALL")) {
    return (
      <div className="space-y-6">
        <PageHeader title="Calling" />
        <PermissionDenied />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Calling"
        description="Work through your queue one lead at a time with keyboard shortcuts."
      />
      <CallConsole workspaceId={ctx.workspaceId} />
    </div>
  );
}
