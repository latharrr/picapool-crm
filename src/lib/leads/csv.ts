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

/** Target fields a source column can be mapped to when importing an arbitrary sheet. */
export const LEAD_TARGET_FIELDS = [
  "name",
  "phone",
  "email",
  "college",
  "university",
  "year",
  "city",
  "source",
  "tags",
  "notes",
] as const;

export type LeadTargetField = (typeof LEAD_TARGET_FIELDS)[number];

export const LEAD_TARGET_FIELD_LABELS: Record<LeadTargetField, string> = {
  name: "Name",
  phone: "Phone",
  email: "Email",
  college: "College",
  university: "University",
  year: "Year",
  city: "City",
  source: "Source",
  tags: "Tags",
  notes: "Notes",
};

/** Common header spellings, normalized (lowercase, letters/digits only), per target field. */
const FIELD_ALIASES: Record<LeadTargetField, string[]> = {
  name: ["name", "fullname", "studentname", "leadname", "contactname"],
  phone: [
    "phone",
    "phonenumber",
    "mobile",
    "mobilenumber",
    "contact",
    "contactnumber",
    "whatsapp",
    "whatsappnumber",
    "number",
  ],
  email: ["email", "emailaddress", "mail", "emailid"],
  college: ["college", "collegename"],
  university: ["university", "universityname", "institute", "institution"],
  year: ["year", "gradyear", "graduationyear", "class", "batch"],
  city: ["city", "location", "town"],
  source: ["source", "leadsource", "channel"],
  tags: ["tags", "tag", "category", "categories"],
  notes: ["notes", "note", "comments", "comment", "remark", "remarks", "description"],
};

function normalizeHeader(header: string): string {
  return header.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** Best-effort auto-match of a sheet's column headers to lead fields, for the import mapping step. */
export function guessColumnMapping(headers: string[]): Record<string, LeadTargetField | null> {
  const used = new Set<LeadTargetField>();
  const mapping: Record<string, LeadTargetField | null> = {};

  for (const header of headers) {
    const normalized = normalizeHeader(header);
    const match = LEAD_TARGET_FIELDS.find(
      (field) => !used.has(field) && FIELD_ALIASES[field].includes(normalized)
    );
    mapping[header] = match ?? null;
    if (match) used.add(match);
  }

  return mapping;
}

/** Applies a header -> target-field mapping chosen in the import UI to raw parsed rows. */
export function applyColumnMapping(
  rows: Record<string, string>[],
  mapping: Record<string, LeadTargetField | null>
): ParsedLeadRow[] {
  return rows.map((row) => {
    const mapped: Record<string, string> = {};
    for (const [header, field] of Object.entries(mapping)) {
      if (!field) continue;
      const value = row[header];
      if (value != null && value !== "") mapped[field] = value;
    }
    return csvRowToLeadInput(mapped);
  });
}
