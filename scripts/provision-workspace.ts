/**
 * Provisions a new workspace spreadsheet from the command line, useful
 * before any admin user can log in through the UI (Admin > Workspaces does
 * the same thing once you have a session).
 *
 * Usage:
 *   npm run provision:workspace -- "Delhi Housing" admin@picapool.com
 *   npm run provision:workspace -- "Delhi Housing" admin@picapool.com https://docs.google.com/spreadsheets/d/.../edit
 *
 * The third argument is optional: a spreadsheet URL/ID you've already
 * created and shared with the service account as Editor. Use it if your
 * service account has no Drive storage of its own (common without Google
 * Workspace) and `spreadsheets.create` fails with a 403 — see
 * docs/SERVICE_ACCOUNT.md.
 */
import "./load-env";
import { provisionWorkspace, extractSpreadsheetId } from "../src/lib/sheets/provisioning";

async function main() {
  const name = process.argv[2];
  const adminEmails = (process.argv[3] ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const existingSpreadsheet = process.argv[4];

  if (!name) {
    console.error(
      'Usage: npm run provision:workspace -- "Workspace Name" admin1@x.com,admin2@x.com [existing-sheet-url]'
    );
    process.exit(1);
  }

  if (!process.env.ROOT_SPREADSHEET_ID) {
    console.error("ROOT_SPREADSHEET_ID is not set — run `npm run provision:root` first.");
    process.exit(1);
  }

  const result = await provisionWorkspace(
    name,
    adminEmails,
    "provision-workspace-script",
    existingSpreadsheet ? extractSpreadsheetId(existingSpreadsheet) : undefined
  );

  console.log(`\nWorkspace "${name}" provisioned.`);
  console.log(`Workspace ID: ${result.workspaceId}`);
  console.log(`Spreadsheet ID: ${result.spreadsheetId}`);
  console.log(
    "\nA user still needs a User_Workspaces row to access it — assign one from " +
      "Admin > Workspaces once you can log in, or run `npm run seed`."
  );
}

main().catch((err) => {
  console.error("Failed to provision workspace:", err);
  process.exit(1);
});
