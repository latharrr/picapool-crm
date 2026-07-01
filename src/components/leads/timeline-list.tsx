import { Phone, MessageSquare, Mail, StickyNote } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import type { TimelineEntry, TimelineEntryType } from "@/lib/leads/timeline";
import { formatDistanceToNow } from "date-fns";

const ICONS: Record<TimelineEntryType, React.ComponentType<{ className?: string }>> = {
  call: Phone,
  message: MessageSquare,
  email: Mail,
  note: StickyNote,
};

export function TimelineList({ entries }: { entries: TimelineEntry[] }) {
  if (entries.length === 0) {
    return <EmptyState icon={StickyNote} title="No activity yet" description="Calls, messages, emails, and notes for this lead will appear here." />;
  }

  return (
    <ol className="space-y-4">
      {entries.map((entry) => {
        const Icon = ICONS[entry.type];
        return (
          <li key={`${entry.type}-${entry.id}`} className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary">
              <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1 rounded-xl border border-border bg-card p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-foreground">{entry.summary}</p>
                <p className="shrink-0 text-xs text-muted-foreground">
                  {safeDistance(entry.timestamp)}
                </p>
              </div>
              {entry.detail && (
                <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                  {entry.detail}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function safeDistance(timestamp: string): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "";
  return formatDistanceToNow(date, { addSuffix: true });
}
