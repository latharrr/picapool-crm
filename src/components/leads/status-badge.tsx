import { Badge } from "@/components/ui/badge";
import type { LeadStatus } from "@/lib/sheets/schema/crm";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<LeadStatus, string> = {
  new: "bg-secondary text-foreground border-border",
  queued: "bg-secondary text-foreground border-border",
  connected: "bg-success/10 text-success border-success/20",
  interested: "bg-success/10 text-success border-success/20",
  callback: "bg-warning/10 text-warning border-warning/20",
  busy: "bg-warning/10 text-warning border-warning/20",
  no_answer: "bg-warning/10 text-warning border-warning/20",
  wrong_number: "bg-danger/10 text-danger border-danger/20",
  spam: "bg-danger/10 text-danger border-danger/20",
  converted: "bg-success/10 text-success border-success/20",
  closed: "bg-muted text-muted-foreground border-border",
  pitched: "bg-secondary text-foreground border-border",
  not_interested: "bg-danger/10 text-danger border-danger/20",
};

export function StatusBadge({ status }: { status: LeadStatus }) {
  return (
    <Badge variant="outline" className={cn("capitalize", STATUS_STYLES[status])}>
      {status.replace(/_/g, " ")}
    </Badge>
  );
}
