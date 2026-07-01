/**
 * Populates a demo workspace with realistic dummy data: leads, contacts,
 * tags, campaigns, call history, tasks, and housing listings. Requires
 * ROOT_SPREADSHEET_ID and a Founder user to already exist — run
 * `npm run provision:root` (with FOUNDER_EMAIL/PASSWORD set) first.
 *
 * Usage:
 *   npm run seed -- "Demo Workspace"
 *   npm run seed -- "Demo Workspace" https://docs.google.com/spreadsheets/d/.../edit
 *
 * The second argument is optional: a spreadsheet you've already created
 * and shared with the service account as Editor, for when
 * `spreadsheets.create` isn't available to it (see docs/SERVICE_ACCOUNT.md).
 */
import "./load-env";
import { provisionWorkspace, extractSpreadsheetId } from "../src/lib/sheets/provisioning";
import {
  usersRepository,
  workspacesRepository,
  userWorkspacesRepository,
  leadsRepository,
  contactsRepository,
  tagsRepository,
  campaignsRepository,
  callHistoryRepository,
  tasksRepository,
  housingListingsRepository,
} from "../src/lib/sheets/repositories";
import type { LeadStatus, LeadRecord } from "../src/lib/sheets/schema/crm";
import type { CallOutcome } from "../src/lib/sheets/schema/engagement";

const COLLEGES = ["DU North Campus", "DU South Campus", "LPU", "Amity Noida", "IP University", "Manipal"];
const CITIES = ["Delhi", "Noida", "Gurugram", "Jalandhar", "Bengaluru"];
const SOURCES = ["Instagram", "Referral", "Google Ads", "Campus Ambassador", "WhatsApp"];
const FIRST_NAMES = ["Aarav", "Vivaan", "Aditi", "Diya", "Kabir", "Ishaan", "Ananya", "Myra", "Reyansh", "Saanvi"];
const LAST_NAMES = ["Sharma", "Verma", "Gupta", "Iyer", "Khan", "Reddy", "Nair", "Patel", "Singh", "Das"];
const STATUSES: LeadStatus[] = [
  "new",
  "queued",
  "connected",
  "interested",
  "callback",
  "no_answer",
  "converted",
];
const OUTCOMES: CallOutcome[] = ["connected", "interested", "callback", "busy", "no_answer"];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomPhone(): string {
  return `+91 9${Math.floor(100000000 + Math.random() * 899999999)}`;
}

