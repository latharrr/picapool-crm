import { NextResponse } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/cron/auth";
import { getRootSpreadsheetId } from "@/lib/env";
import { workspacesRepository, WORKSPACE_REPOSITORIES } from "@/lib/sheets/repositories";
import { invalidateTab } from "@/lib/kv/cache";
import { WORKSPACE_TABS } from "@/lib/sheets/tabs";
import { refreshDashboardStats } from "@/lib/analytics/cache";
import { getKV } from "@/lib/kv/client";

export const dynamic = "force-dynamic";

interface WorkspaceRefreshResult {
  workspaceId: string;
  ok: boolean;
  error?: string;
}

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rootId = getRootSpreadsheetId();
  if (!rootId) {
    return NextResponse.json({ refreshed: 0, message: "Root spreadsheet not configured" });
  }

  const workspaces = await workspacesRepository.list(rootId);
  const results: WorkspaceRefreshResult[] = [];

  for (const workspace of workspaces) {
    try {
      // Invalidate then immediately re-fetch every tab so the KV cache is
      // warm again for the next real request (calling/leads screens stay
      // fast) rather than just going cold until someone happens to load it.
      for (let i = 0; i < WORKSPACE_TABS.length; i++) {
        await invalidateTab(workspace.spreadsheet_id, WORKSPACE_TABS[i].name);
        await WORKSPACE_REPOSITORIES[i].list(workspace.spreadsheet_id, { includeDeleted: true });
      }
      await refreshDashboardStats(workspace.spreadsheet_id);
      results.push({ workspaceId: workspace.id, ok: true });
    } catch (err) {
      results.push({
        workspaceId: workspace.id,
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  await getKV().set("cron:last-refresh", new Date().toISOString());
  return NextResponse.json({ refreshed: results.length, results });
}
