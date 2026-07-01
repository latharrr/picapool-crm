import { Users, Plus, Upload, Download } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";

export default function LeadsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Leads"
        description="Every lead across sources, colleges, and campaigns in this workspace."
        actions={
          <>
            <Button variant="outline" size="sm">
              <Upload className="mr-1.5 h-4 w-4" /> Import
            </Button>
            <Button variant="outline" size="sm">
              <Download className="mr-1.5 h-4 w-4" /> Export
            </Button>
            <Button size="sm">
              <Plus className="mr-1.5 h-4 w-4" /> New Lead
            </Button>
          </>
        }
      />
      <EmptyState
        icon={Users}
        title="No leads yet"
        description="Import a CSV or add your first lead to start building your pipeline."
        action={
          <Button size="sm">
            <Plus className="mr-1.5 h-4 w-4" /> New Lead
          </Button>
        }
      />
    </div>
  );
}
