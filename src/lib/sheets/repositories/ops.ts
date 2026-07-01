import { BaseRepository } from "../repository";
import {
  activityLogTab,
  housingListingsTab,
  notificationsTab,
  settingsTab,
} from "../schema/ops";

export const activityLogRepository = new BaseRepository(activityLogTab);
export const housingListingsRepository = new BaseRepository(housingListingsTab);
export const notificationsRepository = new BaseRepository(notificationsTab);
export const settingsRepository = new BaseRepository(settingsTab);
