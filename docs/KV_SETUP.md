# KV setup (Upstash Redis / "Vercel KV")

The app uses a small `KVClient` interface (`src/lib/kv/client.ts`) for two
things:

1. **Cache-aside reads** — every Sheets tab read goes through a KV cache
   with a TTL (default 45s), so normal page loads and the calling module
   don't hit the Sheets API's ~300 read/min quota directly.
2. **Lead locking** — the calling module uses `setNX` with a TTL to make
   sure two interns never get handed the same lead at once.

"Vercel KV" as a standalone product has been folded into Vercel's
Marketplace Database integrations, which for Redis-compatible storage
means **Upstash Redis** today. That's what this app is built against.

## Option A — Vercel Marketplace (recommended for production)

1. In your Vercel project, go to **Storage > Create Database > Upstash for
   Redis** (or add it via the Marketplace tab).
2. Vercel automatically injects the connection env vars into your project.
   Confirm they're named `UPSTASH_REDIS_REST_URL` and
   `UPSTASH_REDIS_REST_TOKEN` (rename in Project Settings if Vercel used
   different names — the app reads exactly those two).

## Option B — Upstash directly

1. Create a free database at [upstash.com](https://upstash.com/).
2. Copy the **REST URL** and **REST TOKEN** from the database's dashboard
   into `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`.

## Local development without KV

If both env vars are unset, `getKV()` automatically falls back to an
in-memory `Map` and logs a warning. This is fine for poking around
locally, but has two hard limits:

- It's **single-process** — restarting `next dev` clears it, and it
  wouldn't be shared across multiple serverless function instances.
- It makes the **lead lock a no-op guarantee** across instances — fine
  with one local dev server, unsafe the moment there's more than one
  runtime instance (which is the normal case on Vercel).

**Set up real Upstash credentials before deploying to production.** The
in-memory fallback existing at all is purely so the app is inspectable
with zero external services configured, per the project's env-contract
design — it is explicitly not meant to run in that mode in production.
