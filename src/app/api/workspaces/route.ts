import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { requirePermission } from "@/lib/auth/rbac";
import { workspacesRepository, userWorkspacesRepository } from "@/lib/sheets/repositories";
import { getRootSpreadsheetId } from "@/lib/env";
import { provisionWorkspace, extractSpreadsheetId } from "@/lib/sheets/provisioning";
import { errorResponse } from "@/lib/api/errors";

const createWorkspaceSchema = z.object({
  name: z.string().min(1),
  admin_emails: z.array(z.string()).default([]),
  // Optional: attach to a spreadsheet the user already created and shared
  // with the service account, instead of letting the app create a new
  // file (needed when the service account has no Drive storage of its
  // own — see docs/SERVICE_ACCOUNT.md).
  existing_spreadsheet: z.string().optional(),
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
    const existingId = parsed.data.existing_spreadsheet
      ? extractSpreadsheetId(parsed.data.existing_spreadsheet)
      : undefined;

    const result = await provisionWorkspace(
      parsed.data.name,
      parsed.data.admin_emails,
      session!.user.id,
      existingId
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
