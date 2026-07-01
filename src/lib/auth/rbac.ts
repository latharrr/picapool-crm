import type { Role } from "@/lib/sheets/schema/common";
import type { PermissionName } from "@/lib/sheets/schema/common";

/**
 * Hardcoded default permission matrix. This is the source of truth enforced
 * server-side in every mutating/sensitive API route — the frontend only
 * uses it to hide/disable UI, never as the actual authorization check.
 */
const MATRIX: Record<Role, Set<PermissionName>> = {
  Founder: new Set([
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
  ]),
  Admin: new Set([
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
  ]),
  Manager: new Set([
    "VIEW",
    "EDIT",
    "DELETE",
    "IMPORT",
    "EXPORT",
    "CALL",
    "SEND_WHATSAPP",
    "SEND_EMAIL",
    "VIEW_ANALYTICS",
  ]),
  "Team Lead": new Set(["VIEW", "EDIT", "EXPORT", "CALL", "SEND_WHATSAPP", "SEND_EMAIL", "VIEW_ANALYTICS"]),
  Intern: new Set(["VIEW", "EDIT", "CALL", "SEND_WHATSAPP"]),
  Viewer: new Set(["VIEW"]),
};

export function hasPermission(role: Role, permission: PermissionName): boolean {
  return MATRIX[role]?.has(permission) ?? false;
}

export function permissionsForRole(role: Role): PermissionName[] {
  return Array.from(MATRIX[role] ?? []);
}

export class ForbiddenError extends Error {
  constructor(permission: PermissionName) {
    super(`Missing required permission: ${permission}`);
    this.name = "ForbiddenError";
  }
}

export class UnauthorizedError extends Error {
  constructor() {
    super("Not authenticated");
    this.name = "UnauthorizedError";
  }
}

/** Throws ForbiddenError if `role` doesn't have `permission`. Call at the top of every mutating API route. */
export function requirePermission(role: Role | undefined, permission: PermissionName): void {
  if (!role) throw new UnauthorizedError();
  if (!hasPermission(role, permission)) throw new ForbiddenError(permission);
}

export const ALL_PERMISSIONS: PermissionName[] = [
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
];

export const ALL_ROLES: Role[] = ["Founder", "Admin", "Manager", "Team Lead", "Intern", "Viewer"];

export { MATRIX as PERMISSION_MATRIX };
