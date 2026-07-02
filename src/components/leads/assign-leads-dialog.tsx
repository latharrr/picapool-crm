"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export interface AssignableMember {
  userId: string;
  name: string;
  role: string;
}

export function AssignLeadsDialog({
  workspaceId,
  members,
  unassignedCount,
}: {
  workspaceId: string;
  members: AssignableMember[];
  unassignedCount: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [counts, setCounts] = useState<Record<string, string>>({});

  const allocations = useMemo(
    () =>
      members
        .map((m) => ({ userId: m.userId, count: Number.parseInt(counts[m.userId] ?? "", 10) }))
        .filter((a) => Number.isFinite(a.count) && a.count > 0),
    [members, counts]
  );
  const totalRequested = allocations.reduce((sum, a) => sum + a.count, 0);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (allocations.length === 0) {
      setError("Enter a call count for at least one person.");
      return;
    }

    setLoading(true);
    setError(null);

    const res = await fetch("/api/leads/assign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspaceId, allocations }),
    });

    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(typeof data.error === "string" ? data.error : "Failed to assign leads");
      return;
    }

    const data: { assigned: { userId: string; count: number }[]; unassignedRemaining: number } =
      await res.json();
    const totalAssigned = data.assigned.reduce((sum, a) => sum + a.count, 0);
    toast.success(
      totalAssigned < totalRequested
        ? `Assigned ${totalAssigned} of ${totalRequested} requested — ran out of unassigned leads.`
        : `Assigned ${totalAssigned} leads.`
    );
    setOpen(false);
    setCounts({});
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserPlus className="mr-1.5 h-4 w-4" /> Assign
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign leads to call</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {unassignedCount} unassigned lead{unassignedCount === 1 ? "" : "s"} available. Enter how
            many each person gets — the oldest unassigned leads go first, in the order below.
          </p>
          {members.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No other workspace members yet — add teammates from Admin → Users first.
            </p>
          ) : (
            <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
              {members.map((member) => (
                <div key={member.userId} className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{member.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{member.role}</p>
                  </div>
                  <Input
                    type="number"
                    min={0}
                    inputMode="numeric"
                    placeholder="0"
                    className="w-20"
                    value={counts[member.userId] ?? ""}
                    onChange={(e) =>
                      setCounts((prev) => ({ ...prev, [member.userId]: e.target.value }))
                    }
                  />
                </div>
              ))}
            </div>
          )}
          {totalRequested > unassignedCount && (
            <p className="text-sm text-danger">
              You&apos;re requesting {totalRequested} but only {unassignedCount} are available —
              the last person(s) in the list will get fewer than asked.
            </p>
          )}
          {error && <p className="text-sm text-danger">{error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={loading || allocations.length === 0}>
              {loading ? "Assigning..." : `Assign ${totalRequested || ""} leads`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
