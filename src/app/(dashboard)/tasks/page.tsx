import { CheckSquare } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { NoWorkspace } from "@/components/shared/no-workspace";
import { PermissionDenied } from "@/components/shared/permission-denied";
import { DataTable } from "@/components/shared/data-table";
import { CreateTaskDialog } from "@/components/tasks/create-task-dialog";
import { TaskStatusSelect } from "@/components/tasks/task-status-select";
import { Badge } from "@/components/ui/badge";
import { requireSession } from "@/lib/auth/session";
import { getActiveWorkspaceContext } from "@/lib/workspace-context";
import { hasPermission } from "@/lib/auth/rbac";
import { tasksRepository } from "@/lib/sheets/repositories";
import type { TaskRecord } from "@/lib/sheets/schema/engagement";

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
      <DataTable<TaskRecord>
        items={tasks}
        emptyIcon={CheckSquare}
        emptyTitle="No tasks yet"
        emptyDescription="Tasks linked to leads or campaigns will show up here with due dates and status."
        searchPlaceholder="Search title..."
        searchFn={(t, q) => t.title.toLowerCase().includes(q)}
        columns={[
          { header: "Title", render: (t) => <span className="font-medium">{t.title}</span> },
          { header: "Due", render: (t) => t.due_date || "—" },
          {
            header: "Priority",
            render: (t) => <Badge variant="outline" className="capitalize">{t.priority}</Badge>,
          },
          {
            header: "Status",
            render: (t) =>
              canEdit ? (
                <TaskStatusSelect task={t} workspaceId={ctx.workspaceId} />
              ) : (
                <span className="capitalize">{t.status.replace(/_/g, " ")}</span>
              ),
          },
        ]}
      />
    </div>
  );
}
