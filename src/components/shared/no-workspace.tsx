import { Building2 } from "lucide-react";
import { EmptyState } from "./empty-state";

export function NoWorkspace() {
  return (
    <EmptyState
      icon={Building2}
      title="No workspace selected"
      description="You aren't assigned to a workspace yet, or the root spreadsheet isn't configured. Ask an admin to add you to a workspace."
    />
  );
}
