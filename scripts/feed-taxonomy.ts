import * as fs from "fs";
import "./load-env";
import { getSheetsClient } from "../src/lib/sheets/client";
import { withRetry } from "../src/lib/sheets/rateLimiter";
import { extractSpreadsheetId } from "../src/lib/sheets/provisioning";

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

async function main() {
  const csvPath = "G:\\picapool\\Copy of Picapool_Product_Filter_Panel - Taxonomy.csv";
  if (!fs.existsSync(csvPath)) {
    console.error(`CSV file not found at: ${csvPath}`);
    process.exit(1);
  }

  const fileContent = fs.readFileSync(csvPath, "utf-8");
  const rows = fileContent
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0)
    .map(parseCSVLine);

  console.log(`Parsed ${rows.length} rows from CSV.`);

  let targetSpreadsheetId = process.argv[2];
  if (!targetSpreadsheetId) {
    targetSpreadsheetId = process.env.ROOT_SPREADSHEET_ID || "";
  } else {
    if (targetSpreadsheetId.includes("docs.google.com")) {
      targetSpreadsheetId = extractSpreadsheetId(targetSpreadsheetId);
    }
  }

  if (!targetSpreadsheetId) {
    console.error(
      "No target spreadsheet ID provided. Please set ROOT_SPREADSHEET_ID or pass the spreadsheet ID/URL as an argument."
    );
    process.exit(1);
  }

  console.log(`Targeting spreadsheet: ${targetSpreadsheetId}`);

  const sheets = getSheetsClient();

  const meta = await withRetry(() =>
    sheets.spreadsheets.get({
      spreadsheetId: targetSpreadsheetId,
      fields: "sheets.properties.title",
    })
  );

  const existingTitles = new Set(
    (meta.data.sheets ?? []).map((s) => s.properties?.title).filter(Boolean)
  );

  const tabName = "Taxonomy";

  if (!existingTitles.has(tabName)) {
    console.log(`Creating tab "${tabName}"...`);
    await withRetry(() =>
      sheets.spreadsheets.batchUpdate({
        spreadsheetId: targetSpreadsheetId,
        requestBody: {
          requests: [{ addSheet: { properties: { title: tabName } } }],
        },
      })
    );
  } else {
    console.log(`Tab "${tabName}" already exists.`);
  }

  console.log(`Clearing existing content in "${tabName}"...`);
  await withRetry(() =>
    sheets.spreadsheets.values.clear({
      spreadsheetId: targetSpreadsheetId,
      range: `${tabName}!A1:Z100`,
    })
  );

  console.log(`Writing data to "${tabName}"...`);
  await withRetry(() =>
    sheets.spreadsheets.values.update({
      spreadsheetId: targetSpreadsheetId,
      range: `${tabName}!A1`,
      valueInputOption: "RAW",
      requestBody: {
        values: rows,
      },
    })
  );

  console.log("Success! Taxonomy data has been successfully imported into the spreadsheet.");
}

main().catch((err) => {
  console.error("An error occurred during import:", err);
  process.exit(1);
});
