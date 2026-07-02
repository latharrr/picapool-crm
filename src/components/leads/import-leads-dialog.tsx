"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { Upload, ArrowLeft } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import {
  applyColumnMapping,
  guessColumnMapping,
  LEAD_TARGET_FIELD_LABELS,
  LEAD_TARGET_FIELDS,
  type LeadTargetField,
} from "@/lib/leads/csv";

interface ImportResult {
  created: number;
  updated: number;
  errors: { row: number; message: string }[];
}

type Step = "upload" | "map" | "preview" | "result";

const NONE_VALUE = "__none__";

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
  const [step, setStep] = useState<Step>("upload");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<Record<string, LeadTargetField | null>>({});

  function reset() {
    setStep("upload");
    setError(null);
    setResult(null);
    setHeaders([]);
    setRawRows([]);
    setMapping({});
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setLoading(true);
    try {
      const parsed = file.name.endsWith(".xlsx") ? await parseXlsx(file) : await parseCsv(file);
      if (parsed.length === 0) {
        setError("That file doesn't have any rows.");
        return;
      }
      const detectedHeaders = Object.keys(parsed[0]);
      setHeaders(detectedHeaders);
      setRawRows(parsed);
      setMapping(guessColumnMapping(detectedHeaders));
      setStep("map");
    } catch {
      setError("Couldn't read that file. Check it's a valid CSV or Excel export.");
    } finally {
      setLoading(false);
    }
  }

  const mappedRows = useMemo(() => applyColumnMapping(rawRows, mapping), [rawRows, mapping]);
  const validRows = useMemo(() => mappedRows.filter((r) => r.name && r.phone), [mappedRows]);
  const skippedCount = mappedRows.length - validRows.length;
  const nameMapped = Object.values(mapping).includes("name");
  const phoneMapped = Object.values(mapping).includes("phone");

  async function handleConfirmImport() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/leads/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, rows: validRows }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(typeof data.error === "string" ? data.error : "Import failed");
        return;
      }

      const data: ImportResult = await res.json();
      setResult(data);
      setStep("result");
      toast.success(`Imported: ${data.created} created, ${data.updated} updated`);
      router.refresh();
    } catch {
      setError("Import failed. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="mr-1.5 h-4 w-4" /> Import
        </Button>
      </DialogTrigger>
      <DialogContent className={step === "map" || step === "preview" ? "sm:max-w-lg" : undefined}>
        <DialogHeader>
          <DialogTitle>Import leads</DialogTitle>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="file">CSV or Excel file</Label>
              <Input id="file" name="file" type="file" accept=".csv,.xlsx" onChange={handleFileSelected} />
              <p className="text-xs text-muted-foreground">
                Any spreadsheet works — you&apos;ll match its columns to Name, Phone, etc. on the next
                step. Existing leads are matched by phone or email and updated instead of duplicated.
              </p>
            </div>
            {error && <p className="text-sm text-danger">{error}</p>}
            {loading && <p className="text-sm text-muted-foreground">Reading file...</p>}
          </div>
        )}

        {step === "map" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Match each column from your file to a lead field. Columns left as &quot;Don&apos;t
              import&quot; are ignored.
            </p>
            <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
              {headers.map((header) => (
                <div key={header} className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{header}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      e.g. {rawRows[0]?.[header] || "—"}
                    </p>
                  </div>
                  <Select
                    value={mapping[header] ?? NONE_VALUE}
                    onValueChange={(value) =>
                      setMapping((prev) => ({
                        ...prev,
                        [header]: value === NONE_VALUE ? null : (value as LeadTargetField),
                      }))
                    }
                  >
                    <SelectTrigger size="sm" className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE_VALUE}>Don&apos;t import</SelectItem>
                      {LEAD_TARGET_FIELDS.map((field) => (
                        <SelectItem key={field} value={field}>
                          {LEAD_TARGET_FIELD_LABELS[field]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
            {(!nameMapped || !phoneMapped) && (
              <p className="text-sm text-danger">Map a column to both Name and Phone to continue.</p>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setStep("upload")}>
                <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
              </Button>
              <Button disabled={!nameMapped || !phoneMapped} onClick={() => setStep("preview")}>
                Preview
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-4">
            <p className="text-sm text-foreground">
              {validRows.length} lead{validRows.length === 1 ? "" : "s"} ready to import
              {skippedCount > 0 ? `, ${skippedCount} skipped (missing name or phone)` : ""}.
            </p>
            <div className="max-h-64 overflow-y-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {validRows.slice(0, 8).map((row, i) => (
                    <TableRow key={i}>
                      <TableCell>{row.name}</TableCell>
                      <TableCell>{row.phone}</TableCell>
                      <TableCell>{row.email || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {validRows.length > 8 && (
              <p className="text-xs text-muted-foreground">
                +{validRows.length - 8} more row{validRows.length - 8 === 1 ? "" : "s"}.
              </p>
            )}
            {error && <p className="text-sm text-danger">{error}</p>}
            <DialogFooter>
              <Button variant="outline" onClick={() => setStep("map")} disabled={loading}>
                <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
              </Button>
              <Button onClick={handleConfirmImport} disabled={loading || validRows.length === 0}>
                {loading ? "Importing..." : `Import ${validRows.length}`}
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === "result" && result && (
          <div className="space-y-4">
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
            <DialogFooter>
              <Button variant="outline" onClick={reset}>
                Import another
              </Button>
              <Button onClick={() => setOpen(false)}>Done</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
