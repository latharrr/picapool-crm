"use client";

import { History } from "lucide-react";
import { DataTable } from "@/components/shared/data-table";
import type { ActivityLogRecord } from "@/lib/sheets/schema/ops";

export function ActivityLogTable({ entries }: { entries: ActivityLogRecord[] }) {
  return (
    <DataTable<ActivityLogRecord>
      items={entries}
      emptyIcon={History}
      emptyTitle="No activity yet"
      searchPlaceholder="Search action, entity type..."
      searchFn={(e, q) =>
        [e.action, e.entity_type, e.actor_id].some((f) => f.toLowerCase().includes(q))
      }
      columns={[
        { header: "When", render: (e) => new Date(e.created_at).toLocaleString() },
        { header: "Actor", render: (e) => e.actor_id },
        { header: "Action", render: (e) => <span className="font-medium">{e.action}</span> },
        { header: "Entity", render: (e) => `${e.entity_type}:${e.entity_id}` },
      ]}
    />
  );
}
