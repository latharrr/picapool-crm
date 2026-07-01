# Google Cloud service account

Picapool CRM authenticates to Google Sheets/Drive as a service account —
there is no per-user OAuth consent flow for reading/writing spreadsheets.

## 1. Create a project and enable APIs

1. Go to the [Google Cloud Console](https://console.cloud.google.com/) and
   create a project (or reuse an existing one).
2. Enable **Google Sheets API** and **Google Drive API** for that project
   (APIs & Services > Library). Both are required: Sheets API for reading/
   writing rows, Drive API for creating spreadsheets and sharing them
   read-only with admins.

## 2. Create the service account

1. APIs & Services > Credentials > **Create Credentials > Service account**.
2. Give it a name (e.g. `picapool-crm`). No project-level IAM role is
   needed — access is granted per-spreadsheet by the app itself, or
   implicitly since the service account owns every spreadsheet it creates.
3. Open the service account, go to **Keys > Add key > Create new key >
   JSON**, and download it.

## 3. Extract the credentials

From the downloaded JSON:

```json
{
  "client_email": "picapool-crm@your-project.iam.gserviceaccount.com",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQ...\n-----END PRIVATE KEY-----\n"
}
```

Set:

```
GOOGLE_SERVICE_ACCOUNT_EMAIL=picapool-crm@your-project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQ...\n-----END PRIVATE KEY-----\n"
```

Keep the `\n` escape sequences literal in `.env` files — `lib/env.ts`
converts them back to real newlines before use. Never commit this key.

## Where the spreadsheets live

In principle, every spreadsheet the app creates (root + one per workspace)
is owned by the service account, not by any human Google account — it
auto-provisions them via `spreadsheets.create` and shares each workspace
spreadsheet **read-only** with the admin emails you provide, so admins can
open it for manual audit/export without the app ever expecting a human to
edit it directly.

**In practice, whether the service account can create new files at all
depends on your account type:**

- **With Google Workspace** (a paid organization domain) and Shared Drive
  access, or domain-wide delegation impersonating a real user,
  `spreadsheets.create` works as designed — auto-provisioning is fully
  hands-off.
- **With a personal Gmail-based Cloud project** (no Google Workspace), bare
  service accounts typically have **no Drive storage of their own**. They
  can *edit* files a human has explicitly shared with them, but calling
  `spreadsheets.create` fails with `403 PERMISSION_DENIED: The caller does
  not have permission` — there's nowhere for the new file to live.

### Fallback: attach to a spreadsheet you created

If you hit that 403, the app supports the same workaround for both the
root spreadsheet and every workspace:

1. Create a blank Google Sheet yourself (in your own Drive).
2. Share it with your service account's email as **Editor**.
3. Give the app that spreadsheet's URL or ID instead of asking it to
   create one:
   - Root: `npm run provision:root` with `ROOT_SPREADSHEET_ID` already set
     to your sheet's ID — it adds the missing tabs rather than creating a
     new file.
   - Workspaces: paste the URL into the "Existing spreadsheet URL" field
     in Admin > Workspaces > New Workspace, or pass it as the third
     argument to `npm run provision:workspace` / second argument to
     `npm run seed`.

This still keeps 100% of data in Sheets — the only difference is who
creates the empty file.

## Quotas

Default Google Sheets API quota is roughly 300 read requests and 60 write
requests per minute per project. See [`SCALE_LIMITS.md`](SCALE_LIMITS.md)
for how the app's caching and rate-limit/retry logic work around this, and
when you'd need to request a quota increase or move off Sheets entirely.