async function main() {
  const rootId = process.env.ROOT_SPREADSHEET_ID;
  if (!rootId) {
    console.error("ROOT_SPREADSHEET_ID is not set — run `npm run provision:root` first.");
    process.exit(1);
  }

  const users = await usersRepository.list(rootId);
  const founder = users.find((u) => u.default_role === "Founder") ?? users[0];
  if (!founder) {
    console.error(
      "No users found in the root spreadsheet — run `npm run provision:root` with " +
        "FOUNDER_EMAIL/FOUNDER_PASSWORD set first."
    );
    process.exit(1);
  }

  const workspaceName = process.argv[2] || "Demo Workspace";
  const existingWorkspaces = await workspacesRepository.list(rootId);
  const existing = existingWorkspaces.find((w) => w.name === workspaceName);

  let workspaceId: string;
  let spreadsheetId: string;

  if (existing) {
    workspaceId = existing.id;
    spreadsheetId = existing.spreadsheet_id;
    console.log(`Using existing workspace "${workspaceName}" (${spreadsheetId}).`);
  } else {
    const existingSpreadsheetArg = process.argv[3];
    const result = await provisionWorkspace(
      workspaceName,
      [founder.email],
      "seed-script",
      existingSpreadsheetArg ? extractSpreadsheetId(existingSpreadsheetArg) : undefined
    );
    workspaceId = result.workspaceId;
    spreadsheetId = result.spreadsheetId;
    console.log(`Provisioned workspace "${workspaceName}" (${spreadsheetId}).`);
  }

  const memberships = await userWorkspacesRepository.list(rootId);
  const alreadyMember = memberships.some(
    (m) => m.user_id === founder.id && m.workspace_id === workspaceId
  );
  if (!alreadyMember) {
    await userWorkspacesRepository.create(rootId, {
      user_id: founder.id,
      workspace_id: workspaceId,
      role: "Founder",
      created_by: "seed-script",
    });
    console.log(`Added ${founder.email} to "${workspaceName}" as Founder.`);
  }

  // Tags
  const tagNames = ["hot", "warm", "cold", "referral", "priority"];
  const tags = await Promise.all(
    tagNames.map((name) =>
      tagsRepository.create(spreadsheetId, { name, created_by: "seed-script" })
    )
  );
  console.log(`Created ${tags.length} tags.`);

  // Campaigns
  const campaignDefs = [
    { name: "DU Freshers Drive", source: "Campus Ambassador" },
    { name: "Instagram Winter Push", source: "Instagram" },
    { name: "Referral Program", source: "Referral" },
  ];
  const campaigns = await Promise.all(
    campaignDefs.map((c) =>
      campaignsRepository.create(spreadsheetId, {
        name: c.name,
        source: c.source,
        status: "active",
        created_by: "seed-script",
      })
    )
  );
  console.log(`Created ${campaigns.length} campaigns.`);

  // Leads
  const leadCount = 40;
  const leads: LeadRecord[] = [];
  for (let i = 0; i < leadCount; i++) {
    const name = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
    const lead = await leadsRepository.create(spreadsheetId, {
      name,
      phone: randomPhone(),
      email: `${name.toLowerCase().replace(/\s+/g, ".")}@example.com`,
      college: pick(COLLEGES),
      city: pick(CITIES),
      source: pick(SOURCES),
      campaign_id: Math.random() > 0.3 ? pick(campaigns).id : undefined,
      status: pick(STATUSES),
      priority: pick(["low", "medium", "high"] as const),
      tags: Math.random() > 0.5 ? [pick(tags).name] : [],
      created_by: "seed-script",
    });
    leads.push(lead);
  }
  console.log(`Created ${leads.length} leads.`);

  // Call history for non-new leads
  let callCount = 0;
  for (const lead of leads) {
    if (lead.status === "new") continue;
    const calls = 1 + Math.floor(Math.random() * 2);
    for (let i = 0; i < calls; i++) {
      const daysAgo = Math.floor(Math.random() * 10);
      const calledAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
      await callHistoryRepository.create(spreadsheetId, {
        lead_id: lead.id,
        caller_id: founder.id,
        outcome: pick(OUTCOMES),
        called_at: calledAt,
        created_by: "seed-script",
      });
      callCount++;
    }
  }
  console.log(`Created ${callCount} call history entries.`);

  // Contacts linked to a few leads
  const contactSample = leads.slice(0, 8);
  await Promise.all(
    contactSample.map((lead) =>
      contactsRepository.create(spreadsheetId, {
        name: `${lead.name} (Parent)`,
        phone: randomPhone(),
        relation: "Parent",
        lead_id: lead.id,
        created_by: "seed-script",
      })
    )
  );
  console.log(`Created ${contactSample.length} contacts.`);

  // Tasks for a few leads
  const taskSample = leads.slice(0, 6);
  await Promise.all(
    taskSample.map((lead, i) =>
      tasksRepository.create(spreadsheetId, {
        title: `Follow up with ${lead.name}`,
        assignee_id: founder.id,
        due_date: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        priority: "medium",
        status: "open",
        linked_lead_id: lead.id,
        created_by: "seed-script",
      })
    )
  );
  console.log(`Created ${taskSample.length} tasks.`);

  // Housing listings
  const listingDefs = [
    { title: "2BHK near DU North Campus", city: "Delhi", rent: 18000 },
    { title: "PG for girls, walking distance to LPU", city: "Jalandhar", rent: 9000 },
    { title: "3BHK shared flat", city: "Noida", rent: 22000 },
  ];
  await Promise.all(
    listingDefs.map((l) =>
      housingListingsRepository.create(spreadsheetId, {
        title: l.title,
        city: l.city,
        rent_amount: l.rent,
        availability_status: "available",
        created_by: "seed-script",
      })
    )
  );
  console.log(`Created ${listingDefs.length} housing listings.`);

  console.log(`\nSeed complete. Log in as ${founder.email} and switch to "${workspaceName}".`);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
