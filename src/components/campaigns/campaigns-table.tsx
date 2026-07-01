"use client";

import { Megaphone } from "lucide-react";
import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import type { CampaignRecord } from "@/lib/sheets/schema/engagement";

export function CampaignsTable({
  campaigns,
  leadCounts,
}: {
  campaigns: CampaignRecord[];
  leadCounts: Record<string, number>;
}) {
  return (
    <DataTable<CampaignRecord>
      items={campaigns}
      emptyIcon={Megaphone}
      emptyTitle="No campaigns yet"
      emptyDescription="Create a campaign to start tagging leads and tracking performance by source."
      searchPlaceholder="Search campaigns..."
      searchFn={(c, q) => c.name.toLowerCase().includes(q)}
      columns={[
        { header: "Name", render: (c) => <span className="font-medium">{c.name}</span> },
        { header: "Source", render: (c) => c.source || "—" },
        {
          header: "Status",
          render: (c) => <Badge variant="outline" className="capitalize">{c.status}</Badge>,
        },
        { header: "Leads", render: (c) => leadCounts[c.id] ?? 0 },
      ]}
    />
  );
}
