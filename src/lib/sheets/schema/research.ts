import { z } from "zod";
import { baseFields } from "./common";
import { codec, baseColumns, defineTab, type BaseRecord } from "../tab";

// The taxonomy's Call Status values are all outcomes of an attempted call
// (Completed/Call Later/Refused/Not Answered/Wrong Number) — there's no
// "not yet contacted" state in the source dictionary, so "pending" is added
// here as the initial state new/imported respondents start in. This is what
// drives the interview queue, the same way LeadStatus drives the Leads one.
export const respondentCallStatusEnum = z.enum([
  "pending",
  "completed",
  "call_later",
  "refused",
  "not_answered",
  "wrong_number",
]);
export type RespondentCallStatus = z.infer<typeof respondentCallStatusEnum>;

export interface RespondentRecord extends BaseRecord {
  name: string;
  username?: string;
  phone: string;
  call_status: RespondentCallStatus;
  jtbd?: string;
  acquisition_source?: string;
  initial_perception?: string;
  current_perception?: string;
  feature_awareness?: string;
  activation?: string;
  problem_solved?: string;
  coordination_success?: string;
  marketplace_confidence?: string;
  trust_score?: number;
  exp_match_score?: number;
  return_intent_score?: number;
  cross_jtbd_return?: string;
  biggest_friction?: string;
  missing_capability?: string;
  raw_notes?: string;
}

// Coded fields beyond call_status are validated as non-empty strings rather
// than strict z.enum: the real historical data has minor mismatches against
// the Taxonomy/FilterLists dropdown lists (e.g. "Unclear / Confused" isn't
// in FilterLists' InitPercep list), so hard enums would reject legitimate
// past interview data on import. The taxonomy values still drive the UI's
// <Select> options (src/lib/research/taxonomy-options.ts) as a soft
// constraint for anything logged going forward.
export const respondentSchema = z.object({
  ...baseFields,
  name: z.string().min(1),
  username: z.string().optional(),
  phone: z.string().min(1),
  call_status: respondentCallStatusEnum,
  jtbd: z.string().optional(),
  acquisition_source: z.string().optional(),
  initial_perception: z.string().optional(),
  current_perception: z.string().optional(),
  feature_awareness: z.string().optional(),
  activation: z.string().optional(),
  problem_solved: z.string().optional(),
  coordination_success: z.string().optional(),
  marketplace_confidence: z.string().optional(),
  trust_score: z.number().min(1).max(5).optional(),
  exp_match_score: z.number().min(1).max(5).optional(),
  return_intent_score: z.number().min(1).max(5).optional(),
  cross_jtbd_return: z.string().optional(),
  biggest_friction: z.string().optional(),
  missing_capability: z.string().optional(),
  raw_notes: z.string().optional(),
});

export const respondentsTab = defineTab<RespondentRecord>({
  name: "Respondents",
  hidden: true,
  schema: respondentSchema,
  columns: [
    codec.string<RespondentRecord>("id")(),
    codec.string<RespondentRecord>("name")(),
    codec.optionalString<RespondentRecord>("username")(),
    codec.string<RespondentRecord>("phone")(),
    codec.string<RespondentRecord>("call_status")(),
    codec.optionalString<RespondentRecord>("jtbd")(),
    codec.optionalString<RespondentRecord>("acquisition_source")(),
    codec.optionalString<RespondentRecord>("initial_perception")(),
    codec.optionalString<RespondentRecord>("current_perception")(),
    codec.optionalString<RespondentRecord>("feature_awareness")(),
    codec.optionalString<RespondentRecord>("activation")(),
    codec.optionalString<RespondentRecord>("problem_solved")(),
    codec.optionalString<RespondentRecord>("coordination_success")(),
    codec.optionalString<RespondentRecord>("marketplace_confidence")(),
    codec.number<RespondentRecord>("trust_score")(),
    codec.number<RespondentRecord>("exp_match_score")(),
    codec.number<RespondentRecord>("return_intent_score")(),
    codec.optionalString<RespondentRecord>("cross_jtbd_return")(),
    codec.optionalString<RespondentRecord>("biggest_friction")(),
    codec.optionalString<RespondentRecord>("missing_capability")(),
    codec.optionalString<RespondentRecord>("raw_notes")(),
    ...baseColumns<RespondentRecord>(),
  ],
});
