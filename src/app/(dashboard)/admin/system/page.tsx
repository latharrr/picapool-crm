import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusRow } from "@/components/admin/status-row";
import { getSystemHealth } from "@/lib/health";

// Health must be checked live on every request, never baked in at build time.
export const dynamic = "force-dynamic";

export default async function AdminSystemPage() {
  const health = await getSystemHealth();

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Health"
        description="Sheets/KV connectivity, cache freshness per tab, and last cron run."
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Configuration</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <StatusRow
            label="Google service account"
            detail={
              health.googleServiceAccount
                ? "GOOGLE_SERVICE_ACCOUNT_EMAIL / PRIVATE_KEY configured"
                : "Not configured — Sheets reads/writes will fail"
            }
            level={health.googleServiceAccount ? "ok" : "error"}
          />
          <StatusRow
            label="Root spreadsheet"
            detail={
              health.rootSpreadsheet
                ? "ROOT_SPREADSHEET_ID configured"
                : "Not configured — run the root provisioning script"
            }
            level={health.rootSpreadsheet ? "ok" : "error"}
          />
          <StatusRow
            label="Auth secret"
            detail={health.authSecret ? "AUTH_SECRET configured" : "AUTH_SECRET missing"}
            level={health.authSecret ? "ok" : "error"}
          />
          <StatusRow
            label="KV cache / locking"
            detail={
              health.kv.configured
                ? health.kv.reachable
                  ? "Upstash Redis configured and reachable"
                  : "Upstash Redis configured but unreachable"
                : "Using in-memory fallback (dev only, not for production)"
            }
            level={
              health.kv.configured && health.kv.reachable
                ? "ok"
                : health.kv.configured
                  ? "error"
                  : "warn"
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
