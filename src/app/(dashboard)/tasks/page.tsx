import { PageHeader } from "@/components/shared/page-header";
import { NoWorkspace } from "@/components/shared/no-workspace";
import { PermissionDenied } from "@/components/shared/permission-denied";
import { TasksTable } from "@/components/tasks/tasks-table";
import { CreateTaskDialog } from "@/components/tasks/create-task-dialog";
import { requireSession } from "@/lib/auth/session";
import { getActiveWorkspaceContext } from "@/lib/workspace-context";
import { hasPermission } from "@/lib/auth/rbac";
import { tasksRepository } from "@/lib/sheets/repositories";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const session = await requireSession();
  const ctx = await getActiveWorkspaceContext(session);

  if (!ctx) {
    return (
      <div className="space-y-6">
        <PageHeader title="Tasks" />
        <NoWorkspace />
      </div>
    );
  }
  if (!hasPermission(ctx.role, "VIEW")) {
    return (
      <div className="space-y-6">
        <PageHeader title="Tasks" />
        <PermissionDenied />
      </div>
    );
  }

  const tasks = await tasksRepository.list(ctx.spreadsheetId);
  const canEdit = hasPermission(ctx.role, "EDIT");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tasks"
        description="Follow-ups, callbacks, and reminders assigned across the team."
        actions={canEdit ? <CreateTaskDialog workspaceId={ctx.workspaceId} /> : undefined}
      />
      <TasksTable tasks={tasks} canEdit={canEdit} workspaceId={ctx.workspaceId} />
    </div>
  );
}
