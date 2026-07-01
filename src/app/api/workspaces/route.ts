import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { requirePermission, ForbiddenError, UnauthorizedError } from "@/lib/auth/rbac";
import { workspacesRepository, userWorkspacesRepository } from "@/lib/sheets/repositories";
import { getRootSpreadsheetId } from "@/lib/env";
import { SheetsNotConfiguredError } from "@/lib/sheets/errors";
import { provisionWorkspace } from "@/lib/sheets/provisioning";

const createWorkspaceSchema = z.object({
  name: z.string().min(1),
  admin_emails: z.array(z.string()).default([]),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const rootId = getRootSpreadsheetId();
  if (!rootId) return NextResponse.json({ workspaces: [] });

  try {
    const workspaces = await workspacesRepository.list(rootId);
    return NextResponse.json({ workspaces });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(request: Request) {
  const session = await auth();
  try {
    requirePermission(session?.user?.role, "MANAGE_SETTINGS");
  } catch (err) {
    return errorResponse(err);
  }

  const rootId = getRootSpreadsheetId();
  if (!rootId) {
    return NextResponse.json({ error: "Root spreadsheet not configured" }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createWorkspaceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const result = await provisionWorkspace(
      parsed.data.name,
      parsed.data.admin_emails,
      session!.user.id
    );

    // Grant the creator immediate access as Admin of the new workspace.
    await userWorkspacesRepository.create(rootId, {
      user_id: session!.user.id,
      workspace_id: result.workspaceId,
      role: "Admin",
      created_by: session!.user.id,
    });

    return NextResponse.json(result);
  } catch (err) {
    return errorResponse(err);
  }
}

function errorResponse(err: unknown) {
  if (err instanceof UnauthorizedError) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
  if (err instanceof ForbiddenError) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
  if (err instanceof SheetsNotConfiguredError) {
    return NextResponse.json({ error: err.message }, { status: 503 });
  }
  console.error(err);
  return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
}
