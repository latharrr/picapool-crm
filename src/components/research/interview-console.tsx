"use client";

import { useEffect, useRef, useState } from "react";
import { ClipboardList, PhoneOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { CallStatusButtons, CALL_STATUSES } from "./call-status-buttons";
import {
  InterviewFormFields,
  EMPTY_INTERVIEW_FORM,
  type InterviewFormValues,
} from "./interview-form-fields";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useNextRespondent, useSaveAndNextRespondent, releaseRespondent } from "@/hooks/useResearch";
import type { RespondentRecord, RespondentCallStatus } from "@/lib/sheets/schema/research";
import { toast } from "sonner";

type Phase = "idle" | "active" | "empty";

function respondentToForm(r: RespondentRecord): InterviewFormValues {
  return {
    jtbd: r.jtbd ?? "",
    acquisition_source: r.acquisition_source ?? "",
    initial_perception: r.initial_perception ?? "",
    current_perception: r.current_perception ?? "",
    feature_awareness: r.feature_awareness ?? "",
    activation: r.activation ?? "",
    problem_solved: r.problem_solved ?? "",
    coordination_success: r.coordination_success ?? "",
    marketplace_confidence: r.marketplace_confidence ?? "",
    trust_score: r.trust_score,
    exp_match_score: r.exp_match_score,
    return_intent_score: r.return_intent_score,
    cross_jtbd_return: r.cross_jtbd_return ?? "",
    biggest_friction: r.biggest_friction ?? "",
    missing_capability: r.missing_capability ?? "",
    raw_notes: r.raw_notes ?? "",
  };
}

export function InterviewConsole({ workspaceId }: { workspaceId: string }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [respondent, setRespondent] = useState<RespondentRecord | null>(null);
  const [status, setStatus] = useState<RespondentCallStatus | null>(null);
  const [form, setForm] = useState<InterviewFormValues>(EMPTY_INTERVIEW_FORM);
  const respondentRef = useRef<RespondentRecord | null>(null);
  useEffect(() => {
    respondentRef.current = respondent;
  }, [respondent]);

  const nextMutation = useNextRespondent(workspaceId);
  const saveMutation = useSaveAndNextRespondent(workspaceId);

  async function startOrNext() {
    const result = await nextMutation.mutateAsync();
    if (!result.respondent) {
      setPhase("empty");
      setRespondent(null);
      return;
    }
    setRespondent(result.respondent);
    setStatus(null);
    setForm(respondentToForm(result.respondent));
    setPhase("active");
  }

  async function handleSave() {
    if (!respondent || !status) return;
    try {
      const fields = status === "completed" ? { ...form } : { raw_notes: form.raw_notes };
      const result = await saveMutation.mutateAsync({
        respondentId: respondent.id,
        callStatus: status,
        fields,
      });
      toast.success(`Saved: ${status.replace(/_/g, " ")}`);
      if (!result.next) {
        setPhase("empty");
        setRespondent(null);
        return;
      }
      setRespondent(result.next);
      setStatus(null);
      setForm(respondentToForm(result.next));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save interview");
    }
  }

  useEffect(() => {
    function handleBeforeUnload() {
      if (respondentRef.current) releaseRespondent(workspaceId, respondentRef.current.id);
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      if (respondentRef.current) releaseRespondent(workspaceId, respondentRef.current.id);
    };
  }, [workspaceId]);

  useEffect(() => {
    if (phase !== "active") return;
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const isTyping = target?.tagName === "TEXTAREA" || target?.tagName === "INPUT";
      if (isTyping) return;
      const match = CALL_STATUSES.find((s) => s.key === e.key);
      if (match) {
        e.preventDefault();
        setStatus(match.status);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [phase]);

  if (phase === "idle") {
    return (
      <EmptyState
        icon={ClipboardList}
        title="Ready to start interviewing"
        description="The server will lock and hand you the next pending respondent."
        action={
          <Button onClick={startOrNext} disabled={nextMutation.isPending}>
            {nextMutation.isPending ? "Loading..." : "Start Interviewing"}
          </Button>
        }
      />
    );
  }

  if (phase === "empty") {
    return (
      <EmptyState
        icon={PhoneOff}
        title="Queue is empty"
        description="No pending or callback respondents are waiting right now."
        action={<Button onClick={startOrNext}>Check again</Button>}
      />
    );
  }

  if (!respondent) return null;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-lg font-semibold text-foreground">{respondent.name}</h2>
        <p className="text-sm text-muted-foreground">
          {respondent.phone}
          {respondent.username ? ` · @${respondent.username}` : ""}
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <p className="mb-3 text-sm font-medium text-foreground">
          Call outcome <span className="font-normal text-muted-foreground">(or press 1–5)</span>
        </p>
        <CallStatusButtons selected={status} onSelect={setStatus} disabled={saveMutation.isPending} />
      </div>

      {status === "completed" && (
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="mb-3 text-sm font-semibold text-foreground">Interview signals</p>
          <InterviewFormFields values={form} onChange={(patch) => setForm((f) => ({ ...f, ...patch }))} />
        </div>
      )}

      {status && status !== "completed" && (
        <div className="rounded-xl border border-border bg-card p-5">
          <Label htmlFor="quick_notes">Notes</Label>
          <Textarea
            id="quick_notes"
            rows={2}
            className="mt-2"
            value={form.raw_notes}
            onChange={(e) => setForm((f) => ({ ...f, raw_notes: e.target.value }))}
          />
        </div>
      )}

      {status && (
        <Button onClick={handleSave} disabled={saveMutation.isPending}>
          {saveMutation.isPending ? "Saving..." : "Save & Next"}
        </Button>
      )}
    </div>
  );
}
