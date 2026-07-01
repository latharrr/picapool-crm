import { Home, Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";

export default function HousingPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Housing Listings"
        description="Available housing inventory shared with leads."
        actions={
          <Button size="sm">
            <Plus className="mr-1.5 h-4 w-4" /> New Listing
          </Button>
        }
      />
      <EmptyState
        icon={Home}
        title="No listings yet"
        description="Housing listings will show up here with availability and linked leads."
      />
    </div>
  );
}
