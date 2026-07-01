import { Megaphone } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { NoWorkspace } from "@/components/shared/no-workspace";
import { PermissionDenied } from "@/components/shared/permission-denied";
import { DataTable } from "@/components/shared/data-table";
import { CreateCampaignDialog } from "@/components/campaigns/create-campaign-dialog";
import { Badge } from "@/components/ui/badge";
import { requireSession } from "@/lib/auth/session";
import { getActiveWorkspaceContext } from "@/lib/workspace-context";
import { hasPermission } from "@/lib/auth/rbac";
import { campaignsRepository, leadsRepository } from "@/lib/sheets/repositories";
import type { CampaignRecord } from "@/lib/sheets/schema/engagement";

export const dynamic = "force-dynamic";

export default async function CampaignsPage() {
  const session = await requireSession();
  const ctx = await getActiveWorkspaceContext(session);

  if (!ctx) {
    return (
      <div className="space-y-6">
        <PageHeader title="Campaigns" />
        <NoWorkspace />
      </div>
    );
  }
  if (!hasPermission(ctx.role, "VIEW")) {
    return (
      <div className="space-y-6">
        <PageHeader title="Campaigns" />
        <PermissionDenied />
      </div>
    );
  }

  const [campaigns, leads] = await Promise.all([
    campaignsRepository.list(ctx.spreadsheetId),
    leadsRepository.list(ctx.spreadsheetId),
  ]);
  const canEdit = hasPermission(ctx.role, "EDIT");
  const leadCountByCampaign = new Map<string, number>();
  for (const lead of leads) {
    if (!lead.campaign_id) continue;
    leadCountByCampaign.set(lead.campaign_id, (leadCountByCampaign.get(lead.campaign_id) ?? 0) + 1);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Campaigns"
        description="Outreach campaigns and their lead-to-conversion performance."
        actions={canEdit ? <CreateCampaignDialog workspaceId={ctx.workspaceId} /> : undefined}
      />
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
          { header: "Leads", render: (c) => leadCountByCampaign.get(c.id) ?? 0 },
        ]}
      />
    </div>
  );
}
