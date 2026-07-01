import { PageHeader } from "@/components/shared/page-header";
import { NoWorkspace } from "@/components/shared/no-workspace";
import { PermissionDenied } from "@/components/shared/permission-denied";
import { CampaignsTable } from "@/components/campaigns/campaigns-table";
import { CreateCampaignDialog } from "@/components/campaigns/create-campaign-dialog";
import { requireSession } from "@/lib/auth/session";
import { getActiveWorkspaceContext } from "@/lib/workspace-context";
import { hasPermission } from "@/lib/auth/rbac";
import { campaignsRepository, leadsRepository } from "@/lib/sheets/repositories";

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

  const leadCounts = Object.fromEntries(leadCountByCampaign.entries());

  return (
    <div className="space-y-6">
      <PageHeader
        title="Campaigns"
        description="Outreach campaigns and their lead-to-conversion performance."
        actions={canEdit ? <CreateCampaignDialog workspaceId={ctx.workspaceId} /> : undefined}
      />
      <CampaignsTable campaigns={campaigns} leadCounts={leadCounts} />
    </div>
  );
}
