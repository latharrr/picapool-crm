import type { TabDefinition } from "./tab";
import { usersTab, rolesPermissionsTab, workspacesTab, userWorkspacesTab } from "./schema/root";
import { leadsTab, contactsTab, tagsTab, notesTab } from "./schema/crm";
import {
  callHistoryTab,
  messageHistoryTab,
  emailHistoryTab,
  tasksTab,
  campaignsTab,
} from "./schema/engagement";
import {
  activityLogTab,
  housingListingsTab,
  notificationsTab,
  settingsTab,
} from "./schema/ops";

/** Tabs that live in the single central Root spreadsheet (identity + membership). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const ROOT_TABS: TabDefinition<any>[] = [
  usersTab,
  rolesPermissionsTab,
  workspacesTab,
  userWorkspacesTab,
];

/** Tabs that live in every per-workspace spreadsheet (operational data). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const WORKSPACE_TABS: TabDefinition<any>[] = [
  leadsTab,
  contactsTab,
  tagsTab,
  notesTab,
  callHistoryTab,
  messageHistoryTab,
  emailHistoryTab,
  tasksTab,
  campaignsTab,
  activityLogTab,
  housingListingsTab,
  notificationsTab,
  settingsTab,
];
