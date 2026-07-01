import { Lock } from "lucide-react";
import { EmptyState } from "./empty-state";

export function PermissionDenied() {
  return (
    <EmptyState
      icon={Lock}
      title="You don't have access to this page"
      description="Ask a Founder or Admin to grant you the required permission."
    />
  );
}
