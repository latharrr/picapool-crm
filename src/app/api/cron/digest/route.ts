import { NextResponse } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/cron/auth";
import { getRootSpreadsheetId } from "@/lib/env";
import {
  workspacesRepository,
  leadsRepository,
  callHistoryRepository,
  notificationsRepository,
  activityLogRepository,
} from "@/lib/sheets/repositories";

export const dynamic = "force-dynamic";

const OVERDUE_CALLBACK_HOURS = 24;

/**
 * Finds callback leads whose most recent call was more than 24h ago and
 * creates a reminder notification for the lead's owner — skipping leads
 * that already have an unread reminder so this doesn't spam on every run.
 */
async function digestWorkspace(spreadsheetId: string): Promise<number> {
  const [leads, calls, notifications] = await Promise.all([
    leadsRepository.list(spreadsheetId),
    callHistoryRepository.list(spreadsheetId),
    notificationsRepository.list(spreadsheetId),
  ]);

  const lastCallByLead = new Map<string, string>();
  for (const call of calls) {
    const existing = lastCallByLead.get(call.lead_id);
    if (!existing || new Date(call.called_at) > new Date(existing)) {
      lastCallByLead.set(call.lead_id, call.called_at);
    }
  }

  const cutoff = Date.now() - OVERDUE_CALLBACK_HOURS * 60 * 60 * 1000;
  const alreadyNotified = new Set(
    notifications
      .filter((n) => n.type === "callback_overdue" && !n.is_read)
      .map((n) => n.link)
  );

  let created = 0;
  for (const lead of leads) {
    if (lead.status !== "callback" || !lead.owner_id) continue;
    const lastCalled = lastCallByLead.get(lead.id);
    if (lastCalled && new Date(lastCalled).getTime() > cutoff) continue;

    const link = `/leads/${lead.id}`;
    if (alreadyNotified.has(link)) continue;

    await notificationsRepository.create(spreadsheetId, {
      user_id: lead.owner_id,
      type: "callback_overdue",
      title: `Callback overdue: ${lead.name}`,
      body: `${lead.name} (${lead.phone}) requested a callback more than ${OVERDUE_CALLBACK_HOURS}h ago.`,
      is_read: false,
      link,
      created_by: "cron-digest",
    });
    created++;
  }

  return created;
}

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rootId = getRootSpreadsheetId();
  if (!rootId) {
    return NextResponse.json({ notificationsCreated: 0, message: "Root spreadsheet not configured" });
  }

  const workspaces = await workspacesRepository.list(rootId);
  let totalCreated = 0;

  for (const workspace of workspaces) {
    try {
      const created = await digestWorkspace(workspace.spreadsheet_id);
      totalCreated += created;
      if (created > 0) {
        await activityLogRepository.create(workspace.spreadsheet_id, {
          actor_id: "system",
          action: "digest_run",
          entity_type: "workspace",
          entity_id: workspace.id,
          diff: { notificationsCreated: created },
          created_by: "cron-digest",
        });
      }
    } catch (err) {
      console.error(`Digest failed for workspace ${workspace.id}:`, err);
    }
  }

  return NextResponse.json({ notificationsCreated: totalCreated });
}
