import { getSheetsClient, getDriveClient } from "./client";
import { withRetry } from "./rateLimiter";
import { ROOT_TABS, WORKSPACE_TABS } from "./tabs";
import type { TabDefinition } from "./tab";
import { workspacesRepository } from "./repositories/root";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function createSpreadsheetWithTabs(title: string, tabs: TabDefinition<any>[]) {
  const sheets = getSheetsClient();

  const createRes = await withRetry(() =>
    sheets.spreadsheets.create({
      requestBody: {
        properties: { title },
        sheets: tabs.map((tab) => ({ properties: { title: tab.name } })),
      },
    })
  );

  const spreadsheetId = createRes.data.spreadsheetId;
  if (!spreadsheetId) {
    throw new Error(`Failed to create spreadsheet "${title}": no spreadsheetId returned`);
  }

  await withRetry(() =>
    sheets.spreadsheets.values.batchUpdate({
      spreadsheetId,
      requestBody: {
        valueInputOption: "RAW",
        data: tabs.map((tab) => ({
          range: `${tab.name}!A1`,
          values: [tab.columns.map((c) => c.header)],
        })),
      },
    })
  );

  return spreadsheetId;
}

/**
 * Adds any tabs from `tabs` that don't already exist in `spreadsheetId`
 * (with their header row), leaving existing tabs/data untouched. Used when
 * attaching to a spreadsheet a human already created and shared with the
 * service account, rather than letting the app create a brand-new file —
 * some Google Workspace/Cloud org policies restrict service accounts from
 * creating new Drive files but allow editing files they've been granted
 * access to.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function ensureTabsExist(spreadsheetId: string, tabs: TabDefinition<any>[]) {
  const sheets = getSheetsClient();

  const meta = await withRetry(() =>
    sheets.spreadsheets.get({ spreadsheetId, fields: "sheets.properties.title" })
  );
  const existingTitles = new Set(
    (meta.data.sheets ?? []).map((s) => s.properties?.title).filter(Boolean)
  );
  const missing = tabs.filter((tab) => !existingTitles.has(tab.name));
  if (missing.length === 0) return;

  await withRetry(() =>
    sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: missing.map((tab) => ({ addSheet: { properties: { title: tab.name } } })),
      },
    })
  );

  await withRetry(() =>
    sheets.spreadsheets.values.batchUpdate({
      spreadsheetId,
      requestBody: {
        valueInputOption: "RAW",
        data: missing.map((tab) => ({
          range: `${tab.name}!A1`,
          values: [tab.columns.map((c) => c.header)],
        })),
      },
    })
  );
}

async function shareReadOnly(spreadsheetId: string, emails: string[]) {
  if (emails.length === 0) return;
  const drive = getDriveClient();
  for (const email of emails) {
    try {
      await withRetry(() =>
        drive.permissions.create({
          fileId: spreadsheetId,
          sendNotificationEmail: false,
          requestBody: { type: "user", role: "reader", emailAddress: email },
        })
      );
    } catch (err) {
      // Harmless no-op if this email already has access (e.g. it's the
      // owner of a spreadsheet the app attached to rather than created).
      const status = (err as { code?: number })?.code;
      if (status !== 400 && status !== 409) throw err;
    }
  }
}

export interface EnsureRootResult {
  spreadsheetId: string;
  created: boolean;
}

/**
 * Creates the central Root spreadsheet (Users / Roles_Permissions /
 * Workspaces / User_Workspaces) if `ROOT_SPREADSHEET_ID` isn't already set.
 * Vercel can't persist env vars from inside a running function, so the
 * caller (a one-time script) is responsible for printing the returned ID
 * and saving it into the environment.
 */
export async function ensureRootSpreadsheet(existingId?: string): Promise<EnsureRootResult> {
  if (existingId) {
    await ensureTabsExist(existingId, ROOT_TABS);
    return { spreadsheetId: existingId, created: false };
  }
  const spreadsheetId = await createSpreadsheetWithTabs("Picapool CRM — Root", ROOT_TABS);
  return { spreadsheetId, created: true };
}

export interface ProvisionWorkspaceResult {
  spreadsheetId: string;
  workspaceId: string;
}

/**
 * Creates a new per-workspace spreadsheet with all operational tabs, shares
 * it read-only with the given admin emails (for manual audit/export only —
 * never for editing), and registers it in the root Workspaces tab.
 *
 * If `existingSpreadsheetId` is given, the app attaches to that spreadsheet
 * (adding any missing tabs) instead of creating a new one. This matters in
 * practice: bare service accounts (no Google Workspace / domain-wide
 * delegation) usually have no Drive storage of their own, so
 * `spreadsheets.create` fails with a 403 even though editing a file a human
 * already shared with them works fine. See docs/SERVICE_ACCOUNT.md.
 */
export async function provisionWorkspace(
  name: string,
  adminEmails: string[],
  createdBy: string,
  existingSpreadsheetId?: string
): Promise<ProvisionWorkspaceResult> {
  const spreadsheetId = existingSpreadsheetId
    ? await (async () => {
        await ensureTabsExist(existingSpreadsheetId, WORKSPACE_TABS);
        return existingSpreadsheetId;
      })()
    : await createSpreadsheetWithTabs(name, WORKSPACE_TABS);

  await shareReadOnly(spreadsheetId, adminEmails);

  const workspace = await workspacesRepository.create(
    process.env.ROOT_SPREADSHEET_ID as string,
    {
      name,
      spreadsheet_id: spreadsheetId,
      admin_emails: adminEmails,
      created_by: createdBy,
    }
  );

  return { spreadsheetId, workspaceId: workspace.id };
}

/** Accepts either a bare spreadsheet ID or a full Google Sheets URL. */
export function extractSpreadsheetId(input: string): string {
  const trimmed = input.trim();
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : trimmed;
}
