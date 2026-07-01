import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { requirePermission, ForbiddenError, UnauthorizedError } from "@/lib/auth/rbac";
import { usersRepository } from "@/lib/sheets/repositories";
import { getRootSpreadsheetId } from "@/lib/env";
import { SheetsNotConfiguredError } from "@/lib/sheets/errors";
import { roleEnum } from "@/lib/sheets/schema/common";

const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().min(3),
  password: z.string().min(8),
  default_role: roleEnum,
  phone: z.string().optional(),
});

export async function GET() {
  const session = await auth();
  try {
    requirePermission(session?.user?.role, "MANAGE_USERS");
  } catch (err) {
    return errorResponse(err);
  }

  const rootId = getRootSpreadsheetId();
  if (!rootId) return NextResponse.json({ users: [] });

  try {
    const users = await usersRepository.list(rootId);
    return NextResponse.json({
      users: users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        default_role: u.default_role,
        is_active: u.is_active,
      })),
    });
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
  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const existing = await usersRepository.list(rootId);
    if (existing.some((u) => u.email.toLowerCase() === parsed.data.email.toLowerCase())) {
      return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 10);
    const user = await usersRepository.create(rootId, {
      name: parsed.data.name,
      email: parsed.data.email,
      password_hash: passwordHash,
      default_role: parsed.data.default_role,
      phone: parsed.data.phone,
      is_active: true,
      created_by: session!.user.id,
    });

    return NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email, default_role: user.default_role },
    });
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
