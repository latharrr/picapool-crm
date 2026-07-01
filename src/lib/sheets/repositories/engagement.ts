import { BaseRepository } from "../repository";
import {
  callHistoryTab,
  messageHistoryTab,
  emailHistoryTab,
  tasksTab,
  campaignsTab,
} from "../schema/engagement";

export const callHistoryRepository = new BaseRepository(callHistoryTab);
export const messageHistoryRepository = new BaseRepository(messageHistoryTab);
export const emailHistoryRepository = new BaseRepository(emailHistoryTab);
export const tasksRepository = new BaseRepository(tasksTab);
export const campaignsRepository = new BaseRepository(campaignsTab);
