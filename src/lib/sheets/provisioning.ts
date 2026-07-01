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

async function shareReadOnly(spreadsheetId: string, emails: string[]) {
  if (emails.length === 0) return;
  const drive = getDriveClient();
  for (const email of emails) {
    await withRetry(() =>
      drive.permissions.create({
        fileId: spreadsheetId,
        sendNotificationEmail: false,
        requestBody: { type: "user", role: "reader", emailAddress: email },
      })
    );
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
 */
export async function provisionWorkspace(
  name: string,
  adminEmails: string[],
  createdBy: string
): Promise<ProvisionWorkspaceResult> {
  const spreadsheetId = await createSpreadsheetWithTabs(name, WORKSPACE_TABS);
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
