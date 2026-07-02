import { useMutation } from "@tanstack/react-query";
import type { RespondentRecord, RespondentCallStatus } from "@/lib/sheets/schema/research";

interface NextResponse {
  respondent: RespondentRecord | null;
}

interface SaveNextResponse {
  saved: RespondentRecord;
  next: RespondentRecord | null;
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

export function useNextRespondent(workspaceId: string) {
  return useMutation({
    mutationFn: () => postJSON<NextResponse>("/api/research/next", { workspaceId }),
  });
}

export function useSaveAndNextRespondent(workspaceId: string) {
  return useMutation({
    mutationFn: ({
      respondentId,
      callStatus,
      fields,
    }: {
      respondentId: string;
      callStatus: RespondentCallStatus;
      fields?: Record<string, unknown>;
    }) =>
      postJSON<SaveNextResponse>(`/api/research/${respondentId}/save-next`, {
        workspaceId,
        call_status: callStatus,
        ...fields,
      }),
  });
}

export function releaseRespondent(workspaceId: string, respondentId: string) {
  fetch(`/api/research/${respondentId}/release`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ workspaceId }),
    keepalive: true,
  }).catch(() => {});
}
