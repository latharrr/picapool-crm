import { PageHeader } from "@/components/shared/page-header";
import { NoWorkspace } from "@/components/shared/no-workspace";
import { PermissionDenied } from "@/components/shared/permission-denied";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FeatureFlagToggle } from "@/components/admin/feature-flag-toggle";
import { requireSession } from "@/lib/auth/session";
import { getActiveWorkspaceContext } from "@/lib/workspace-context";
import { hasPermission } from "@/lib/auth/rbac";
import { getFeatureFlags, ALL_FEATURE_KEYS } from "@/lib/settings";
import type { FeatureKey } from "@/lib/nav-config";

export const dynamic = "force-dynamic";

const FEATURE_LABELS: Record<FeatureKey, { label: string; description: string }> = {
  calling: { label: "Calling", description: "The calling console and lead queue." },
  housing: { label: "Housing Listings", description: "Housing inventory management." },
  campaigns: { label: "Campaigns", description: "Outreach campaign tracking." },
  messages: { label: "Messages", description: "WhatsApp and email logging." },
  analytics: { label: "Analytics", description: "The dashboard and reporting charts." },
  tasks: { label: "Tasks", description: "Follow-up and callback task tracking." },
};

export default async function AdminSettingsPage() {
  const session = await requireSession();
  const ctx = await getActiveWorkspaceContext(session);

  if (!ctx) {
    return (
      <div className="space-y-6">
        <PageHeader title="Settings" />
        <NoWorkspace />
      </div>
    );
  }
  if (!hasPermission(ctx.role, "MANAGE_SETTINGS")) {
    return (
      <div className="space-y-6">
        <PageHeader title="Settings" />
        <PermissionDenied />
      </div>
    );
  }

  const flags = await getFeatureFlags(ctx.spreadsheetId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Workspace-level feature flags, stored in the Settings tab of this workspace's spreadsheet."
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Feature flags</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 pt-0">
          {ALL_FEATURE_KEYS.map((key) => (
            <div
              key={key}
              className="flex items-center justify-between border-b border-border py-3 last:border-b-0"
            >
              <div>
                <p className="text-sm font-medium text-foreground">{FEATURE_LABELS[key].label}</p>
                <p className="text-xs text-muted-foreground">{FEATURE_LABELS[key].description}</p>
              </div>
              <FeatureFlagToggle workspaceId={ctx.workspaceId} feature={key} enabled={flags[key]} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
