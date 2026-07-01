"use client";

import { CheckSquare } from "lucide-react";
import { DataTable } from "@/components/shared/data-table";
import { TaskStatusSelect } from "@/components/tasks/task-status-select";
import { Badge } from "@/components/ui/badge";
import type { TaskRecord } from "@/lib/sheets/schema/engagement";

export function TasksTable({
  tasks,
  canEdit,
  workspaceId,
}: {
  tasks: TaskRecord[];
  canEdit: boolean;
  workspaceId: string;
}) {
  return (
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
              <TaskStatusSelect task={t} workspaceId={workspaceId} />
            ) : (
              <span className="capitalize">{t.status.replace(/_/g, " ")}</span>
            ),
        },
      ]}
    />
  );
}
