import { NextResponse } from "next/server";
import { ForbiddenError, UnauthorizedError } from "@/lib/auth/rbac";
import { SheetsNotConfiguredError, RecordNotFoundError } from "@/lib/sheets/errors";

/** Maps known domain errors to the right HTTP status; logs + 500s anything else. */
export function errorResponse(err: unknown): NextResponse {
  if (err instanceof UnauthorizedError) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
  if (err instanceof ForbiddenError) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
  if (err instanceof RecordNotFoundError) {
    return NextResponse.json({ error: err.message }, { status: 404 });
  }
  if (err instanceof SheetsNotConfiguredError) {
    return NextResponse.json({ error: err.message }, { status: 503 });
  }
  console.error(err);
  return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
}
