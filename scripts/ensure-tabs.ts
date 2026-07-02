/**
 * Adds any workspace tabs that don't exist yet (e.g. after a new tab like
 * Respondents is added to WORKSPACE_TABS) to an already-provisioned
 * workspace spreadsheet, without touching existing tabs/data.
 *
 * Usage: npm run tabs:sync -- <spreadsheetId-or-url>
 */
import "./load-env";
import { ensureWorkspaceTabs, extractSpreadsheetId } from "../src/lib/sheets/provisioning";

async function main() {
  const arg = process.argv[2];
  if (!arg) {
    console.error("Usage: npm run tabs:sync -- <spreadsheetId-or-url>");
    process.exit(1);
  }
  await ensureWorkspaceTabs(extractSpreadsheetId(arg));
  console.log("Done — any missing tabs have been added.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
