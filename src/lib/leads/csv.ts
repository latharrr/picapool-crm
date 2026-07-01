import type { LeadRecord } from "@/lib/sheets/schema/crm";

/** Columns used for both export and the import template — keep these in sync. */
export const LEAD_CSV_COLUMNS = [
  "name",
  "phone",
  "email",
  "college",
  "university",
  "year",
  "city",
  "source",
  "status",
  "priority",
  "tags",
  "notes",
] as const;

export type LeadCsvRow = Record<(typeof LEAD_CSV_COLUMNS)[number], string>;

export function leadToCsvRow(lead: LeadRecord): LeadCsvRow {
  return {
    name: lead.name,
    phone: lead.phone,
    email: lead.email ?? "",
    college: lead.college ?? "",
    university: lead.university ?? "",
    year: lead.year ?? "",
    city: lead.city ?? "",
    source: lead.source ?? "",
    status: lead.status,
    priority: lead.priority,
    tags: lead.tags.join(";"),
    notes: lead.notes ?? "",
  };
}

/** Raw parsed import row, before Zod validation server-side. */
export interface ParsedLeadRow {
  name: string;
  phone: string;
  email?: string;
  college?: string;
  university?: string;
  year?: string;
  city?: string;
  source?: string;
  tags?: string[];
  notes?: string;
}

export function csvRowToLeadInput(row: Record<string, string>): ParsedLeadRow {
  const get = (key: string) => row[key]?.trim() || undefined;
  return {
    name: get("name") ?? "",
    phone: get("phone") ?? "",
    email: get("email"),
    college: get("college"),
    university: get("university"),
    year: get("year"),
    city: get("city"),
    source: get("source"),
    tags: row.tags
      ? row.tags
          .split(";")
          .map((t) => t.trim())
          .filter(Boolean)
      : undefined,
    notes: get("notes"),
  };
}
