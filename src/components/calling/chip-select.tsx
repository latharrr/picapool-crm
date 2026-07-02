"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ChipOption<T extends string> {
  value: T;
  label: string;
}

/** Generic one-tap chip group — used for Gender, Stage, Priority, Follow-up on PG leads. */
export function ChipSelect<T extends string>({
  label,
  options,
  value,
  onChange,
  disabled,
}: {
  label: string;
  options: readonly ChipOption<T>[];
  value?: T;
  onChange: (value: T) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-medium text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <Button
            key={opt.value}
            type="button"
            size="sm"
            variant={value === opt.value ? "default" : "outline"}
            disabled={disabled}
            onClick={() => onChange(opt.value)}
            className={cn("h-7 px-2.5 text-xs", value !== opt.value && "text-muted-foreground")}
          >
            {opt.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
