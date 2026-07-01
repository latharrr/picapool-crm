"use client";

import { useEffect, useRef, useState } from "react";
import { Phone, PhoneOff, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/leads/status-badge";
import { TimelineList } from "@/components/leads/timeline-list";
import { EmptyState } from "@/components/shared/empty-state";
import { OutcomeButtons, OUTCOMES } from "./outcome-buttons";
import { useNextLead, useSaveAndNext, releaseLead } from "@/hooks/useCalling";
import type { LeadRecord } from "@/lib/sheets/schema/crm";
import type { TimelineEntry } from "@/lib/leads/timeline";
import type { CallOutcome } from "@/lib/sheets/schema/engagement";
import { toast } from "sonner";

type Phase = "idle" | "active" | "empty";

export function CallConsole({ workspaceId }: { workspaceId: string }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [lead, setLead] = useState<LeadRecord | null>(null);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [notes, setNotes] = useState("");
  const notesRef = useRef<HTMLTextAreaElement>(null);
  const leadRef = useRef<LeadRecord | null>(null);
  useEffect(() => {
    leadRef.current = lead;
  }, [lead]);

  const nextMutation = useNextLead(workspaceId);
  const saveMutation = useSaveAndNext(workspaceId);

  async function startOrSkip() {
    const result = await nextMutation.mutateAsync();
    if (!result.lead) {
      setPhase("empty");
      setLead(null);
      return;
    }
    setLead(result.lead);
    setTimeline(result.timeline ?? []);
    setNotes("");
    setPhase("active");
  }

  async function handleOutcome(outcome: CallOutcome) {
    if (!lead) return;
    try {
      const result = await saveMutation.mutateAsync({ leadId: lead.id, outcome, notes });
      toast.success(`Logged: ${outcome.replace(/_/g, " ")}`);
      if (!result.next) {
        setPhase("empty");
        setLead(null);
        return;
      }
      setLead(result.next);
      setTimeline(result.nextTimeline);
      setNotes("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save call");
    }
  }

  // Release the lock on unmount / tab close so the lead isn't stuck locked.
  useEffect(() => {
    function handleBeforeUnload() {
      if (leadRef.current) releaseLead(workspaceId, leadRef.current.id);
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      if (leadRef.current) releaseLead(workspaceId, leadRef.current.id);
    };
  }, [workspaceId]);

  // Keyboard shortcuts for outcome buttons — ignored while typing in notes.
  useEffect(() => {
    if (phase !== "active") return;
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const isTyping = target?.tagName === "TEXTAREA" || target?.tagName === "INPUT";
      if (isTyping) return;
      const match = OUTCOMES.find((o) => o.key === e.key);
      if (match) {
        e.preventDefault();
        handleOutcome(match.outcome);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, lead, notes]);

  if (phase === "idle") {
    return (
      <EmptyState
        icon={Phone}
        title="Ready to start calling"
        description="The server will lock and hand you the next unassigned lead in your queue."
        action={
          <Button onClick={startOrSkip} disabled={nextMutation.isPending}>
            {nextMutation.isPending ? "Loading..." : "Start Calling"}
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
        description="No unlocked leads are waiting right now. Check again in a bit."
        action={
          <Button onClick={startOrSkip} disabled={nextMutation.isPending}>
            Check again
          </Button>
        }
      />
    );
  }

  if (!lead) return null;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground">{lead.name}</h2>
              <p className="text-sm text-muted-foreground">{lead.phone}</p>
            </div>
            <StatusBadge status={lead.status} />
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <DetailRow label="College" value={lead.college} />
            <DetailRow label="City" value={lead.city} />
            <DetailRow label="Year" value={lead.year} />
            <DetailRow label="Source" value={lead.source} />
          </dl>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <label htmlFor="call-notes" className="text-sm font-medium text-foreground">
            Notes
          </label>
          <Textarea
            id="call-notes"
            ref={notesRef}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="What happened on this call?"
            rows={3}
            className="mt-2"
          />
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <p className="mb-3 text-sm font-medium text-foreground">
            Outcome <span className="font-normal text-muted-foreground">(or press 1–7)</span>
          </p>
          <OutcomeButtons onSelect={handleOutcome} disabled={saveMutation.isPending} />
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            releaseLead(workspaceId, lead.id);
            startOrSkip();
          }}
        >
          <SkipForward className="mr-1.5 h-4 w-4" /> Skip
        </Button>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-foreground">Previous activity</h3>
        <TimelineList entries={timeline} />
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-foreground">{value || "—"}</dd>
    </div>
  );
}
