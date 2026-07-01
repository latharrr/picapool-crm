import { Settings } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Workspace-level settings and feature flags, stored in the Settings tab of this workspace's spreadsheet."
      />
      <EmptyState
        icon={Settings}
        title="No settings loaded"
        description="Feature toggles for Calling, Housing, Campaigns, Messages, and Analytics will appear here once a workspace is selected."
      />
    </div>
  );
}
