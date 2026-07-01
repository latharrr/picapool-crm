"use client";

import Link from "next/link";
import { Bell, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { useNotifications, useMarkNotificationRead } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";
import type { NotificationRecord } from "@/lib/sheets/schema/ops";
import { cn } from "@/lib/utils";

export function NotificationsList({
  workspaceId,
  initialData,
}: {
  workspaceId: string;
  initialData: NotificationRecord[];
}) {
  const { data: notifications = [] } = useNotifications(workspaceId, initialData);
  const markRead = useMarkNotificationRead(workspaceId);

  if (notifications.length === 0) {
    return (
      <EmptyState
        icon={Bell}
        title="You're all caught up"
        description="New notifications are polled every 20 seconds and will appear here."
      />
    );
  }

  return (
    <ul className="space-y-2">
      {notifications.map((n) => (
        <li
          key={n.id}
          className={cn(
            "flex items-start justify-between gap-3 rounded-xl border border-border bg-card p-4",
            !n.is_read && "border-primary/30 bg-primary/[0.02]"
          )}
        >
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">{n.title}</p>
            {n.body && <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>}
            <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
              <span>{formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</span>
              {n.link && (
                <Link href={n.link} className="font-medium text-primary hover:underline">
                  View
                </Link>
              )}
            </div>
          </div>
          {!n.is_read && (
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={() => markRead.mutate(n.id)}
              aria-label="Mark as read"
            >
              <Check className="h-4 w-4" />
            </Button>
          )}
        </li>
      ))}
    </ul>
  );
}
