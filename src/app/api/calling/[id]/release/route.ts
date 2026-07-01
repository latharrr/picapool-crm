import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { requireWorkspaceContext } from "@/lib/workspace-context";
import { releaseLeadLock } from "@/lib/kv/lock";
import { errorResponse } from "@/lib/api/errors";

const bodySchema = z.object({ workspaceId: z.string().min(1) });

export async function POST(request: Request, ctxParam: RouteContext<"/api/calling/[id]/release">) {
  const { id } = await ctxParam.params;
  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const session = await auth();
    const ctx = await requireWorkspaceContext(session, parsed.data.workspaceId, "CALL");
    await releaseLeadLock(ctx.workspaceId, id, session!.user.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
