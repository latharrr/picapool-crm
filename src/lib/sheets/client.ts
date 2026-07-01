import { google, sheets_v4, drive_v3 } from "googleapis";
import { getGoogleCredentials } from "@/lib/env";
import { SheetsNotConfiguredError } from "./errors";

const SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/drive",
];

let authClient: InstanceType<typeof google.auth.JWT> | null = null;
let sheetsClient: sheets_v4.Sheets | null = null;
let driveClient: drive_v3.Drive | null = null;

function getAuth() {
  if (authClient) return authClient;

  const credentials = getGoogleCredentials();
  if (!credentials) {
    throw new SheetsNotConfiguredError();
  }

  authClient = new google.auth.JWT({
    email: credentials.email,
    key: credentials.privateKey,
    scopes: SCOPES,
  });
  return authClient;
}

export function getSheetsClient(): sheets_v4.Sheets {
  if (!sheetsClient) {
    sheetsClient = google.sheets({ version: "v4", auth: getAuth() });
  }
  return sheetsClient;
}

export function getDriveClient(): drive_v3.Drive {
  if (!driveClient) {
    driveClient = google.drive({ version: "v3", auth: getAuth() });
  }
  return driveClient;
}

/** Converts a 1-based column index to its A1 letter (1 -> A, 27 -> AA). */
export function columnLetter(index: number): string {
  let n = index;
  let letters = "";
  while (n > 0) {
    const remainder = (n - 1) % 26;
    letters = String.fromCharCode(65 + remainder) + letters;
    n = Math.floor((n - 1) / 26);
  }
  return letters;
}
