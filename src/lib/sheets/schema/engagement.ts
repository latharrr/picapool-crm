import { z } from "zod";
import { baseFields } from "./common";
import { codec, baseColumns, defineTab, type BaseRecord } from "../tab";

// ── Call_History ─────────────────────────────────────────────────────────
export const callOutcomeEnum = z.enum([
  "connected",
  "interested",
  "callback",
  "busy",
  "wrong_number",
  "spam",
  "no_answer",
]);
export type CallOutcome = z.infer<typeof callOutcomeEnum>;

export interface CallHistoryRecord extends BaseRecord {
  lead_id: string;
  caller_id: string;
  outcome: CallOutcome;
  notes?: string;
  duration_seconds?: number;
  called_at: string;
}

export const callHistorySchema = z.object({
  ...baseFields,
  lead_id: z.string().min(1),
  caller_id: z.string().min(1),
  outcome: callOutcomeEnum,
  notes: z.string().optional(),
  duration_seconds: z.number().optional(),
  called_at: z.string(),
});

export const callHistoryTab = defineTab<CallHistoryRecord>({
  name: "Call_History",
  schema: callHistorySchema,
  columns: [
    codec.string<CallHistoryRecord>("id")(),
    codec.string<CallHistoryRecord>("lead_id")(),
    codec.string<CallHistoryRecord>("caller_id")(),
    codec.string<CallHistoryRecord>("outcome")(),
    codec.optionalString<CallHistoryRecord>("notes")(),
    codec.number<CallHistoryRecord>("duration_seconds")(),
    codec.string<CallHistoryRecord>("called_at")(),
    ...baseColumns<CallHistoryRecord>(),
  ],
});

// ── Message_History (WhatsApp) ──────────────────────────────────────────────
export const messageStatusEnum = z.enum(["logged", "sent", "delivered", "failed"]);
export const directionEnum = z.enum(["outbound", "inbound"]);

export interface MessageHistoryRecord extends BaseRecord {
  lead_id: string;
  direction: z.infer<typeof directionEnum>;
  body: string;
  status: z.infer<typeof messageStatusEnum>;
  sent_by?: string;
  sent_at: string;
}

export const messageHistorySchema = z.object({
  ...baseFields,
  lead_id: z.string().min(1),
  direction: directionEnum,
  body: z.string().min(1),
  status: messageStatusEnum,
  sent_by: z.string().optional(),
  sent_at: z.string(),
});

export const messageHistoryTab = defineTab<MessageHistoryRecord>({
  name: "Message_History",
  schema: messageHistorySchema,
  columns: [
    codec.string<MessageHistoryRecord>("id")(),
    codec.string<MessageHistoryRecord>("lead_id")(),
    codec.string<MessageHistoryRecord>("direction")(),
    codec.string<MessageHistoryRecord>("body")(),
    codec.string<MessageHistoryRecord>("status")(),
    codec.optionalString<MessageHistoryRecord>("sent_by")(),
    codec.string<MessageHistoryRecord>("sent_at")(),
    ...baseColumns<MessageHistoryRecord>(),
  ],
});

// ── Email_History ────────────────────────────────────────────────────────
export interface EmailHistoryRecord extends BaseRecord {
  lead_id: string;
  direction: z.infer<typeof directionEnum>;
  subject: string;
  body: string;
  status: z.infer<typeof messageStatusEnum>;
  sent_by?: string;
  sent_at: string;
}

export const emailHistorySchema = z.object({
  ...baseFields,
  lead_id: z.string().min(1),
  direction: directionEnum,
  subject: z.string().min(1),
  body: z.string(),
  status: messageStatusEnum,
  sent_by: z.string().optional(),
  sent_at: z.string(),
});

export const emailHistoryTab = defineTab<EmailHistoryRecord>({
  name: "Email_History",
  schema: emailHistorySchema,
  columns: [
    codec.string<EmailHistoryRecord>("id")(),
    codec.string<EmailHistoryRecord>("lead_id")(),
    codec.string<EmailHistoryRecord>("direction")(),
    codec.string<EmailHistoryRecord>("subject")(),
    codec.string<EmailHistoryRecord>("body")(),
    codec.string<EmailHistoryRecord>("status")(),
    codec.optionalString<EmailHistoryRecord>("sent_by")(),
    codec.string<EmailHistoryRecord>("sent_at")(),
    ...baseColumns<EmailHistoryRecord>(),
  ],
});

// ── Tasks ────────────────────────────────────────────────────────────────
export const taskPriorityEnum = z.enum(["low", "medium", "high"]);
export const taskStatusEnum = z.enum(["open", "in_progress", "done"]);

export interface TaskRecord extends BaseRecord {
  title: string;
  description?: string;
  assignee_id?: string;
  due_date?: string;
  priority: z.infer<typeof taskPriorityEnum>;
  status: z.infer<typeof taskStatusEnum>;
  linked_lead_id?: string;
  linked_campaign_id?: string;
}

export const taskSchema = z.object({
  ...baseFields,
  title: z.string().min(1),
  description: z.string().optional(),
  assignee_id: z.string().optional(),
  due_date: z.string().optional(),
  priority: taskPriorityEnum,
  status: taskStatusEnum,
  linked_lead_id: z.string().optional(),
  linked_campaign_id: z.string().optional(),
});

export const tasksTab = defineTab<TaskRecord>({
  name: "Tasks",
  schema: taskSchema,
  columns: [
    codec.string<TaskRecord>("id")(),
    codec.string<TaskRecord>("title")(),
    codec.optionalString<TaskRecord>("description")(),
    codec.optionalString<TaskRecord>("assignee_id")(),
    codec.optionalString<TaskRecord>("due_date")(),
    codec.string<TaskRecord>("priority")(),
    codec.string<TaskRecord>("status")(),
    codec.optionalString<TaskRecord>("linked_lead_id")(),
    codec.optionalString<TaskRecord>("linked_campaign_id")(),
    ...baseColumns<TaskRecord>(),
  ],
});

// ── Campaigns ────────────────────────────────────────────────────────────
export const campaignStatusEnum = z.enum(["active", "paused", "ended"]);

export interface CampaignRecord extends BaseRecord {
  name: string;
  description?: string;
  source?: string;
  status: z.infer<typeof campaignStatusEnum>;
  start_date?: string;
  end_date?: string;
}

export const campaignSchema = z.object({
  ...baseFields,
  name: z.string().min(1),
  description: z.string().optional(),
  source: z.string().optional(),
  status: campaignStatusEnum,
  start_date: z.string().optional(),
  end_date: z.string().optional(),
});

export const campaignsTab = defineTab<CampaignRecord>({
  name: "Campaigns",
  schema: campaignSchema,
  columns: [
    codec.string<CampaignRecord>("id")(),
    codec.string<CampaignRecord>("name")(),
    codec.optionalString<CampaignRecord>("description")(),
    codec.optionalString<CampaignRecord>("source")(),
    codec.string<CampaignRecord>("status")(),
    codec.optionalString<CampaignRecord>("start_date")(),
    codec.optionalString<CampaignRecord>("end_date")(),
    ...baseColumns<CampaignRecord>(),
  ],
});
