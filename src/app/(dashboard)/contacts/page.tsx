import { Contact } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { NoWorkspace } from "@/components/shared/no-workspace";
import { PermissionDenied } from "@/components/shared/permission-denied";
import { DataTable } from "@/components/shared/data-table";
import { CreateContactDialog } from "@/components/contacts/create-contact-dialog";
import { requireSession } from "@/lib/auth/session";
import { getActiveWorkspaceContext } from "@/lib/workspace-context";
import { hasPermission } from "@/lib/auth/rbac";
import { contactsRepository } from "@/lib/sheets/repositories";
import type { ContactRecord } from "@/lib/sheets/schema/crm";

export const dynamic = "force-dynamic";

export default async function ContactsPage() {
  const session = await requireSession();
  const ctx = await getActiveWorkspaceContext(session);

  if (!ctx) {
    return (
      <div className="space-y-6">
        <PageHeader title="Contacts" />
        <NoWorkspace />
      </div>
    );
  }
  if (!hasPermission(ctx.role, "VIEW")) {
    return (
      <div className="space-y-6">
        <PageHeader title="Contacts" />
        <PermissionDenied />
      </div>
    );
  }

  const contacts = await contactsRepository.list(ctx.spreadsheetId);
  const canEdit = hasPermission(ctx.role, "EDIT");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contacts"
        description="People and organizations linked to your leads and housing listings."
        actions={canEdit ? <CreateContactDialog workspaceId={ctx.workspaceId} /> : undefined}
      />
      <DataTable<ContactRecord>
        items={contacts}
        emptyIcon={Contact}
        emptyTitle="No contacts yet"
        emptyDescription="Contacts created from leads, housing listings, or manually will show up here."
        searchPlaceholder="Search name, phone, email..."
        searchFn={(c, q) =>
          [c.name, c.phone, c.email, c.relation].filter(Boolean).some((f) => f!.toLowerCase().includes(q))
        }
        columns={[
          { header: "Name", render: (c) => <span className="font-medium">{c.name}</span> },
          { header: "Phone", render: (c) => c.phone || "—" },
          { header: "Email", render: (c) => c.email || "—" },
          { header: "Relation", render: (c) => c.relation || "—" },
        ]}
      />
    </div>
  );
}
