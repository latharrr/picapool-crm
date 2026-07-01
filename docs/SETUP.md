# Setup

## 1. Local install

```bash
npm install
cp .env.example .env.local
npm run dev
```

With no credentials configured, the app boots fine — every data screen
shows a "Setup required" state instead of crashing, and `/login` explains
exactly which env vars are missing. This is intentional so you can review
the UI before touching Google Cloud.

## 2. Google service account

Follow [`SERVICE_ACCOUNT.md`](SERVICE_ACCOUNT.md) to create one, then set:

```
GOOGLE_SERVICE_ACCOUNT_EMAIL=...
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY=...
```

## 3. KV (Upstash Redis)

Follow [`KV_SETUP.md`](KV_SETUP.md). Optional for local dev (an in-memory
fallback kicks in automatically), **required** before deploying — see why
in that doc.

## 4. Auth secret

```bash
openssl rand -base64 32
```

Set the result as `AUTH_SECRET`. Set `AUTH_URL` to `http://localhost:3000`
locally, or your production domain when deployed.

## 5. Bootstrap the root spreadsheet + first user

The root spreadsheet holds `Users`, `Roles_Permissions`, `Workspaces`, and
`User_Workspaces` — it's created once per deployment, not per workspace.

```bash
# .env.local
FOUNDER_NAME=Your Name
FOUNDER_EMAIL=you@picapool.com
FOUNDER_PASSWORD=a-strong-password

npm run provision:root
```

This prints a spreadsheet ID — copy it into `ROOT_SPREADSHEET_ID` in
`.env.local` (and later into your Vercel project env vars), then restart
`npm run dev`. Because `FOUNDER_EMAIL`/`FOUNDER_PASSWORD` were set, the
script also creates your first login (role: Founder) — without this
you'd have no way to sign in and create further users through the UI.

## 6. Create a workspace

Two options:

- **Through the UI**: log in at `/login`, go to **Admin > Workspaces**,
  click **New Workspace**. This is the normal path once you have a
  Founder/Admin login.
- **Demo data**: `npm run seed -- "Demo Workspace"` provisions a workspace
  (if one with that name doesn't already exist), adds you to it, and fills
  it with ~40 sample leads, contacts, tags, campaigns, call history, tasks,
  and housing listings.

## Verifying it's working

`Admin > System Health` reports live status for the service account, root
spreadsheet, auth secret, and KV — check that page first if anything looks
wrong.
