import { UserCog } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { PermissionDenied } from "@/components/shared/permission-denied";
import { CreateUserDialog } from "@/components/admin/create-user-dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/rbac";
import { usersRepository } from "@/lib/sheets/repositories";
import { getRootSpreadsheetId } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const session = await requireSession();
  if (!hasPermission(session.user.role, "MANAGE_USERS")) {
    return (
      <div className="space-y-6">
        <PageHeader title="Users" />
        <PermissionDenied />
      </div>
    );
  }

  const rootId = getRootSpreadsheetId();
  const users = rootId ? await usersRepository.list(rootId) : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="Manage who can access this workspace and what role they hold."
        actions={<CreateUserDialog />}
      />

      {users.length === 0 ? (
        <EmptyState
          icon={UserCog}
          title="No users yet"
          description="Once the root spreadsheet is provisioned, users and their workspace assignments will show here."
          action={<CreateUserDialog />}
        />
      ) : (
        <div className="rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Default role</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell className="text-muted-foreground">{u.email}</TableCell>
                  <TableCell>{u.default_role}</TableCell>
                  <TableCell>
                    <Badge variant={u.is_active ? "default" : "secondary"}>
                      {u.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
