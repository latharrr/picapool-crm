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

Every spreadsheet the app creates (root + one per workspace) is **owned by
the service account**, not by any human Google account. That means:

- They won't show up in any team member's "My Drive" automatically.
- The app shares each workspace spreadsheet **read-only** with the admin
  emails you provide when creating it, so admins can open it for manual
  audit/export — but the app never expects or needs humans to edit it.
- If you want an org-wide backup location, you can manually move the
  service account's spreadsheets into a Shared Drive the service account
  has access to, or set up domain-wide delegation so the service account
  creates files as a specific human user instead (out of scope for the
  default setup — only worth doing if institutional backup policy requires
  it).

## Quotas

Default Google Sheets API quota is roughly 300 read requests and 60 write
requests per minute per project. See [`SCALE_LIMITS.md`](SCALE_LIMITS.md)
for how the app's caching and rate-limit/retry logic work around this, and
when you'd need to request a quota increase or move off Sheets entirely.
