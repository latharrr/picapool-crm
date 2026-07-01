import { UserCog, Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="Manage who can access this workspace and what role they hold."
        actions={
          <Button size="sm">
            <Plus className="mr-1.5 h-4 w-4" /> Invite User
          </Button>
        }
      />
      <EmptyState
        icon={UserCog}
        title="No users yet"
        description="Once the root spreadsheet is provisioned, users and their workspace assignments will show here."
      />
    </div>
  );
}
