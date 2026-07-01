"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "./status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import type { LeadRecord } from "@/lib/sheets/schema/crm";

export function LeadsTable({ leads }: { leads: LeadRecord[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return leads;
    return leads.filter((lead) =>
      [lead.name, lead.phone, lead.email, lead.college, lead.city]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(q))
    );
  }, [leads, query]);

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, phone, email, college..."
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Users} title="No leads match your search" />
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile cards */}
          <div className="grid gap-3 md:hidden">
            {filtered.map((lead) => (
              <button
                key={lead.id}
                onClick={() => router.push(`/leads/${lead.id}`)}
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
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
