# Deployment (Vercel)

## 1. Import the project

Push this repo to GitHub (already done if you're reading this from the
repo), then import it into Vercel: **Add New > Project**, select the repo.
Framework preset should auto-detect as Next.js.

## 2. Set environment variables

In Project Settings > Environment Variables, set everything from
[`.env.example`](../.env.example):

| Variable | Notes |
| --- | --- |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | See [`SERVICE_ACCOUNT.md`](SERVICE_ACCOUNT.md) |
| `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` | Keep the `\n` escapes literal |
| `ROOT_SPREADSHEET_ID` | From `npm run provision:root` (run locally, see below) |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | See [`KV_SETUP.md`](KV_SETUP.md) — required in production |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `AUTH_URL` | Your production domain, e.g. `https://crm.picapool.com` |
| `CRON_SECRET` | `openssl rand -hex 32` — Vercel sends this automatically as a Bearer token to `/api/cron/*` once set |

## 3. Bootstrap the root spreadsheet against production

Provisioning scripts run locally against whichever credentials are in
your shell's environment — they aren't meant to run inside a serverless
function. Point them at production:

```bash
vercel env pull .env.production.local
# temporarily point ROOT_SPREADSHEET_ID / FOUNDER_* env vars at production,
# or just run with --env-file if your Node version supports it
npm run provision:root
```

Copy the printed spreadsheet ID back into the `ROOT_SPREADSHEET_ID`
Vercel env var if you didn't already have one.

## 4. Deploy

Trigger a deploy (push to `main`, or `vercel --prod`). Vercel reads
[`vercel.json`](../vercel.json) and registers the two cron jobs
automatically:

- `/api/cron/refresh-cache` every 5 minutes
- `/api/cron/digest` every hour

Cron availability and minimum interval depend on your Vercel plan — check
the current [Vercel Cron Jobs docs](https://vercel.com/docs/cron-jobs) if
schedules need adjusting for your plan tier.

## 5. Verify

- Visit `/login` — it should show the sign-in form (not "Setup required")
  once all env vars above are set.
- Log in as the Founder user created in step 3.
- Check **Admin > System Health** — every row should be green.
- Create a workspace from **Admin > Workspaces**, or run
  `npm run seed -- "Demo Workspace"` locally (pointed at production env
  vars) for sample data.

## Rotating secrets

Rotating `AUTH_SECRET` invalidates every existing session (everyone gets
logged out) — expected, not a bug. Rotating the Google service account key
requires generating a new JSON key in Cloud Console and updating both env
vars; the old key can then be deleted from the service account.
