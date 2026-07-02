import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CallOutcome } from "@/lib/sheets/schema/engagement";

interface OutcomeConfig {
  outcome: CallOutcome;
  label: string;
  key: string;
  tone: "success" | "warning" | "danger";
}

export const OUTCOMES: OutcomeConfig[] = [
  { outcome: "connected", label: "Connected", key: "1", tone: "success" },
  { outcome: "interested", label: "Interested", key: "2", tone: "success" },
  { outcome: "callback", label: "Callback", key: "3", tone: "warning" },
  { outcome: "busy", label: "Busy", key: "4", tone: "warning" },
  { outcome: "wrong_number", label: "Wrong Number", key: "5", tone: "danger" },
  { outcome: "spam", label: "Spam", key: "6", tone: "danger" },
  { outcome: "no_answer", label: "No Answer", key: "7", tone: "warning" },
];

/** Call Status options for PG-listing leads (see the PG Demand & Supply workspace). */
export const PG_OUTCOMES: OutcomeConfig[] = [
  { outcome: "pitched", label: "Pitched", key: "1", tone: "success" },
  { outcome: "no_answer", label: "Not Answered", key: "2", tone: "warning" },
  { outcome: "callback", label: "Callback", key: "3", tone: "warning" },
  { outcome: "not_interested", label: "Not Interested", key: "4", tone: "danger" },
];

const TONE_CLASSES: Record<OutcomeConfig["tone"], string> = {
  success: "border-success/30 text-success hover:bg-success/10",
  warning: "border-warning/30 text-warning hover:bg-warning/10",
  danger: "border-danger/30 text-danger hover:bg-danger/10",
};

export function OutcomeButtons({
  onSelect,
  disabled,
  outcomes = OUTCOMES,
}: {
  onSelect: (outcome: CallOutcome) => void;
  disabled?: boolean;
  outcomes?: OutcomeConfig[];
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {outcomes.map((o) => (
        <Button
          key={o.outcome}
          type="button"
          variant="outline"
          disabled={disabled}
          onClick={() => onSelect(o.outcome)}
          className={cn("flex h-auto flex-col items-center gap-1 py-3", TONE_CLASSES[o.tone])}
        >
          <span className="text-sm font-medium">{o.label}</span>
          <span className="rounded bg-black/5 px-1.5 py-0.5 text-[10px] font-mono">{o.key}</span>
        </Button>
      ))}
    </div>
  );
}
