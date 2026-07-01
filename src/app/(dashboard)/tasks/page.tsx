import { CheckSquare, Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";

export default function TasksPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Tasks"
        description="Follow-ups, callbacks, and reminders assigned across the team."
        actions={
          <Button size="sm">
            <Plus className="mr-1.5 h-4 w-4" /> New Task
          </Button>
        }
      />
      <EmptyState
        icon={CheckSquare}
        title="No tasks yet"
        description="Tasks linked to leads or campaigns will show up here with due dates and status."
      />
    </div>
  );
}
