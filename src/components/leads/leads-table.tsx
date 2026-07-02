"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Users, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "./status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { toast } from "sonner";
import type { LeadRecord } from "@/lib/sheets/schema/crm";

const UNASSIGNED_FILTER = "__unassigned__";
const ALL_FILTER = "__all__";

export function LeadsTable({
  leads,
  memberNames = {},
  workspaceId,
  canManageAssignments = false,
}: {
  leads: LeadRecord[];
  memberNames?: Record<string, string>;
  workspaceId?: string;
  canManageAssignments?: boolean;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState(ALL_FILTER);
  const [unassigning, setUnassigning] = useState<string | null>(null);

  function assigneeName(lead: LeadRecord): string | null {
    return lead.owner_id ? (memberNames[lead.owner_id] ?? "Unknown user") : null;
  }

  const assignees = useMemo(
    () => Object.entries(memberNames).sort((a, b) => a[1].localeCompare(b[1])),
    [memberNames]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return leads.filter((lead) => {
      if (assigneeFilter === UNASSIGNED_FILTER && lead.owner_id) return false;
      if (
        assigneeFilter !== ALL_FILTER &&
        assigneeFilter !== UNASSIGNED_FILTER &&
        lead.owner_id !== assigneeFilter
      )
        return false;
      if (!q) return true;
      return [lead.name, lead.phone, lead.email, lead.college, lead.city]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(q));
    });
  }, [leads, query, assigneeFilter]);

  async function handleUnassign(e: React.MouseEvent, leadId: string) {
    e.stopPropagation();
    if (!workspaceId) return;
    setUnassigning(leadId);
    const res = await fetch(`/api/leads/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspaceId, owner_id: "" }),
    });
    setUnassigning(null);
    if (!res.ok) {
      toast.error("Failed to unassign lead");
      return;
    }
    toast.success("Lead unassigned");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, phone, email, college..."
            className="pl-9"
          />
        </div>
        {assignees.length > 0 && (
          <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
            <SelectTrigger className="w-full sm:w-56">
              <SelectValue placeholder="Assigned to" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_FILTER}>Everyone</SelectItem>
              <SelectItem value={UNASSIGNED_FILTER}>Unassigned</SelectItem>
              {assignees.map(([userId, name]) => (
                <SelectItem key={userId} value={userId}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Users} title="No leads match your filters" />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-x-auto rounded-xl border border-border bg-card md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>College / City</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Assigned to</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((lead) => (
                  <TableRow
                    key={lead.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/leads/${lead.id}`)}
                  >
                    <TableCell className="font-medium">{lead.name}</TableCell>
                    <TableCell className="text-muted-foreground">{lead.phone}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {[lead.college, lead.city].filter(Boolean).join(" · ") || "—"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={lead.status} />
                    </TableCell>
                    <TableCell className="capitalize text-muted-foreground">{lead.priority}</TableCell>
                    <TableCell className="text-muted-foreground">{lead.source || "—"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {assigneeName(lead) ? (
                          <Badge variant="outline">{assigneeName(lead)}</Badge>
                        ) : (
                          <span className="text-muted-foreground">Unassigned</span>
                        )}
                        {canManageAssignments && lead.owner_id && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            disabled={unassigning === lead.id}
                            onClick={(e) => handleUnassign(e, lead.id)}
                            aria-label="Unassign"
                            title="Unassign"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile cards */}
          <div className="grid gap-3 md:hidden">
            {filtered.map((lead) => (
              <div
                key={lead.id}
                role="button"
                tabIndex={0}
                onClick={() => router.push(`/leads/${lead.id}`)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") router.push(`/leads/${lead.id}`);
                }}
                className="rounded-xl border border-border bg-card p-4 text-left"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{lead.name}</p>
                    <p className="text-xs text-muted-foreground">{lead.phone}</p>
                  </div>
                  <StatusBadge status={lead.status} />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {[lead.college, lead.city].filter(Boolean).join(" · ") || "No college/city on file"}
                </p>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span>{assigneeName(lead) ? `Assigned to ${assigneeName(lead)}` : "Unassigned"}</span>
                  {canManageAssignments && lead.owner_id && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      disabled={unassigning === lead.id}
                      onClick={(e) => handleUnassign(e, lead.id)}
                      aria-label="Unassign"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
