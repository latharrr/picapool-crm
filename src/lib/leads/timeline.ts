import {
  callHistoryRepository,
  messageHistoryRepository,
  emailHistoryRepository,
  notesRepository,
} from "@/lib/sheets/repositories";

export type TimelineEntryType = "call" | "message" | "email" | "note";

export interface TimelineEntry {
  id: string;
  type: TimelineEntryType;
  timestamp: string;
  summary: string;
  detail?: string;
  actorId?: string;
}

/** Merges Call/Message/Email history + Notes for a lead into one timeline, newest first. */
export async function getLeadTimeline(
  spreadsheetId: string,
  leadId: string
): Promise<TimelineEntry[]> {
  const [calls, messages, emails, notes] = await Promise.all([
    callHistoryRepository.list(spreadsheetId),
    messageHistoryRepository.list(spreadsheetId),
    emailHistoryRepository.list(spreadsheetId),
    notesRepository.list(spreadsheetId),
  ]);

  const entries: TimelineEntry[] = [
    ...calls
      .filter((c) => c.lead_id === leadId)
      .map((c) => ({
        id: c.id,
        type: "call" as const,
        timestamp: c.called_at,
        summary: `Call — ${c.outcome.replace(/_/g, " ")}`,
        detail: c.notes,
        actorId: c.caller_id,
      })),
    ...messages
      .filter((m) => m.lead_id === leadId)
      .map((m) => ({
        id: m.id,
        type: "message" as const,
        timestamp: m.sent_at,
        summary: `WhatsApp (${m.direction})`,
        detail: m.body,
        actorId: m.sent_by,
      })),
    ...emails
      .filter((e) => e.lead_id === leadId)
      .map((e) => ({
        id: e.id,
        type: "email" as const,
        timestamp: e.sent_at,
        summary: `Email: ${e.subject}`,
        detail: e.body,
        actorId: e.sent_by,
      })),
    ...notes
      .filter((n) => n.lead_id === leadId)
      .map((n) => ({
        id: n.id,
        type: "note" as const,
        timestamp: n.created_at,
        summary: "Note",
        detail: n.body,
        actorId: n.author_id,
      })),
  ];

  return entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}
