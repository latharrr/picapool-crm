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
]);
export type LeadStatus = z.infer<typeof leadStatusEnum>;

export const leadPriorityEnum = z.enum(["low", "medium", "high"]);

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
