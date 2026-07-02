"use client";

import { ClipboardList } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/shared/data-table";
import { CALL_STATUS_OPTIONS } from "@/lib/research/taxonomy-options";
import type { RespondentRecord } from "@/lib/sheets/schema/research";

const STATUS_LABEL = new Map(CALL_STATUS_OPTIONS.map((o) => [o.value, o.label]));

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-secondary text-foreground border-border",
  completed: "bg-success/10 text-success border-success/20",
  call_later: "bg-warning/10 text-warning border-warning/20",
  refused: "bg-danger/10 text-danger border-danger/20",
  not_answered: "bg-warning/10 text-warning border-warning/20",
  wrong_number: "bg-danger/10 text-danger border-danger/20",
};

export function RespondentsTable({ respondents }: { respondents: RespondentRecord[] }) {
  return (
    <DataTable<RespondentRecord>
      items={respondents}
      emptyIcon={ClipboardList}
      emptyTitle="No respondents yet"
      emptyDescription="Import interview data or add a respondent to start the queue."
      searchPlaceholder="Search name, phone, username..."
      searchFn={(r, q) =>
        [r.name, r.phone, r.username].filter(Boolean).some((f) => f!.toLowerCase().includes(q))
      }
      columns={[
        { header: "Name", render: (r) => <span className="font-medium">{r.name}</span> },
        { header: "Phone", render: (r) => r.phone },
        {
          header: "Call Status",
          render: (r) => (
            <Badge variant="outline" className={STATUS_STYLES[r.call_status]}>
              {STATUS_LABEL.get(r.call_status) ?? r.call_status}
            </Badge>
          ),
        },
        { header: "JTBD", render: (r) => r.jtbd || "—" },
        { header: "Coordination", render: (r) => r.coordination_success || "—" },
      ]}
    />
  );
}
