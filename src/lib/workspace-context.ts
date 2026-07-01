import type { Session } from "next-auth";
import type { Role, PermissionName } from "@/lib/sheets/schema/common";
import { workspacesRepository } from "@/lib/sheets/repositories";
import { getRootSpreadsheetId } from "@/lib/env";
import { hasPermission, ForbiddenError, UnauthorizedError } from "@/lib/auth/rbac";
import { getActiveWorkspaceId } from "@/lib/workspace";

export interface WorkspaceContext {
  workspaceId: string;
  spreadsheetId: string;
  role: Role;
}

export function getWorkspaceRole(session: Session, workspaceId: string): Role | null {
  return session.user.workspaces.find((w) => w.id === workspaceId)?.role ?? null;
}

/**
 * Resolves both authorization (the caller's role in this workspace) and
 * where its data actually lives (the workspace's own spreadsheet ID) in one
 * call. Returns null if the workspace doesn't exist, the root spreadsheet
 * isn't configured, or the caller isn't a member — callers should treat all
 * of those as "no access" rather than distinguishing them.
 */
export async function resolveWorkspaceContext(
  session: Session,
  workspaceId: string | null | undefined
): Promise<WorkspaceContext | null> {
  if (!workspaceId) return null;

  const role = getWorkspaceRole(session, workspaceId);
  if (!role) return null;

  const rootId = getRootSpreadsheetId();
  if (!rootId) return null;

  const workspace = await workspacesRepository.getById(rootId, workspaceId);
  if (!workspace) return null;

  return { workspaceId, spreadsheetId: workspace.spreadsheet_id, role };
}

/** For Server Component pages: resolves the user's currently active workspace (cookie, or their first membership). */
export async function getActiveWorkspaceContext(session: Session): Promise<WorkspaceContext | null> {
  const workspaceId = (await getActiveWorkspaceId()) ?? session.user.workspaces[0]?.id;
  return resolveWorkspaceContext(session, workspaceId);
}

/**
 * One-liner for API routes: resolves workspace access and enforces a
 * permission in a single call. Throws UnauthorizedError (no session) or
 * ForbiddenError (not a member / lacks the permission) — callers should
 * catch both and map to 401/403.
 */
export async function requireWorkspaceContext(
  session: Session | null,
  workspaceId: string | null | undefined,
  permission: PermissionName
): Promise<WorkspaceContext> {
  if (!session?.user) throw new UnauthorizedError();

  const ctx = await resolveWorkspaceContext(session, workspaceId);
  if (!ctx || !hasPermission(ctx.role, permission)) {
    throw new ForbiddenError(permission);
  }
  return ctx;
}
