"use client";

import { useEffect, useRef, useState } from "react";
import { Phone, PhoneOff, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/leads/status-badge";
import { TimelineList } from "@/components/leads/timeline-list";
import { EmptyState } from "@/components/shared/empty-state";
import { OutcomeButtons, OUTCOMES, PG_OUTCOMES } from "./outcome-buttons";
import { PhoneTapAction } from "./phone-tap-action";
import { ChipSelect, type ChipOption } from "./chip-select";
import { useNextLead, useSaveAndNext, releaseLead } from "@/hooks/useCalling";
import type { LeadRecord } from "@/lib/sheets/schema/crm";
import type { TimelineEntry } from "@/lib/leads/timeline";
import type { CallOutcome } from "@/lib/sheets/schema/engagement";
import { toast } from "sonner";

type Phase = "idle" | "active" | "empty";

const GENDER_OPTIONS: ChipOption<NonNullable<LeadRecord["gender"]>>[] = [
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
  { value: "Unisex", label: "Unisex" },
];
const STAGE_OPTIONS: ChipOption<NonNullable<LeadRecord["pg_stage"]>>[] = [
  { value: "Lead", label: "Lead" },
  { value: "Site Visit", label: "Site Visit" },
  { value: "Negotiation", label: "Negotiation" },
  { value: "Closed", label: "Closed" },
];
const FOLLOW_UP_OPTIONS: ChipOption<NonNullable<LeadRecord["follow_up_status"]>>[] = [
  { value: "Yes", label: "Yes" },
  { value: "No", label: "No" },
  { value: "Done", label: "Done" },
];
const PRIORITY_OPTIONS: ChipOption<LeadRecord["priority"]>[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

export function CallConsole({ workspaceId }: { workspaceId: string }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [lead, setLead] = useState<LeadRecord | null>(null);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [notes, setNotes] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [beds, setBeds] = useState("");
  const [gender, setGender] = useState<LeadRecord["gender"]>();
  const [stage, setStage] = useState<LeadRecord["pg_stage"]>();
  const [followUp, setFollowUp] = useState<LeadRecord["follow_up_status"]>();
  const [priority, setPriority] = useState<LeadRecord["priority"]>("medium");
  const notesRef = useRef<HTMLTextAreaElement>(null);
  const leadRef = useRef<LeadRecord | null>(null);
  useEffect(() => {
    leadRef.current = lead;
  }, [lead]);

  const nextMutation = useNextLead(workspaceId);
  const saveMutation = useSaveAndNext(workspaceId);
  const isPg = lead?.lead_type === "pg";

  function resetFieldsFor(next: LeadRecord) {
    setNotes("");
    setOwnerName(next.owner_name ?? "");
    setBeds(next.beds != null ? String(next.beds) : "");
    setGender(next.gender);
    setStage(next.pg_stage);
    setFollowUp(next.follow_up_status);
    setPriority(next.priority ?? "medium");
  }

  async function startOrSkip() {
    const result = await nextMutation.mutateAsync();
    if (!result.lead) {
      setPhase("empty");
      setLead(null);
      return;
    }
    setLead(result.lead);
    setTimeline(result.timeline ?? []);
    resetFieldsFor(result.lead);
    setPhase("active");
  }

  async function handleOutcome(outcome: CallOutcome) {
    if (!lead) return;
    try {
      const result = await saveMutation.mutateAsync({
        leadId: lead.id,
        outcome,
        notes,
        ...(isPg
          ? {
              ownerName: ownerName || undefined,
              beds: beds !== "" ? Number(beds) : undefined,
              gender,
              pgStage: stage,
              followUp,
              priority,
            }
          : {}),
      });
      toast.success(`Logged: ${outcome.replace(/_/g, " ")}`);
      if (!result.next) {
        setPhase("empty");
        setLead(null);
        return;
      }
      setLead(result.next);
      setTimeline(result.nextTimeline);
      resetFieldsFor(result.next);
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
      const match = (isPg ? PG_OUTCOMES : OUTCOMES).find((o) => o.key === e.key);
      if (match) {
        e.preventDefault();
        handleOutcome(match.outcome);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, lead, notes, ownerName, beds, gender, stage, followUp, priority]);

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
              {isPg ? (
                <PhoneTapAction phone={lead.phone} />
              ) : (
                <p className="text-sm text-muted-foreground">{lead.phone}</p>
              )}
            </div>
            <StatusBadge status={lead.status} />
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {isPg ? (
              <>
                <DetailRow label="Source" value={lead.source} />
                <DetailRow label="Location" value={lead.city} />
              </>
            ) : (
              <>
                <DetailRow label="College" value={lead.college} />
                <DetailRow label="City" value={lead.city} />
                <DetailRow label="Year" value={lead.year} />
                <DetailRow label="Source" value={lead.source} />
              </>
            )}
          </dl>

          {isPg && (
            <div className="mt-4 space-y-4 border-t border-border pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="owner-name">Owner name</Label>
                  <Input
                    id="owner-name"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="Add owner name"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="beds">Beds</Label>
                  <Input
                    id="beds"
                    type="number"
                    min={0}
                    value={beds}
                    onChange={(e) => setBeds(e.target.value)}
                    placeholder="Add beds"
                  />
                </div>
              </div>
              <ChipSelect label="Gender" options={GENDER_OPTIONS} value={gender} onChange={setGender} />
            </div>
          )}
        </div>

        {isPg && (
          <div className="grid gap-4 rounded-xl border border-border bg-card p-5 sm:grid-cols-3">
            <ChipSelect label="Stage" options={STAGE_OPTIONS} value={stage} onChange={setStage} />
            <ChipSelect label="Priority" options={PRIORITY_OPTIONS} value={priority} onChange={setPriority} />
            <ChipSelect
              label="Follow Up Call"
              options={FOLLOW_UP_OPTIONS}
              value={followUp}
              onChange={setFollowUp}
            />
          </div>
        )}

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
            {isPg ? "Call Status" : "Outcome"}{" "}
            <span className="font-normal text-muted-foreground">
              (or press 1–{isPg ? PG_OUTCOMES.length : OUTCOMES.length})
            </span>
          </p>
          <OutcomeButtons
            outcomes={isPg ? PG_OUTCOMES : OUTCOMES}
            onSelect={handleOutcome}
            disabled={saveMutation.isPending}
          />
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
