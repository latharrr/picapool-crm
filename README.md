# Picapool CRM

Internal operations platform for calling, housing, messaging, campaigns, and
analytics — built on Next.js, with **Google Sheets as the only database** and
**Vercel as the only runtime**. No Postgres, no Supabase, no external DB.

## Known tradeoff

Google Sheets is not a transactional database: no row-level locking, no
indexes, no joins, and API rate limits around 300 reads / 60 writes per
minute per project. This app works around that with a KV cache/lock layer
(see `docs/SCALE_LIMITS.md`), but the realistic ceiling for smooth UX is low
tens of thousands of rows per tab, not hundreds of thousands. If lead volume
for a workspace is expected to exceed ~20-30k active rows, plan a real
database migration — the repository pattern in `src/lib/sheets/` is the only
place that would need to change.

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS · shadcn/ui ·
`googleapis` (Sheets API v4, service account) · NextAuth (Auth.js v5,
Credentials provider) · Upstash Redis (KV cache + locking, what "Vercel KV"
provisions today) · TanStack Query · React Hook Form + Zod · Recharts.

## Getting started

```bash
npm install
cp .env.example .env.local
npm run dev
```

With no credentials configured, the app boots and every data screen shows a
"Setup required" state instead of crashing. See `docs/SETUP.md` for the full
walkthrough (Google service account, root spreadsheet provisioning, Upstash
KV, NextAuth secret).

## Project structure

- `src/app/` — routes: `login`, `(dashboard)/*` (all modules + `admin/*`), `api/*`.
- `src/lib/sheets/` — the only code allowed to call `googleapis`. Repository
  pattern: `BaseRepository<T>` + one thin subclass per tab.
- `src/lib/kv/` — cache-aside reads and lead-locking, backed by Upstash Redis
  with an in-memory fallback for local dev.
- `src/lib/auth/` — NextAuth config + the RBAC permission matrix.
- `src/components/` — `ui/` (shadcn primitives), `layout/`, and feature folders.
- `scripts/` — one-time provisioning (`provision-root`, `provision-workspace`)
  and the demo `seed` script.
- `docs/` — setup, service account config, KV setup, scale limits, deployment.

## Documentation

- [`docs/SETUP.md`](docs/SETUP.md) — local dev setup
- [`docs/SERVICE_ACCOUNT.md`](docs/SERVICE_ACCOUNT.md) — Google Cloud service account
- [`docs/KV_SETUP.md`](docs/KV_SETUP.md) — Upstash Redis / Vercel KV
- [`docs/SCALE_LIMITS.md`](docs/SCALE_LIMITS.md) — rate limits and known ceilings
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — Vercel deployment
