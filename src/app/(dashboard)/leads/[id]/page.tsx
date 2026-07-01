import { UserCircle } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      <PageHeader title="Lead detail" description={`Lead ID: ${id}`} />
      <EmptyState
        icon={UserCircle}
        title="Lead not found"
        description="This lead couldn't be loaded. Once the Sheets data layer is connected, this page will show contact info, notes, and the full activity timeline."
      />
    </div>
  );
}
