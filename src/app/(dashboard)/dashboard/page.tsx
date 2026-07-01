import { LayoutDashboard } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Calling activity, conversion funnel, and campaign performance across your workspace."
      />
      <EmptyState
        icon={LayoutDashboard}
        title="Analytics will appear here"
        description="Once a workspace is provisioned and calls start coming in, this dashboard will show today's calls, conversion rate, and trend charts."
      />
    </div>
  );
}
