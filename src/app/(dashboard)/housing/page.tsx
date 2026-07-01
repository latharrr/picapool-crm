import { Home } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { NoWorkspace } from "@/components/shared/no-workspace";
import { PermissionDenied } from "@/components/shared/permission-denied";
import { DataTable } from "@/components/shared/data-table";
import { CreateListingDialog } from "@/components/housing/create-listing-dialog";
import { Badge } from "@/components/ui/badge";
import { requireSession } from "@/lib/auth/session";
import { getActiveWorkspaceContext } from "@/lib/workspace-context";
import { hasPermission } from "@/lib/auth/rbac";
import { housingListingsRepository } from "@/lib/sheets/repositories";
import type { HousingListingRecord } from "@/lib/sheets/schema/ops";

export const dynamic = "force-dynamic";

const AVAILABILITY_STYLES: Record<HousingListingRecord["availability_status"], string> = {
  available: "bg-success/10 text-success border-success/20",
  booked: "bg-warning/10 text-warning border-warning/20",
  unavailable: "bg-muted text-muted-foreground border-border",
};

export default async function HousingPage() {
  const session = await requireSession();
  const ctx = await getActiveWorkspaceContext(session);

  if (!ctx) {
    return (
      <div className="space-y-6">
        <PageHeader title="Housing Listings" />
        <NoWorkspace />
      </div>
    );
  }
  if (!hasPermission(ctx.role, "VIEW")) {
    return (
      <div className="space-y-6">
        <PageHeader title="Housing Listings" />
        <PermissionDenied />
      </div>
    );
  }

  const listings = await housingListingsRepository.list(ctx.spreadsheetId);
  const canEdit = hasPermission(ctx.role, "EDIT");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Housing Listings"
        description="Available housing inventory shared with leads."
        actions={canEdit ? <CreateListingDialog workspaceId={ctx.workspaceId} /> : undefined}
      />
      <DataTable<HousingListingRecord>
        items={listings}
        emptyIcon={Home}
        emptyTitle="No listings yet"
        emptyDescription="Housing listings will show up here with availability and linked leads."
        searchPlaceholder="Search title, address, city..."
        searchFn={(l, q) =>
          [l.title, l.address, l.city].filter(Boolean).some((f) => f!.toLowerCase().includes(q))
        }
        columns={[
          { header: "Title", render: (l) => <span className="font-medium">{l.title}</span> },
          { header: "City", render: (l) => l.city || "—" },
          {
            header: "Rent",
            render: (l) => (l.rent_amount != null ? `₹${l.rent_amount.toLocaleString()}` : "—"),
          },
          {
            header: "Status",
            render: (l) => (
              <Badge
                variant="outline"
                className={`capitalize ${AVAILABILITY_STYLES[l.availability_status]}`}
              >
                {l.availability_status}
              </Badge>
            ),
          },
        ]}
      />
    </div>
  );
}
