/**
 * One-time bootstrap:
 *  1. Creates the central Root spreadsheet (Users, Roles_Permissions,
 *     Workspaces, User_Workspaces) if ROOT_SPREADSHEET_ID isn't already set.
 *  2. If FOUNDER_EMAIL + FOUNDER_PASSWORD are set and no users exist yet,
 *     creates the first Founder user — otherwise there's no way to log in
 *     and create further users through the app.
 *
 * Usage: npm run provision:root
 */
import "./load-env";
import bcrypt from "bcryptjs";
import { ensureRootSpreadsheet } from "../src/lib/sheets/provisioning";
import { usersRepository } from "../src/lib/sheets/repositories";

async function main() {
  const existingId = process.env.ROOT_SPREADSHEET_ID;
  const result = await ensureRootSpreadsheet(existingId);

  if (result.created) {
    console.log("\nRoot spreadsheet created successfully.");
    console.log(`Spreadsheet ID: ${result.spreadsheetId}`);
    console.log(
      `\nAdd this to .env.local and your Vercel project env vars:\nROOT_SPREADSHEET_ID=${result.spreadsheetId}\n`
    );
  } else {
    console.log(`Root spreadsheet already configured: ${result.spreadsheetId}`);
  }

  const founderEmail = process.env.FOUNDER_EMAIL;
  const founderPassword = process.env.FOUNDER_PASSWORD;
  if (!founderEmail || !founderPassword) {
    console.log(
      "FOUNDER_EMAIL / FOUNDER_PASSWORD not set — skipping first-user creation. " +
        "Set both and re-run this script to create the first login."
    );
    return;
  }

  const existingUsers = await usersRepository.list(result.spreadsheetId);
  if (existingUsers.length > 0) {
    console.log(`Users already exist (${existingUsers.length}) — skipping founder creation.`);
    return;
  }

  const passwordHash = await bcrypt.hash(founderPassword, 10);
  const founder = await usersRepository.create(result.spreadsheetId, {
    name: process.env.FOUNDER_NAME || "Founder",
    email: founderEmail,
    password_hash: passwordHash,
    default_role: "Founder",
    is_active: true,
    created_by: "provision-root-script",
  });

  console.log(`\nCreated first Founder user: ${founder.email}`);
  console.log("You can now log in at /login with this email and the password you set.");
}

main().catch((err) => {
  console.error("Failed to provision root spreadsheet:", err);
  process.exit(1);
});
