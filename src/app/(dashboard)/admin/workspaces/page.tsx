import { Building2, Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";

export default function AdminWorkspacesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Workspaces"
        description="Each workspace auto-provisions its own Google Spreadsheet as its data store."
        actions={
          <Button size="sm">
            <Plus className="mr-1.5 h-4 w-4" /> New Workspace
          </Button>
        }
      />
      <EmptyState
        icon={Building2}
        title="No workspaces yet"
        description="Creating a workspace here calls the provisioning API, which creates a new spreadsheet with all operational tabs and shares it read-only with admins."
      />
    </div>
  );
}
