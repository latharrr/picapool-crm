import { Megaphone, Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";

export default function CampaignsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Campaigns"
        description="Outreach campaigns and their lead-to-conversion performance."
        actions={
          <Button size="sm">
            <Plus className="mr-1.5 h-4 w-4" /> New Campaign
          </Button>
        }
      />
      <EmptyState
        icon={Megaphone}
        title="No campaigns yet"
        description="Create a campaign to start tagging leads and tracking performance by source."
      />
    </div>
  );
}
