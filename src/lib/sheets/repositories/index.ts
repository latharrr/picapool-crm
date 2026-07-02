export * from "./root";
export * from "./crm";
export * from "./engagement";
export * from "./ops";
export * from "./research";

import type { BaseRepository } from "../repository";
import { leadsRepository, contactsRepository, tagsRepository, notesRepository } from "./crm";
import {
  callHistoryRepository,
  messageHistoryRepository,
  emailHistoryRepository,
  tasksRepository,
  campaignsRepository,
} from "./engagement";
import {
  activityLogRepository,
  housingListingsRepository,
  notificationsRepository,
  settingsRepository,
} from "./ops";
import { respondentsRepository } from "./research";

/** Every repository backed by a per-workspace tab, in the same order as WORKSPACE_TABS. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const WORKSPACE_REPOSITORIES: BaseRepository<any>[] = [
  leadsRepository,
  contactsRepository,
  tagsRepository,
  notesRepository,
  callHistoryRepository,
  messageHistoryRepository,
  emailHistoryRepository,
  tasksRepository,
  campaignsRepository,
  activityLogRepository,
  housingListingsRepository,
  notificationsRepository,
  settingsRepository,
  respondentsRepository,
];
