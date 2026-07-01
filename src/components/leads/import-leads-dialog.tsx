"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
import { csvRowToLeadInput, LEAD_CSV_COLUMNS } from "@/lib/leads/csv";

interface ImportResult {
  created: number;
  updated: number;
  errors: { row: number; message: string }[];
}

function parseCsv(file: File): Promise<Record<string, string>[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => resolve(results.data),
      error: reject,
    });
  });
}

async function parseXlsx(file: File): Promise<Record<string, string>[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: "" });
}

export function ImportLeadsDialog({ workspaceId }: { workspaceId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const file = formData.get("file") as File | null;
    if (!file || file.size === 0) {
      setError("Choose a CSV or Excel file");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const rawRows = file.name.endsWith(".xlsx") ? await parseXlsx(file) : await parseCsv(file);
      const rows = rawRows
        .map(csvRowToLeadInput)
        .filter((r) => r.name && r.phone);

      if (rows.length === 0) {
        setError("No valid rows found — make sure the file has name and phone columns.");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/leads/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, rows }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(typeof data.error === "string" ? data.error : "Import failed");
        setLoading(false);
        return;
      }

      const data: ImportResult = await res.json();
      setResult(data);
      toast.success(`Imported: ${data.created} created, ${data.updated} updated`);
      router.refresh();
    } catch {
      setError("Couldn't parse that file. Check it's a valid CSV or Excel export.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setResult(null);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="mr-1.5 h-4 w-4" /> Import
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import leads</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="file">CSV or Excel file</Label>
            <Input id="file" name="file" type="file" accept=".csv,.xlsx" required />
            <p className="text-xs text-muted-foreground">
              Columns: {LEAD_CSV_COLUMNS.join(", ")}. Existing leads are matched by phone or email
              and updated instead of duplicated.
            </p>
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          {result && (
            <div className="rounded-lg border border-border bg-secondary/50 p-3 text-sm">
              <p>
                {result.created} created, {result.updated} updated
                {result.errors.length > 0 ? `, ${result.errors.length} skipped` : ""}.
              </p>
              {result.errors.length > 0 && (
                <ul className="mt-2 max-h-32 space-y-1 overflow-y-auto text-xs text-muted-foreground">
                  {result.errors.slice(0, 20).map((e, i) => (
                    <li key={i}>
                      Row {e.row}: {e.message}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Importing..." : "Import"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
