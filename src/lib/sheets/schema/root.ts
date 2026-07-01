import { z } from "zod";
import { baseFields, roleEnum } from "./common";
import { codec, baseColumns, defineTab, type BaseRecord } from "../tab";

// ── Users (root spreadsheet) ────────────────────────────────────────────────
export interface UserRecord extends BaseRecord {
  name: string;
  email: string;
  password_hash: string;
  default_role: z.infer<typeof roleEnum>;
  phone?: string;
  is_active: boolean;
}

export const userSchema = z.object({
  ...baseFields,
  name: z.string().min(1),
  email: z.string().min(1),
  password_hash: z.string().min(1),
  default_role: roleEnum,
  phone: z.string().optional(),
  is_active: z.boolean(),
});

export const usersTab = defineTab<UserRecord>({
  name: "Users",
  schema: userSchema,
  columns: [
    codec.string<UserRecord>("id")(),
    codec.string<UserRecord>("name")(),
    codec.string<UserRecord>("email")(),
    codec.string<UserRecord>("password_hash")(),
    codec.string<UserRecord>("default_role")(),
    codec.optionalString<UserRecord>("phone")(),
    codec.boolean<UserRecord>("is_active")(),
    ...baseColumns<UserRecord>(),
  ],
});

// ── Roles_Permissions (root spreadsheet) ────────────────────────────────────
// Mirrors the hardcoded matrix in lib/auth/rbac.ts for admin visibility /
// future overrides. The code matrix remains the source of truth enforced
// server-side; this tab is not read for authorization decisions yet.
export interface RolePermissionRecord extends BaseRecord {
  role: z.infer<typeof roleEnum>;
  permission: string;
  allowed: boolean;
}

export const rolePermissionSchema = z.object({
  ...baseFields,
  role: roleEnum,
  permission: z.string().min(1),
  allowed: z.boolean(),
});

export const rolesPermissionsTab = defineTab<RolePermissionRecord>({
  name: "Roles_Permissions",
  schema: rolePermissionSchema,
  columns: [
    codec.string<RolePermissionRecord>("id")(),
    codec.string<RolePermissionRecord>("role")(),
    codec.string<RolePermissionRecord>("permission")(),
    codec.boolean<RolePermissionRecord>("allowed")(),
    ...baseColumns<RolePermissionRecord>(),
  ],
});

// ── Workspaces (root spreadsheet, registry of provisioned workspaces) ──────
export interface WorkspaceRecord extends BaseRecord {
  name: string;
  spreadsheet_id: string;
  admin_emails: string[];
}

export const workspaceSchema = z.object({
  ...baseFields,
  name: z.string().min(1),
  spreadsheet_id: z.string().min(1),
  admin_emails: z.array(z.string()),
});

export const workspacesTab = defineTab<WorkspaceRecord>({
  name: "Workspaces",
  schema: workspaceSchema,
  columns: [
    codec.string<WorkspaceRecord>("id")(),
    codec.string<WorkspaceRecord>("name")(),
    codec.string<WorkspaceRecord>("spreadsheet_id")(),
    codec.stringArray<WorkspaceRecord>("admin_emails")(),
    ...baseColumns<WorkspaceRecord>(),
  ],
});

// ── User_Workspaces (root spreadsheet, membership + per-workspace role) ────
export interface UserWorkspaceRecord extends BaseRecord {
  user_id: string;
  workspace_id: string;
  role: z.infer<typeof roleEnum>;
}

export const userWorkspaceSchema = z.object({
  ...baseFields,
  user_id: z.string().min(1),
  workspace_id: z.string().min(1),
  role: roleEnum,
});

export const userWorkspacesTab = defineTab<UserWorkspaceRecord>({
  name: "User_Workspaces",
  schema: userWorkspaceSchema,
  columns: [
    codec.string<UserWorkspaceRecord>("id")(),
    codec.string<UserWorkspaceRecord>("user_id")(),
    codec.string<UserWorkspaceRecord>("workspace_id")(),
    codec.string<UserWorkspaceRecord>("role")(),
    ...baseColumns<UserWorkspaceRecord>(),
  ],
});
