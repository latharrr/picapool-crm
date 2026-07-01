"use client";

import { Home } from "lucide-react";
import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import type { HousingListingRecord } from "@/lib/sheets/schema/ops";

const AVAILABILITY_STYLES: Record<HousingListingRecord["availability_status"], string> = {
  available: "bg-success/10 text-success border-success/20",
  booked: "bg-warning/10 text-warning border-warning/20",
  unavailable: "bg-muted text-muted-foreground border-border",
};

export function HousingListingsTable({ listings }: { listings: HousingListingRecord[] }) {
  return (
    <DataTable<HousingListingRecord>
      items={listings}
      emptyIcon={Home}
      emptyTitle="No listings yet"
      emptyDescription="Housing listings will show up here with availability and linked leads."
      searchPlaceholder="Search title, address, city..."
      searchFn={(l, q) =>
        [l.title, l.address, l.city].filter(Boolean).some((f) => f!.toLowerCase().includes(q))
      }
      columns={[
        { header: "Title", render: (l) => <span className="font-medium">{l.title}</span> },
        { header: "City", render: (l) => l.city || "—" },
        {
          header: "Rent",
          render: (l) => (l.rent_amount != null ? `₹${l.rent_amount.toLocaleString()}` : "—"),
        },
        {
          header: "Status",
          render: (l) => (
            <Badge
              variant="outline"
              className={`capitalize ${AVAILABILITY_STYLES[l.availability_status]}`}
            >
              {l.availability_status}
            </Badge>
          ),
        },
      ]}
    />
  );
}
