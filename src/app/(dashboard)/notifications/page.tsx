import { PageHeader } from "@/components/shared/page-header";
import { NoWorkspace } from "@/components/shared/no-workspace";
import { NotificationsList } from "@/components/notifications/notifications-list";
import { requireSession } from "@/lib/auth/session";
import { getActiveWorkspaceContext } from "@/lib/workspace-context";
import { notificationsRepository } from "@/lib/sheets/repositories";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const session = await requireSession();
  const ctx = await getActiveWorkspaceContext(session);

  if (!ctx) {
    return (
      <div className="space-y-6">
        <PageHeader title="Notifications" />
        <NoWorkspace />
      </div>
    );
  }

  const all = await notificationsRepository.list(ctx.spreadsheetId);
  const mine = all
    .filter((n) => n.user_id === session.user.id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Callback reminders, sync issues, and targets achieved."
      />
      <NotificationsList workspaceId={ctx.workspaceId} initialData={mine} />
    </div>
  );
}
