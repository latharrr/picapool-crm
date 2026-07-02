import { z } from "zod";
import { baseFields } from "./common";
import { codec, baseColumns, defineTab, type BaseRecord } from "../tab";

// ── Activity_Log (append-only audit trail) ──────────────────────────────────
export interface ActivityLogRecord extends BaseRecord {
  actor_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  diff: unknown;
}

export const activityLogSchema = z.object({
  ...baseFields,
  actor_id: z.string().min(1),
  action: z.string().min(1),
  entity_type: z.string().min(1),
  entity_id: z.string().min(1),
  diff: z.unknown(),
});

export const activityLogTab = defineTab<ActivityLogRecord>({
  name: "Activity_Log",
  hidden: true,
  schema: activityLogSchema,
  columns: [
    codec.string<ActivityLogRecord>("id")(),
    codec.string<ActivityLogRecord>("actor_id")(),
    codec.string<ActivityLogRecord>("action")(),
    codec.string<ActivityLogRecord>("entity_type")(),
    codec.string<ActivityLogRecord>("entity_id")(),
    codec.json<ActivityLogRecord>("diff")(),
    ...baseColumns<ActivityLogRecord>(),
  ],
});

// ── Housing_Listings ─────────────────────────────────────────────────────
export const housingAvailabilityEnum = z.enum(["available", "booked", "unavailable"]);

export interface HousingListingRecord extends BaseRecord {
  title: string;
  address?: string;
  city?: string;
  rent_amount?: number;
  availability_status: z.infer<typeof housingAvailabilityEnum>;
  contact_id?: string;
  notes?: string;
}

export const housingListingSchema = z.object({
  ...baseFields,
  title: z.string().min(1),
  address: z.string().optional(),
  city: z.string().optional(),
  rent_amount: z.number().optional(),
  availability_status: housingAvailabilityEnum,
  contact_id: z.string().optional(),
  notes: z.string().optional(),
});

export const housingListingsTab = defineTab<HousingListingRecord>({
  name: "Housing_Listings",
  schema: housingListingSchema,
  columns: [
    codec.string<HousingListingRecord>("id")(),
    codec.string<HousingListingRecord>("title")(),
    codec.optionalString<HousingListingRecord>("address")(),
    codec.optionalString<HousingListingRecord>("city")(),
    codec.number<HousingListingRecord>("rent_amount")(),
    codec.string<HousingListingRecord>("availability_status")(),
    codec.optionalString<HousingListingRecord>("contact_id")(),
    codec.optionalString<HousingListingRecord>("notes")(),
    ...baseColumns<HousingListingRecord>(),
  ],
});

// ── Notifications ────────────────────────────────────────────────────────
export interface NotificationRecord extends BaseRecord {
  user_id: string;
  type: string;
  title: string;
  body?: string;
  is_read: boolean;
  link?: string;
}

export const notificationSchema = z.object({
  ...baseFields,
  user_id: z.string().min(1),
  type: z.string().min(1),
  title: z.string().min(1),
  body: z.string().optional(),
  is_read: z.boolean(),
  link: z.string().optional(),
});

export const notificationsTab = defineTab<NotificationRecord>({
  name: "Notifications",
  hidden: true,
  schema: notificationSchema,
  columns: [
    codec.string<NotificationRecord>("id")(),
    codec.string<NotificationRecord>("user_id")(),
    codec.string<NotificationRecord>("type")(),
    codec.string<NotificationRecord>("title")(),
    codec.optionalString<NotificationRecord>("body")(),
    codec.boolean<NotificationRecord>("is_read")(),
    codec.optionalString<NotificationRecord>("link")(),
    ...baseColumns<NotificationRecord>(),
  ],
});

// ── Settings (key/value, also doubles as the feature-flag store) ──────────
export interface SettingRecord extends BaseRecord {
  key: string;
  value: string;
}

export const settingSchema = z.object({
  ...baseFields,
  key: z.string().min(1),
  value: z.string(),
});

export const settingsTab = defineTab<SettingRecord>({
  name: "Settings",
  hidden: true,
  schema: settingSchema,
  columns: [
    codec.string<SettingRecord>("id")(),
    codec.string<SettingRecord>("key")(),
    codec.string<SettingRecord>("value")(),
    ...baseColumns<SettingRecord>(),
  ],
});
