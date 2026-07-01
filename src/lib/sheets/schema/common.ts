import { z } from "zod";

/** Shared audit fields every tab's Zod schema extends with `.extend(baseFields)`. */
export const baseFields = {
  id: z.string().min(1),
  created_at: z.string(),
  updated_at: z.string(),
  created_by: z.string(),
  updated_by: z.string(),
  is_deleted: z.boolean(),
};

export const roleEnum = z.enum([
  "Founder",
  "Admin",
  "Manager",
  "Team Lead",
  "Intern",
  "Viewer",
]);
export type Role = z.infer<typeof roleEnum>;

export const permissionEnum = z.enum([
  "VIEW",
  "EDIT",
  "DELETE",
  "IMPORT",
  "EXPORT",
  "CALL",
  "SEND_WHATSAPP",
  "SEND_EMAIL",
  "MANAGE_USERS",
  "VIEW_ANALYTICS",
  "MANAGE_SETTINGS",
]);
export type PermissionName = z.infer<typeof permissionEnum>;
