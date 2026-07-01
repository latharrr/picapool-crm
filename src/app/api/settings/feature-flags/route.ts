import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { requireWorkspaceContext } from "@/lib/workspace-context";
import { setFeatureFlag, ALL_FEATURE_KEYS } from "@/lib/settings";
import { errorResponse } from "@/lib/api/errors";

const bodySchema = z.object({
  workspaceId: z.string().min(1),
  feature: z.enum(ALL_FEATURE_KEYS as [string, ...string[]]),
  enabled: z.boolean(),
});

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const session = await auth();
    const ctx = await requireWorkspaceContext(session, parsed.data.workspaceId, "MANAGE_SETTINGS");
    await setFeatureFlag(
      ctx.spreadsheetId,
      parsed.data.feature as (typeof ALL_FEATURE_KEYS)[number],
      parsed.data.enabled,
      session!.user.id
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
