import { Shield } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";

export default function AdminRolesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Roles & Permissions"
        description="Founder, Admin, Manager, Team Lead, Intern, and Viewer permission matrix."
      />
      <EmptyState
        icon={Shield}
        title="Permission matrix will appear here"
        description="Every mutating API route enforces this matrix server-side; this screen is for review, not the source of truth."
      />
    </div>
  );
}
