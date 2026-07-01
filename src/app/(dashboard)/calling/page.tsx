import { Phone } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";

export default function CallingPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Calling"
        description="Work through your queue one lead at a time with keyboard shortcuts."
      />
      <EmptyState
        icon={Phone}
        title="No leads in the queue"
        description="Start calling to have the server lock and hand you the next unassigned lead."
        action={<Button size="sm">Start Calling</Button>}
      />
    </div>
  );
}
