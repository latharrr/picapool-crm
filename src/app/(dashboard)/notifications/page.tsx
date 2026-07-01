import { Bell } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Callback reminders, sync issues, and targets achieved."
      />
      <EmptyState
        icon={Bell}
        title="You're all caught up"
        description="New notifications are polled every 15-30 seconds and will appear here."
      />
    </div>
  );
}
