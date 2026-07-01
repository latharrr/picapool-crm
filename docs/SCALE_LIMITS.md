# Known scale limits

Google Sheets is the entire backend for this app. That's the whole point
(no Postgres/Supabase, one CRM UI instead of 30-40 scattered sheets), but
it means the app inherits Sheets' limits rather than a real database's.
This is a deliberate tradeoff, not an oversight — read this before
assuming the app will "just scale."

## What Sheets doesn't give you

- **No row-level locking.** Two concurrent writers to the same row can
  race. The calling module works around this specifically (KV lock before
  handing out a lead), but nothing else in the app has row-level
  concurrency protection beyond "resolve the row number fresh right
  before writing" (see `BaseRepository.update` in
  `src/lib/sheets/repository.ts`), which prevents writing to the *wrong*
  row but not a lost-update race on the *same* row from two simultaneous
  edits.
- **No joins or indexes.** Every cross-tab lookup (e.g. the analytics
  leaderboard joining `Call_History` against the root `Users` tab, or
  Messages showing lead names) is a full in-memory join after reading both
  tabs. Fine at the scale below; would need a real query engine beyond it.
- **API rate limits.** Roughly 300 read / 60 write requests per minute per
  Google Cloud project (shared across every workspace's spreadsheet,
  since they're all created by the same service account project). The app
  mitigates this two ways:
  - `src/lib/kv/cache.ts` — every read goes through a KV cache first
    (TTL 45s by default, longer for slow-changing tabs like `Settings`).
  - `src/lib/sheets/rateLimiter.ts` — every raw Sheets API call is wrapped
    in a concurrency-limited queue with exponential backoff + retry on
    429/5xx, so a burst doesn't just fail outright.

## Realistic ceiling

**Low tens of thousands of rows per tab** is where smooth UX ends — not
"hundreds of thousands." Past that:

- Full-tab reads (even cached) get slow to parse/filter in memory on every
  cache miss.
- The calling queue's candidate scan (`lib/calling.ts`) is a linear scan
  over all leads; fine at 20-30k, not fine at 500k.
- Client-side search/filter (Leads table, generic `DataTable`) is a
  straightforward array `.filter()` — fast up to tens of thousands of
  rows, not designed for more.

**If a workspace's Leads tab (or any tab) is expected to exceed ~20-30k
active rows, plan a real database migration.** The one deliberate
abstraction boundary for this is `BaseRepository<T>`
(`src/lib/sheets/repository.ts`) — every read/write in the app goes
through a repository instance, never raw `googleapis` calls. A future
Postgres (or similar) backend would only need a new repository
implementation with the same `list/getById/create/update/softDelete`
shape; no business logic, API routes, or UI would need to change.

## Deliberately deferred (documented, not built)

These came up during planning as reasonable additions but were left out
of this version to avoid scope creep beyond the "depth-first core" the
project prioritized. They're natural next steps, especially once real
WhatsApp/email providers are connected:

- **A formal background-job queue** for async import/export and bulk
  WhatsApp/email sends. Today, import is a single synchronous request
  (fine up to a few thousand rows, per the `rows.max(5000)` cap in
  `/api/leads/import`); there's no queue for retrying failed bulk sends.
- **OpenAPI/Swagger docs** for the API routes, which would make future
  n8n or other external integrations easier to wire up.
- **A dedicated metrics/error-monitoring pipeline** beyond the
  `Activity_Log` tab and console logging — no latency dashboards, no
  alerting.
