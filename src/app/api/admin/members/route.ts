import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { requirePermission } from "@/lib/auth/rbac";
import { usersRepository, userWorkspacesRepository } from "@/lib/sheets/repositories";
import { getRootSpreadsheetId } from "@/lib/env";
import { roleEnum } from "@/lib/sheets/schema/common";
import { errorResponse } from "@/lib/api/errors";

const bodySchema = z.object({
  workspaceId: z.string().min(1),
  userId: z.string().min(1),
  role: roleEnum,
});

export async function GET(request: Request) {
  const session = await auth();
  try {
    requirePermission(session?.user?.role, "MANAGE_USERS");
  } catch (err) {
    return errorResponse(err);
  }

  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId");
  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId is required" }, { status: 400 });
  }

  const rootId = getRootSpreadsheetId();
  if (!rootId) {
    return NextResponse.json({ error: "Root spreadsheet not configured" }, { status: 503 });
  }

  try {
    const [memberships, users] = await Promise.all([
      userWorkspacesRepository.list(rootId),
      usersRepository.list(rootId),
    ]);

    const userMap = new Map(users.map((u) => [u.id, u]));

    const workspaceMembers = memberships
      .filter((m) => m.workspace_id === workspaceId)
      .map((m) => {
        const u = userMap.get(m.user_id);
        return {
          id: m.id,
          userId: m.user_id,
          userName: u?.name ?? "Unknown user",
          userEmail: u?.email ?? "Unknown email",
          role: m.role,
          created_at: m.created_at,
        };
      });

    return NextResponse.json({ members: workspaceMembers });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(request: Request) {
  const session = await auth();
  try {
    requirePermission(session?.user?.role, "MANAGE_USERS");
  } catch (err) {
    return errorResponse(err);
  }

  const rootId = getRootSpreadsheetId();
  if (!rootId) {
    return NextResponse.json({ error: "Root spreadsheet not configured" }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { workspaceId, userId, role } = parsed.data;

  try {
    const memberships = await userWorkspacesRepository.list(rootId);
    const existing = memberships.find(
      (m) => m.workspace_id === workspaceId && m.user_id === userId
    );

    if (existing) {
      const updated = await userWorkspacesRepository.update(
        rootId,
        existing.id,
        { role },
        session!.user.id
      );
      return NextResponse.json({ member: updated, updated: true });
    } else {
      const created = await userWorkspacesRepository.create(rootId, {
        user_id: userId,
        workspace_id: workspaceId,
        role,
        created_by: session!.user.id,
      });
      return NextResponse.json({ member: created, updated: false });
    }
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(request: Request) {
  const session = await auth();
  try {
    requirePermission(session?.user?.role, "MANAGE_USERS");
  } catch (err) {
    return errorResponse(err);
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const rootId = getRootSpreadsheetId();
  if (!rootId) {
    return NextResponse.json({ error: "Root spreadsheet not configured" }, { status: 503 });
  }

  try {
    await userWorkspacesRepository.softDelete(rootId, id, session!.user.id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return errorResponse(err);
  }
}
