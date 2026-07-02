import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { RespondentCallStatus } from "@/lib/sheets/schema/research";

interface StatusConfig {
  status: RespondentCallStatus;
  label: string;
  key: string;
  tone: "success" | "warning" | "danger";
}

export const CALL_STATUSES: StatusConfig[] = [
  { status: "completed", label: "Completed", key: "1", tone: "success" },
  { status: "call_later", label: "Call Later", key: "2", tone: "warning" },
  { status: "refused", label: "Refused", key: "3", tone: "danger" },
  { status: "not_answered", label: "Not Answered", key: "4", tone: "warning" },
  { status: "wrong_number", label: "Wrong Number", key: "5", tone: "danger" },
];

const TONE_CLASSES: Record<StatusConfig["tone"], string> = {
  success: "border-success/30 text-success hover:bg-success/10",
  warning: "border-warning/30 text-warning hover:bg-warning/10",
  danger: "border-danger/30 text-danger hover:bg-danger/10",
};

export function CallStatusButtons({
  selected,
  onSelect,
  disabled,
}: {
  selected: RespondentCallStatus | null;
  onSelect: (status: RespondentCallStatus) => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
      {CALL_STATUSES.map((s) => (
        <Button
          key={s.status}
          type="button"
          variant="outline"
          disabled={disabled}
          onClick={() => onSelect(s.status)}
          className={cn(
            "flex h-auto flex-col items-center gap-1 py-3",
            TONE_CLASSES[s.tone],
            selected === s.status && "ring-2 ring-offset-1"
          )}
        >
          <span className="text-sm font-medium">{s.label}</span>
          <span className="rounded bg-black/5 px-1.5 py-0.5 text-[10px] font-mono">{s.key}</span>
        </Button>
      ))}
    </div>
  );
}
