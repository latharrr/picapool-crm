import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { requireWorkspaceContext } from "@/lib/workspace-context";
import { leadsRepository, activityLogRepository } from "@/lib/sheets/repositories";
import { errorResponse } from "@/lib/api/errors";
import type { LeadRecord } from "@/lib/sheets/schema/crm";

const importRowSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().optional(),
  college: z.string().optional(),
  university: z.string().optional(),
  year: z.string().optional(),
  city: z.string().optional(),
  source: z.string().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

const bodySchema = z.object({
  workspaceId: z.string().min(1),
  rows: z.array(z.unknown()).max(5000),
});

interface RowError {
  row: number;
  message: string;
}

function normalizePhone(phone: string): string {
  return phone.replace(/[\s-()]/g, "");
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const session = await auth();
    const ctx = await requireWorkspaceContext(session, parsed.data.workspaceId, "IMPORT");
    const userId = session!.user.id;

    const existingLeads = await leadsRepository.list(ctx.spreadsheetId);
    const byPhone = new Map<string, LeadRecord>();
    const byEmail = new Map<string, LeadRecord>();
    for (const lead of existingLeads) {
      byPhone.set(normalizePhone(lead.phone), lead);
      if (lead.email) byEmail.set(lead.email.toLowerCase(), lead);
    }

    const errors: RowError[] = [];
    const toCreate: z.infer<typeof importRowSchema>[] = [];
    const toUpdate: { id: string; patch: z.infer<typeof importRowSchema> }[] = [];
    const seenInBatch = new Set<string>();

    parsed.data.rows.forEach((raw, index) => {
      const row = importRowSchema.safeParse(raw);
      if (!row.success) {
        errors.push({ row: index + 1, message: row.error.issues[0]?.message ?? "Invalid row" });
        return;
      }

      const phoneKey = normalizePhone(row.data.phone);
      if (seenInBatch.has(phoneKey)) {
        errors.push({ row: index + 1, message: `Duplicate phone in file: ${row.data.phone}` });
        return;
      }
      seenInBatch.add(phoneKey);

      const existing =
        byPhone.get(phoneKey) ?? (row.data.email ? byEmail.get(row.data.email.toLowerCase()) : undefined);

      if (existing) {
        toUpdate.push({ id: existing.id, patch: row.data });
      } else {
        toCreate.push(row.data);
      }
    });

    let created = 0;
    if (toCreate.length > 0) {
      const records = await leadsRepository.batchCreate(
        ctx.spreadsheetId,
        toCreate.map((row) => ({
          name: row.name,
          phone: row.phone,
          email: row.email,
          college: row.college,
          university: row.university,
          year: row.year,
          city: row.city,
          source: row.source,
          status: "new" as const,
          priority: "medium" as const,
          tags: row.tags ?? [],
          notes: row.notes,
          created_by: userId,
        }))
      );
      created = records.length;
    }

    let updated = 0;
    for (const { id, patch } of toUpdate) {
      await leadsRepository.update(
        ctx.spreadsheetId,
        id,
        {
          name: patch.name,
          phone: patch.phone,
          email: patch.email,
          college: patch.college,
          university: patch.university,
          year: patch.year,
          city: patch.city,
          source: patch.source,
          ...(patch.tags ? { tags: patch.tags } : {}),
          ...(patch.notes ? { notes: patch.notes } : {}),
        },
        userId
      );
      updated++;
    }

    await activityLogRepository.create(ctx.spreadsheetId, {
      actor_id: userId,
      action: "leads_imported",
      entity_type: "leads",
      entity_id: ctx.workspaceId,
      diff: { created, updated, errors: errors.length },
      created_by: userId,
    });

    return NextResponse.json({ created, updated, errors });
  } catch (err) {
    return errorResponse(err);
  }
}
