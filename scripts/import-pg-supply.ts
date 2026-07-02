/**
 * Imports the "Supply" sheet from "PG_Demand+Supply.xlsx" (PG owner outreach
 * list: Source, PG, Owner, Contact, Gender, Location, Beds, Call Status,
 * Follow Up Call, Stage, Priority Score, Notes) into a workspace's Leads tab
 * as lead_type "pg". Same shape as scripts/import-research-data.ts.
 *
 * Usage:
 *   npm run import:pg-supply -- "PG Demand and Supply"
 *   npm run import:pg-supply -- "PG Demand and Supply" https://docs.google.com/spreadsheets/d/.../edit
 */
import "./load-env";
import * as XLSX from "xlsx";
import { leadsRepository, workspacesRepository } from "../src/lib/sheets/repositories";
import { extractSpreadsheetId } from "../src/lib/sheets/provisioning";
import type {
  LeadStatus,
  LeadRecord,
  leadGenderEnum,
  pgStageEnum,
  followUpStatusEnum,
} from "../src/lib/sheets/schema/crm";
import type { CallOutcome } from "../src/lib/sheets/schema/engagement";
import type { z } from "zod";

const XLSX_PATH = "C:\\Users\\deepa\\Desktop\\PG_Demand+Supply.xlsx";
const SHEET_NAME = "Supply";

function toStringOrUndefined(value: unknown): string | undefined {
  if (value === "" || value === undefined || value === null) return undefined;
  return String(value).trim();
}

function toNumberOrUndefined(value: unknown): number | undefined {
  if (value === "" || value === undefined || value === null) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function normalizePhone(value: unknown): string | undefined {
  const raw = toStringOrUndefined(value);
  if (!raw) return undefined;
  // Numeric cells come through as e.g. "9599655590" or "9599655590.0".
  return raw.replace(/\.0$/, "").replace(/[\s-()]/g, "");
}

function normalizeGender(value: unknown): z.infer<typeof leadGenderEnum> | undefined {
  const raw = toStringOrUndefined(value)?.toLowerCase();
  if (!raw) return undefined;
  if (raw.includes("girl") || raw === "female") return "Female";
  if (raw === "male") return "Male";
  if (raw === "unisex") return "Unisex";
  return undefined;
}

function normalizeStage(value: unknown): z.infer<typeof pgStageEnum> | undefined {
  const raw = toStringOrUndefined(value)?.toLowerCase();
  if (!raw) return undefined;
  if (raw === "lead") return "Lead";
  if (raw === "site visit") return "Site Visit";
  if (raw === "negotiation") return "Negotiation";
  if (raw === "closed") return "Closed";
  return undefined;
}

function normalizeFollowUp(value: unknown): z.infer<typeof followUpStatusEnum> | undefined {
  const raw = toStringOrUndefined(value)?.toLowerCase();
  if (!raw) return undefined;
  if (raw === "yes") return "Yes";
  if (raw === "no") return "No";
  if (raw === "done") return "Done";
  return undefined;
}

function normalizePriority(value: unknown): "low" | "medium" | "high" {
  const raw = toStringOrUndefined(value)?.toLowerCase();
  if (raw === "high") return "high";
  if (raw === "low") return "low";
  return "medium";
}

function normalizeCallStatus(value: unknown): CallOutcome | undefined {
  const raw = toStringOrUndefined(value)?.toLowerCase();
  if (!raw) return undefined;
  if (raw === "pitched") return "pitched";
  if (raw === "not answered") return "no_answer";
  if (raw === "callback") return "callback";
  if (raw === "not interested") return "not_interested";
  return undefined;
}

async function main() {
  const workspaceArg = process.argv[2];
  const spreadsheetArg = process.argv[3];

  if (!workspaceArg) {
    console.error('Usage: npm run import:pg-supply -- "Workspace Name" [spreadsheet-url-or-id]');
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
          "Run `npm run provision:workspace` first, or pass its spreadsheet URL as the second argument."
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

  // SheetJS indexes arrays from the sheet's actual used range (this sheet's
  // range starts at column B, not A), so column 0 here is "Source", not a
  // blank column-A slot.
  const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
  const headerRowIndex = rows.findIndex((row) => String(row[0]).trim() === "Source");
  if (headerRowIndex === -1) {
    console.error('Could not find the header row (looked for "Source" in column B).');
    process.exit(1);
  }
  const dataRows = rows.slice(headerRowIndex + 1);

  const toCreate: (Omit<
    LeadRecord,
    "id" | "created_at" | "updated_at" | "updated_by" | "is_deleted"
  > & { created_by: string })[] = [];
  let skipped = 0;

  for (const row of dataRows) {
    const pgName = toStringOrUndefined(row[1]);
    const ownerName = toStringOrUndefined(row[2]);
    const phone = normalizePhone(row[3]);

    if (!phone) {
      skipped++;
      continue;
    }

    const name = pgName || ownerName || `Unnamed PG (${phone})`;
    const status: LeadStatus = normalizeCallStatus(row[7]) ?? "new";

    toCreate.push({
      name,
      phone,
      city: toStringOrUndefined(row[5]),
      source: toStringOrUndefined(row[0]),
      status,
      priority: normalizePriority(row[10]),
      notes: toStringOrUndefined(row[11]),
      tags: [],
      owner_name: ownerName,
      gender: normalizeGender(row[4]),
      beds: toNumberOrUndefined(row[6]),
      pg_stage: normalizeStage(row[9]),
      follow_up_status: normalizeFollowUp(row[8]),
      lead_type: "pg",
      created_by: "import-pg-supply-script",
    });
  }

  const created = await leadsRepository.batchCreate(targetSpreadsheetId, toCreate);
  console.log(`\nImported ${created.length} PG leads (${skipped} rows skipped — missing contact number).`);
}

main().catch((err) => {
  console.error("Import failed:", err);
  process.exit(1);
});
