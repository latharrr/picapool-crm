export interface GoogleServiceAccountCredentials {
  email: string;
  privateKey: string;
}

function normalizePrivateKey(raw: string): string {
  // .env files can't hold real newlines, so the key is stored with literal \n
  // escape sequences that need to be converted back before use.
  return raw.includes("\\n") ? raw.replace(/\\n/g, "\n") : raw;
}

export function getGoogleCredentials(): GoogleServiceAccountCredentials | null {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  if (!email || !rawKey) return null;
  return { email, privateKey: normalizePrivateKey(rawKey) };
}

export function hasGoogleServiceAccount(): boolean {
  return getGoogleCredentials() !== null;
}

export function getRootSpreadsheetId(): string | null {
  return process.env.ROOT_SPREADSHEET_ID || null;
}

export function getUpstashConfig(): { url: string; token: string } | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return { url, token };
}

export function hasKVConfig(): boolean {
  return getUpstashConfig() !== null;
}

export function getCronSecret(): string | null {
  return process.env.CRON_SECRET || null;
}

export interface EnvStatus {
  googleServiceAccount: boolean;
  rootSpreadsheet: boolean;
  kv: boolean;
  authSecret: boolean;
  /** Human-readable env var names that are missing, for setup screens. */
  missing: string[];
}

export function getEnvStatus(): EnvStatus {
  const googleServiceAccount = hasGoogleServiceAccount();
  const rootSpreadsheet = getRootSpreadsheetId() !== null;
  const kv = hasKVConfig();
  const authSecret = Boolean(process.env.AUTH_SECRET);

  const missing: string[] = [];
  if (!googleServiceAccount) {
    missing.push("GOOGLE_SERVICE_ACCOUNT_EMAIL", "GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY");
  }
  if (!rootSpreadsheet) missing.push("ROOT_SPREADSHEET_ID");
  if (!authSecret) missing.push("AUTH_SECRET");
  if (!kv) missing.push("UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN (optional in dev)");

  return { googleServiceAccount, rootSpreadsheet, kv, authSecret, missing };
}
