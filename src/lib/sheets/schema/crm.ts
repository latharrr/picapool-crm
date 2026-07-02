import { z } from "zod";
import { baseFields } from "./common";
import { codec, baseColumns, defineTab, type BaseRecord } from "../tab";

// ── Leads ────────────────────────────────────────────────────────────────
export const leadStatusEnum = z.enum([
  "new",
  "queued",
  "connected",
  "interested",
  "callback",
  "busy",
  "wrong_number",
  "spam",
  "no_answer",
  "converted",
  "closed",
  "pitched",
  "not_interested",
]);
export type LeadStatus = z.infer<typeof leadStatusEnum>;

export const leadPriorityEnum = z.enum(["low", "medium", "high"]);

/** PG-listing-specific fields (see PG_Demand_and_Supply workspace) — appended
 * after baseColumns in leadsTab.columns below so already-provisioned
 * workspaces' existing column positions never shift. */
export const leadGenderEnum = z.enum(["Male", "Female", "Unisex"]);
export const pgStageEnum = z.enum(["Lead", "Site Visit", "Negotiation", "Closed"]);
export const followUpStatusEnum = z.enum(["Yes", "No", "Done"]);

export interface LeadRecord extends BaseRecord {
  name: string;
  phone: string;
  email?: string;
  college?: string;
  university?: string;
  year?: string;
  city?: string;
  source?: string;
  campaign_id?: string;
  status: LeadStatus;
  priority: z.infer<typeof leadPriorityEnum>;
  owner_id?: string;
  notes?: string;
  tags: string[];
  owner_name?: string;
  gender?: z.infer<typeof leadGenderEnum>;
  beds?: number;
  pg_stage?: z.infer<typeof pgStageEnum>;
  follow_up_status?: z.infer<typeof followUpStatusEnum>;
  /** Free string (not a strict enum) so future categories like
   * "group_buying" don't require another schema migration. "pg" for
   * PG-listing leads; undefined for ordinary student leads. */
  lead_type?: string;
}

export const leadSchema = z.object({
  ...baseFields,
  name: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().optional(),
  college: z.string().optional(),
  university: z.string().optional(),
  year: z.string().optional(),
  city: z.string().optional(),
  source: z.string().optional(),
  campaign_id: z.string().optional(),
  status: leadStatusEnum,
  priority: leadPriorityEnum,
  owner_id: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()),
  owner_name: z.string().optional(),
  gender: leadGenderEnum.optional(),
  beds: z.number().optional(),
  pg_stage: pgStageEnum.optional(),
  follow_up_status: followUpStatusEnum.optional(),
  lead_type: z.string().optional(),
});

export const leadsTab = defineTab<LeadRecord>({
  name: "Leads",
  schema: leadSchema,
  columns: [
    codec.string<LeadRecord>("id")(),
    codec.string<LeadRecord>("name")(),
    codec.string<LeadRecord>("phone")(),
    codec.optionalString<LeadRecord>("email")(),
    codec.optionalString<LeadRecord>("college")(),
    codec.optionalString<LeadRecord>("university")(),
    codec.optionalString<LeadRecord>("year")(),
    codec.optionalString<LeadRecord>("city")(),
    codec.optionalString<LeadRecord>("source")(),
    codec.optionalString<LeadRecord>("campaign_id")(),
    codec.string<LeadRecord>("status")(),
    codec.string<LeadRecord>("priority")(),
    codec.optionalString<LeadRecord>("owner_id")(),
    codec.optionalString<LeadRecord>("notes")(),
    codec.stringArray<LeadRecord>("tags")(),
    ...baseColumns<LeadRecord>(),
    codec.optionalString<LeadRecord>("owner_name")(),
    codec.optionalString<LeadRecord>("gender")(),
    codec.number<LeadRecord>("beds")(),
    codec.optionalString<LeadRecord>("pg_stage")(),
    codec.optionalString<LeadRecord>("follow_up_status")(),
    codec.optionalString<LeadRecord>("lead_type")(),
  ],
});

// ── Contacts ─────────────────────────────────────────────────────────────
export interface ContactRecord extends BaseRecord {
  name: string;
  phone?: string;
  email?: string;
  relation?: string;
  lead_id?: string;
  notes?: string;
}

export const contactSchema = z.object({
  ...baseFields,
  name: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().optional(),
  relation: z.string().optional(),
  lead_id: z.string().optional(),
  notes: z.string().optional(),
});

export const contactsTab = defineTab<ContactRecord>({
  name: "Contacts",
  schema: contactSchema,
  columns: [
    codec.string<ContactRecord>("id")(),
    codec.string<ContactRecord>("name")(),
    codec.optionalString<ContactRecord>("phone")(),
    codec.optionalString<ContactRecord>("email")(),
    codec.optionalString<ContactRecord>("relation")(),
    codec.optionalString<ContactRecord>("lead_id")(),
    codec.optionalString<ContactRecord>("notes")(),
    ...baseColumns<ContactRecord>(),
  ],
});

// ── Tags ─────────────────────────────────────────────────────────────────
export interface TagRecord extends BaseRecord {
  name: string;
  color?: string;
}

export const tagSchema = z.object({
  ...baseFields,
  name: z.string().min(1),
  color: z.string().optional(),
});

export const tagsTab = defineTab<TagRecord>({
  name: "Tags",
  hidden: true,
  schema: tagSchema,
  columns: [
    codec.string<TagRecord>("id")(),
    codec.string<TagRecord>("name")(),
    codec.optionalString<TagRecord>("color")(),
    ...baseColumns<TagRecord>(),
  ],
});

// ── Notes ────────────────────────────────────────────────────────────────
export interface NoteRecord extends BaseRecord {
  lead_id: string;
  author_id: string;
  body: string;
}

export const noteSchema = z.object({
  ...baseFields,
  lead_id: z.string().min(1),
  author_id: z.string().min(1),
  body: z.string().min(1),
});

export const notesTab = defineTab<NoteRecord>({
  name: "Notes",
  schema: noteSchema,
  columns: [
    codec.string<NoteRecord>("id")(),
    codec.string<NoteRecord>("lead_id")(),
    codec.string<NoteRecord>("author_id")(),
    codec.string<NoteRecord>("body")(),
    ...baseColumns<NoteRecord>(),
  ],
});
