"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type { LeadRecord, LeadStatus } from "@/lib/sheets/schema/crm";

const STATUS_OPTIONS: LeadStatus[] = [
  "new",
  "queued",
  "connected",
  "interested",
  "callback",
  "busy",
  "wrong_number",
  "spam",
  "no_answer",
  "converted",
  "closed",
];

export function LeadQuickEdit({ lead, workspaceId }: { lead: LeadRecord; workspaceId: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<LeadStatus>(lead.status);
  const [notes, setNotes] = useState(lead.notes ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    const res = await fetch(`/api/leads/${lead.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspaceId, status, notes }),
    });
    setSaving(false);
    if (!res.ok) {
      toast.error("Failed to save changes");
      return;
    }
    toast.success("Lead updated");
    router.refresh();
  }

  const dirty = status !== lead.status || notes !== (lead.notes ?? "");

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="status">Status</Label>
        <Select value={status} onValueChange={(v) => setStatus(v as LeadStatus)}>
          <SelectTrigger id="status" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">
                {s.replace(/_/g, " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} />
      </div>
      <Button size="sm" onClick={handleSave} disabled={!dirty || saving}>
        {saving ? "Saving..." : "Save changes"}
      </Button>
    </div>
  );
}
