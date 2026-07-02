import { getSheetsClient, columnLetter } from "./client";
import { withRetry } from "./rateLimiter";
import { getCachedTab, invalidateTab, invalidateDashboardStats, markTabRefreshed } from "@/lib/kv/cache";
import { RecordNotFoundError } from "./errors";
import type { BaseRecord, TabDefinition } from "./tab";

export interface ListOptions {
  includeDeleted?: boolean;
}

export type CreateInput<T extends BaseRecord> = Omit<
  T,
  "id" | "created_at" | "updated_at" | "updated_by" | "is_deleted"
> & { created_by: string };

/**
 * Generic Sheets-backed repository shared by every tab. This is the only
 * abstraction boundary that would need a new implementation if the backend
 * ever moved off Google Sheets (e.g. to Postgres) — no business logic above
 * this layer depends on how rows are stored.
 */
export class BaseRepository<T extends BaseRecord> {
  constructor(private readonly tab: TabDefinition<T>) {}

  private rowToRecord(row: string[]): T {
    const obj = {} as Record<keyof T, unknown>;
    for (const col of this.tab.columns) {
      obj[col.key] = col.decode(row[this.columnIndex(col.key)] ?? "");
    }
    return this.tab.schema.parse(obj);
  }

  private recordToRow(record: T): string[] {
    return this.tab.columns.map((col) => col.encode(record[col.key]));
  }

  private columnIndex(key: keyof T): number {
    return this.tab.columns.findIndex((c) => c.key === key);
  }

  private lastColumnLetter(): string {
    return columnLetter(this.tab.columns.length);
  }

  private async fetchAllRows(spreadsheetId: string): Promise<string[][]> {
    const sheets = getSheetsClient();
    const range = `${this.tab.name}!A2:${this.lastColumnLetter()}`;
    const res = await withRetry(() =>
      sheets.spreadsheets.values.get({ spreadsheetId, range })
    );
    await markTabRefreshed(spreadsheetId, this.tab.name);
    return res.data.values ?? [];
  }

  async list(spreadsheetId: string, opts: ListOptions = {}): Promise<T[]> {
    const rows = await getCachedTab(spreadsheetId, this.tab.name, () =>
      this.fetchAllRows(spreadsheetId)
    );
    const records = rows.filter((r) => r.length > 0).map((r) => this.rowToRecord(r));
    return opts.includeDeleted ? records : records.filter((r) => !r.is_deleted);
  }

  async getById(spreadsheetId: string, id: string): Promise<T | null> {
    const all = await this.list(spreadsheetId, { includeDeleted: true });
    return all.find((r) => r.id === id) ?? null;
  }

  async create(spreadsheetId: string, input: CreateInput<T>): Promise<T> {
    const now = new Date().toISOString();
    const record = this.tab.schema.parse({
      ...input,
      id: crypto.randomUUID(),
      created_at: now,
      updated_at: now,
      updated_by: input.created_by,
      is_deleted: false,
    });

    const sheets = getSheetsClient();
    await withRetry(() =>
      sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${this.tab.name}!A:A`,
        valueInputOption: "RAW",
        insertDataOption: "INSERT_ROWS",
        requestBody: { values: [this.recordToRow(record)] },
      })
    );
    await Promise.all([invalidateTab(spreadsheetId, this.tab.name), invalidateDashboardStats(spreadsheetId)]);
    return record;
  }

  async batchCreate(spreadsheetId: string, inputs: CreateInput<T>[]): Promise<T[]> {
    if (inputs.length === 0) return [];
    const now = new Date().toISOString();
    const records = inputs.map((input) =>
      this.tab.schema.parse({
        ...input,
        id: crypto.randomUUID(),
        created_at: now,
        updated_at: now,
        updated_by: input.created_by,
        is_deleted: false,
      })
    );

    const sheets = getSheetsClient();
    await withRetry(() =>
      sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${this.tab.name}!A:A`,
        valueInputOption: "RAW",
        insertDataOption: "INSERT_ROWS",
        requestBody: { values: records.map((r) => this.recordToRow(r)) },
      })
    );
    await Promise.all([invalidateTab(spreadsheetId, this.tab.name), invalidateDashboardStats(spreadsheetId)]);
    return records;
  }

  /**
   * Row numbers shift whenever rows are inserted/sorted, so writes always
   * resolve the current row number fresh (a single-column read) instead of
   * trusting a cached id -> row index.
   */
  private async findRowNumber(spreadsheetId: string, id: string): Promise<number | null> {
    const sheets = getSheetsClient();
    const res = await withRetry(() =>
      sheets.spreadsheets.values.get({ spreadsheetId, range: `${this.tab.name}!A2:A` })
    );
    const values = res.data.values ?? [];
    const index = values.findIndex((row) => row[0] === id);
    return index === -1 ? null : index + 2; // +1 header row, +1 for 1-based indexing
  }

  async update(spreadsheetId: string, id: string, patch: Partial<T>, updatedBy: string): Promise<T> {
    const [rowNumber, existing] = await Promise.all([
      this.findRowNumber(spreadsheetId, id),
      this.getById(spreadsheetId, id),
    ]);
    if (rowNumber === null || existing === null) {
      throw new RecordNotFoundError(this.tab.name, id);
    }

    const updated = this.tab.schema.parse({
      ...existing,
      ...patch,
      id,
      updated_at: new Date().toISOString(),
      updated_by: updatedBy,
    });

    const sheets = getSheetsClient();
    await withRetry(() =>
      sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${this.tab.name}!A${rowNumber}:${this.lastColumnLetter()}${rowNumber}`,
        valueInputOption: "RAW",
        requestBody: { values: [this.recordToRow(updated)] },
      })
    );
    await Promise.all([invalidateTab(spreadsheetId, this.tab.name), invalidateDashboardStats(spreadsheetId)]);
    return updated;
  }

  async softDelete(spreadsheetId: string, id: string, updatedBy: string): Promise<void> {
    await this.update(spreadsheetId, id, { is_deleted: true } as Partial<T>, updatedBy);
  }
}
