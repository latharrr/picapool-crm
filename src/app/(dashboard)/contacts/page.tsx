import { Contact, Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";

export default function ContactsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Contacts"
        description="People and organizations linked to your leads and housing listings."
        actions={
          <Button size="sm">
            <Plus className="mr-1.5 h-4 w-4" /> New Contact
          </Button>
        }
      />
      <EmptyState
        icon={Contact}
        title="No contacts yet"
        description="Contacts created from leads, housing listings, or manually will show up here."
      />
    </div>
  );
}
