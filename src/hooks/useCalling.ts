import { useMutation } from "@tanstack/react-query";
import type { LeadRecord } from "@/lib/sheets/schema/crm";
import type { CallOutcome } from "@/lib/sheets/schema/engagement";
import type { TimelineEntry } from "@/lib/leads/timeline";

interface SaveNextInput {
  leadId: string;
  outcome: CallOutcome;
  notes?: string;
  ownerName?: string;
  beds?: number;
  gender?: LeadRecord["gender"];
  pgStage?: LeadRecord["pg_stage"];
  followUp?: LeadRecord["follow_up_status"];
  priority?: LeadRecord["priority"];
}

interface NextResponse {
  lead: LeadRecord | null;
  timeline?: TimelineEntry[];
}

interface SaveNextResponse {
  saved: LeadRecord;
  next: LeadRecord | null;
  nextTimeline: TimelineEntry[];
}

async function postJSON<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(typeof data.error === "string" ? data.error : "Request failed");
  }
  return res.json();
}

export function useNextLead(workspaceId: string) {
  return useMutation({
    mutationFn: () => postJSON<NextResponse>("/api/calling/next", { workspaceId }),
  });
}

export function useSaveAndNext(workspaceId: string) {
  return useMutation({
    mutationFn: ({ leadId, ...body }: SaveNextInput) =>
      postJSON<SaveNextResponse>(`/api/calling/${leadId}/save-next`, {
        workspaceId,
        ...body,
      }),
  });
}

export function releaseLead(workspaceId: string, leadId: string) {
  // Fire-and-forget with keepalive so it still fires during unmount/navigation.
  fetch(`/api/calling/${leadId}/release`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ workspaceId }),
    keepalive: true,
  }).catch(() => {});
}
