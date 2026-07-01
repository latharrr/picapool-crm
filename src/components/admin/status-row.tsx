import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type StatusLevel = "ok" | "error" | "warn";

const ICONS: Record<StatusLevel, React.ComponentType<{ className?: string }>> = {
  ok: CheckCircle2,
  error: XCircle,
  warn: AlertCircle,
};

const COLORS: Record<StatusLevel, string> = {
  ok: "text-success",
  error: "text-danger",
  warn: "text-warning",
};

export function StatusRow({
  label,
  detail,
  level,
}: {
  label: string;
  detail: string;
  level: StatusLevel;
}) {
  const Icon = ICONS[level];
  return (
    <div className="flex items-center justify-between border-b border-border py-3 last:border-b-0">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{detail}</p>
      </div>
      <Icon className={cn("h-5 w-5 shrink-0", COLORS[level])} />
    </div>
  );
}
