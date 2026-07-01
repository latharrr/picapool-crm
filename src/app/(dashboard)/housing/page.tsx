import { PageHeader } from "@/components/shared/page-header";
import { NoWorkspace } from "@/components/shared/no-workspace";
import { PermissionDenied } from "@/components/shared/permission-denied";
import { HousingListingsTable } from "@/components/housing/housing-listings-table";
import { CreateListingDialog } from "@/components/housing/create-listing-dialog";
import { requireSession } from "@/lib/auth/session";
import { getActiveWorkspaceContext } from "@/lib/workspace-context";
import { hasPermission } from "@/lib/auth/rbac";
import { housingListingsRepository } from "@/lib/sheets/repositories";

export const dynamic = "force-dynamic";

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
      <HousingListingsTable listings={listings} />
    </div>
  );
}
