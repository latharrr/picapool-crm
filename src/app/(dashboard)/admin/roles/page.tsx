import { Check } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { PermissionDenied } from "@/components/shared/permission-denied";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireSession } from "@/lib/auth/session";
import { ALL_ROLES, ALL_PERMISSIONS, hasPermission } from "@/lib/auth/rbac";

export default async function AdminRolesPage() {
  const session = await requireSession();
  if (!hasPermission(session.user.role, "MANAGE_USERS")) {
    return (
      <div className="space-y-6">
        <PageHeader title="Roles & Permissions" />
        <PermissionDenied />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Roles & Permissions"
        description="Enforced server-side on every mutating API route — this table is for review, not the source of truth. Edit lib/auth/rbac.ts to change it."
      />
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="sticky left-0 bg-card">Permission</TableHead>
              {ALL_ROLES.map((role) => (
                <TableHead key={role} className="text-center whitespace-nowrap">
                  {role}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {ALL_PERMISSIONS.map((permission) => (
              <TableRow key={permission}>
                <TableCell className="sticky left-0 bg-card font-mono text-xs font-medium">
                  {permission}
                </TableCell>
                {ALL_ROLES.map((role) => (
                  <TableCell key={role} className="text-center">
                    {hasPermission(role, permission) ? (
                      <Check className="mx-auto h-4 w-4 text-success" />
                    ) : (
                      <span className="text-muted-foreground/40">—</span>
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
