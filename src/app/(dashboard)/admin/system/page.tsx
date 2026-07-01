import { Activity } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";

export default function AdminSystemPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="System Health"
        description="Sheets/KV connectivity, cache freshness per tab, and last cron run."
      />
      <EmptyState
        icon={Activity}
        title="Health checks not wired up yet"
        description="This page will report Google service account status, KV connectivity, per-tab cache age, and the last successful cron run."
      />
    </div>
  );
}
