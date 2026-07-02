/**
 * Imports the real interview data from the "Research Database" sheet in
 * "Copy of Picapool_Product_Filter_Panel.xlsx" into a workspace's
 * Respondents tab. Same shape as scripts/feed-taxonomy.ts.
 *
 * Usage:
 *   npm run import:research -- "Research" https://docs.google.com/spreadsheets/d/.../edit
 *
 * The second argument accepts a spreadsheet URL/ID (existing workspace
 * spreadsheet) or falls back to looking up a workspace by name in the root
 * Workspaces tab.
 */
import "./load-env";
import * as XLSX from "xlsx";
import { respondentsRepository, workspacesRepository } from "../src/lib/sheets/repositories";
import { extractSpreadsheetId } from "../src/lib/sheets/provisioning";
import type { RespondentCallStatus } from "../src/lib/sheets/schema/research";

const XLSX_PATH = "G:\\picapool\\Copy of Picapool_Product_Filter_Panel.xlsx";
const SHEET_NAME = "Research Database";

function normalizeCallStatus(raw: string): RespondentCallStatus {
  const value = raw.trim().toLowerCase();
  if (value === "completed") return "completed";
  if (value === "call later") return "call_later";
  if (value === "refused") return "refused";
  if (value === "not answered") return "not_answered";
  if (value === "wrong number") return "wrong_number";
  return "pending";
}

function toNumberOrUndefined(value: unknown): number | undefined {
  if (value === "" || value === undefined || value === null) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function toStringOrUndefined(value: unknown): string | undefined {
  if (value === "" || value === undefined || value === null) return undefined;
  return String(value).trim();
}

async function main() {
  const workspaceArg = process.argv[2];
  const spreadsheetArg = process.argv[3];

  if (!workspaceArg) {
    console.error(
      'Usage: npm run import:research -- "Workspace Name" [spreadsheet-url-or-id]'
    );
    process.exit(1);
  }

  const rootId = process.env.ROOT_SPREADSHEET_ID;
  if (!rootId) {
    console.error("ROOT_SPREADSHEET_ID is not set — run `npm run provision:root` first.");
    process.exit(1);
  }

  let targetSpreadsheetId = spreadsheetArg ? extractSpreadsheetId(spreadsheetArg) : undefined;
  if (!targetSpreadsheetId) {
    const workspaces = await workspacesRepository.list(rootId);
    const workspace = workspaces.find((w) => w.name === workspaceArg);
    if (!workspace) {
      console.error(
        `Workspace "${workspaceArg}" not found and no spreadsheet URL/ID was given. ` +
          "Create the workspace first (Admin > Workspaces), or pass its spreadsheet URL as the second argument."
      );
      process.exit(1);
    }
    targetSpreadsheetId = workspace.spreadsheet_id;
  }

  console.log(`Reading "${SHEET_NAME}" from ${XLSX_PATH}...`);
  const workbook = XLSX.readFile(XLSX_PATH);
  const sheet = workbook.Sheets[SHEET_NAME];
  if (!sheet) {
    console.error(`Sheet "${SHEET_NAME}" not found in workbook.`);
    process.exit(1);
  }

  const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
  // Found the hard way: the sheet has an extra blank/label row near the top
  // that a hand-inspected preview (which filters out blank rows) doesn't
  // show, so a hardcoded header row index was off by one and let the
  // header row itself through as a fake respondent. Locate it by content
  // instead of position.
  const headerRowIndex = rows.findIndex((row) => String(row[1]).trim() === "Name");
  if (headerRowIndex === -1) {
    console.error('Could not find the header row (looked for "Name" in column B).');
    process.exit(1);
  }
  const dataRows = rows.slice(headerRowIndex + 1);

  let created = 0;
  let skipped = 0;

  for (const row of dataRows) {
    const name = toStringOrUndefined(row[1]);
    const phone = toStringOrUndefined(row[3]);
    if (!name || !phone || name.toLowerCase() === "name" || phone.toLowerCase() === "phone") {
      skipped++;
      continue;
    }

    await respondentsRepository.create(targetSpreadsheetId, {
      name,
      username: toStringOrUndefined(row[2]),
      phone,
      call_status: normalizeCallStatus(String(row[4] ?? "")),
      jtbd: toStringOrUndefined(row[5]),
      acquisition_source: toStringOrUndefined(row[6]),
      initial_perception: toStringOrUndefined(row[7]),
      current_perception: toStringOrUndefined(row[8]),
      feature_awareness: toStringOrUndefined(row[9]),
      activation: toStringOrUndefined(row[10]),
      problem_solved: toStringOrUndefined(row[11]),
      coordination_success: toStringOrUndefined(row[12]),
      marketplace_confidence: toStringOrUndefined(row[13]),
      trust_score: toNumberOrUndefined(row[14]),
      exp_match_score: toNumberOrUndefined(row[15]),
      return_intent_score: toNumberOrUndefined(row[16]),
      cross_jtbd_return: toStringOrUndefined(row[17]),
      biggest_friction: toStringOrUndefined(row[18]),
      missing_capability: toStringOrUndefined(row[19]),
      raw_notes: toStringOrUndefined(row[20]),
      created_by: "import-research-data-script",
    });
    created++;
  }

  console.log(`\nImported ${created} respondents (${skipped} rows skipped — missing name/phone).`);
}

main().catch((err) => {
  console.error("Import failed:", err);
  process.exit(1);
});
