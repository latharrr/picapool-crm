"use client";

import Papa from "papaparse";
import * as XLSX from "xlsx";
import { Download } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { leadToCsvRow, LEAD_CSV_COLUMNS } from "@/lib/leads/csv";
import type { LeadRecord } from "@/lib/sheets/schema/crm";

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ExportLeadsButton({ leads }: { leads: LeadRecord[] }) {
  function exportCsv() {
    const rows = leads.map(leadToCsvRow);
    const csv = Papa.unparse({ fields: [...LEAD_CSV_COLUMNS], data: rows });
    downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8" }), "leads.csv");
  }

  function exportXlsx() {
    const rows = leads.map(leadToCsvRow);
    const sheet = XLSX.utils.json_to_sheet(rows, { header: [...LEAD_CSV_COLUMNS] });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, "Leads");
    XLSX.writeFile(workbook, "leads.xlsx");
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={leads.length === 0}>
          <Download className="mr-1.5 h-4 w-4" /> Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={exportCsv}>Export as CSV</DropdownMenuItem>
        <DropdownMenuItem onSelect={exportXlsx}>Export as Excel</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
