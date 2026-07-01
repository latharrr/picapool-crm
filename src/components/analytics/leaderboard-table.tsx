import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { Trophy } from "lucide-react";
import type { LeaderboardEntry } from "@/lib/analytics/aggregate";

export function LeaderboardTable({ entries }: { entries: LeaderboardEntry[] }) {
  if (entries.length === 0) {
    return <EmptyState icon={Trophy} title="No calls logged today yet" />;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10">#</TableHead>
          <TableHead>Caller</TableHead>
          <TableHead className="text-right">Calls</TableHead>
          <TableHead className="text-right">Connected</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map((entry, i) => (
          <TableRow key={entry.callerId}>
            <TableCell className="text-muted-foreground">{i + 1}</TableCell>
            <TableCell className="font-medium">{entry.callerName}</TableCell>
            <TableCell className="text-right">{entry.calls}</TableCell>
            <TableCell className="text-right">{entry.connected}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
