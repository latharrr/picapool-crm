import { PageHeader } from "@/components/shared/page-header";
import { NoWorkspace } from "@/components/shared/no-workspace";
import { PermissionDenied } from "@/components/shared/permission-denied";
import { ContactsTable } from "@/components/contacts/contacts-table";
import { CreateContactDialog } from "@/components/contacts/create-contact-dialog";
import { requireSession } from "@/lib/auth/session";
import { getActiveWorkspaceContext } from "@/lib/workspace-context";
import { hasPermission } from "@/lib/auth/rbac";
import { contactsRepository } from "@/lib/sheets/repositories";

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
      <ContactsTable contacts={contacts} />
    </div>
  );
}
