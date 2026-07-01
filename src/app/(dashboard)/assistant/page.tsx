import { PageHeader } from "@/components/shared/page-header";
import { NoWorkspace } from "@/components/shared/no-workspace";
import { AssistantChat } from "@/components/assistant/assistant-chat";
import { requireSession } from "@/lib/auth/session";
import { getActiveWorkspaceContext } from "@/lib/workspace-context";

export const dynamic = "force-dynamic";

export default async function AssistantPage() {
  const session = await requireSession();
  const ctx = await getActiveWorkspaceContext(session);

  if (!ctx) {
    return (
      <div className="space-y-6">
        <PageHeader title="AI Assistant" />
        <NoWorkspace />
      </div>
    );
  }

  const workspaceName =
    session.user.workspaces.find((w) => w.id === ctx.workspaceId)?.name ?? "Active Workspace";

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Assistant"
        description="Interact with your workspace database, create tasks, and bulk import records using natural language."
      />
      <AssistantChat workspaceId={ctx.workspaceId} workspaceName={workspaceName} />
    </div>
  );
}
