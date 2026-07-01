"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils";

export interface DataTableColumn<T> {
  header: string;
  render: (item: T) => React.ReactNode;
  className?: string;
}

export function DataTable<T extends { id: string }>({
  items,
  columns,
  onRowClick,
  searchFn,
  searchPlaceholder = "Search...",
  emptyIcon,
  emptyTitle,
  emptyDescription,
}: {
  items: T[];
  columns: DataTableColumn<T>[];
  onRowClick?: (item: T) => void;
  searchFn?: (item: T, query: string) => boolean;
  searchPlaceholder?: string;
  emptyIcon: LucideIcon;
  emptyTitle: string;
  emptyDescription?: string;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || !searchFn) return items;
    return items.filter((item) => searchFn(item, q));
  }, [items, query, searchFn]);

  if (items.length === 0) {
    return <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="space-y-4">
      {searchFn && (
        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="pl-9"
          />
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState icon={emptyIcon} title="No results match your search" />
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-xl border border-border bg-card md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((col) => (
                    <TableHead key={col.header}>{col.header}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((item) => (
                  <TableRow
                    key={item.id}
                    className={cn(onRowClick && "cursor-pointer")}
                    onClick={() => onRowClick?.(item)}
                  >
                    {columns.map((col) => (
                      <TableCell key={col.header} className={col.className}>
                        {col.render(item)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="grid gap-3 md:hidden">
            {filtered.map((item) => (
              <button
                key={item.id}
                onClick={() => onRowClick?.(item)}
                disabled={!onRowClick}
                className="rounded-xl border border-border bg-card p-4 text-left disabled:cursor-default"
              >
                <p className="text-sm font-semibold text-foreground">{columns[0]?.render(item)}</p>
                <dl className="mt-2 space-y-1">
                  {columns.slice(1).map((col) => (
                    <div key={col.header} className="flex justify-between gap-2 text-xs">
                      <dt className="text-muted-foreground">{col.header}</dt>
                      <dd>{col.render(item)}</dd>
                    </div>
                  ))}
                </dl>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
