import type { ZodType } from "zod";

export interface ColumnDef<T> {
  key: keyof T;
  header: string;
  encode: (value: T[keyof T]) => string;
  decode: (raw: string) => T[keyof T];
}

export interface TabDefinition<T> {
  /** Sheet tab name, also used as the KV cache key segment. */
  name: string;
  columns: ColumnDef<T>[];
  schema: ZodType<T>;
  /**
   * Internal/system tab (audit trails, history logs, settings) that should
   * stay hidden in the raw Google Sheet so opening the spreadsheet directly
   * shows the tabs a human actually cares about (Leads, Contacts, Notes...).
   * The app itself reads/writes hidden tabs normally — this only affects
   * the Sheets UI.
   */
  hidden?: boolean;
}

export function defineTab<T>(def: TabDefinition<T>): TabDefinition<T> {
  return def;
}

// ── Column codecs ────────────────────────────────────────────────────────
// Sheets cells are always plain strings on the wire (we write with RAW
// input), so every field needs an explicit string <-> value conversion.

export const codec = {
  string:
    <T>(key: keyof T) =>
    (): ColumnDef<T> => ({
      key,
      header: String(key),
      encode: (v) => (v == null ? "" : String(v)),
      decode: (raw) => raw as T[keyof T],
    }),

  optionalString:
    <T>(key: keyof T) =>
    (): ColumnDef<T> => ({
      key,
      header: String(key),
      encode: (v) => (v == null ? "" : String(v)),
      decode: (raw) => (raw === "" ? (undefined as T[keyof T]) : (raw as T[keyof T])),
    }),

  boolean:
    <T>(key: keyof T) =>
    (): ColumnDef<T> => ({
      key,
      header: String(key),
      encode: (v) => (v ? "true" : "false"),
      decode: (raw) => (raw.toLowerCase() === "true" || raw === "1") as T[keyof T],
    }),

  number:
    <T>(key: keyof T) =>
    (): ColumnDef<T> => ({
      key,
      header: String(key),
      encode: (v) => (v == null ? "" : String(v)),
      decode: (raw) => (raw === "" ? (undefined as T[keyof T]) : (Number(raw) as T[keyof T])),
    }),

  /** Comma-separated list, e.g. tags or admin emails. */
  stringArray:
    <T>(key: keyof T) =>
    (): ColumnDef<T> => ({
      key,
      header: String(key),
      encode: (v) => (Array.isArray(v) ? v.join(",") : ""),
      decode: (raw) =>
        (raw === ""
          ? []
          : raw
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)) as T[keyof T],
    }),

  /** Arbitrary JSON blob, e.g. Activity_Log diffs. */
  json:
    <T>(key: keyof T) =>
    (): ColumnDef<T> => ({
      key,
      header: String(key),
      encode: (v) => (v == null ? "" : JSON.stringify(v)),
      decode: (raw) => {
        if (!raw) return null as T[keyof T];
        try {
          return JSON.parse(raw) as T[keyof T];
        } catch {
          return null as T[keyof T];
        }
      },
    }),
};

/** Standard audit columns every tab includes, appended after tab-specific fields. */
export function baseColumns<T extends BaseRecord>(): ColumnDef<T>[] {
  return [
    codec.string<T>("created_at")(),
    codec.string<T>("updated_at")(),
    codec.string<T>("created_by")(),
    codec.string<T>("updated_by")(),
    codec.boolean<T>("is_deleted")(),
  ];
}

export interface BaseRecord {
  id: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
  is_deleted: boolean;
}
