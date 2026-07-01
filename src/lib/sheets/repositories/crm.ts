import { BaseRepository } from "../repository";
import { leadsTab, contactsTab, tagsTab, notesTab } from "../schema/crm";

export const leadsRepository = new BaseRepository(leadsTab);
export const contactsRepository = new BaseRepository(contactsTab);
export const tagsRepository = new BaseRepository(tagsTab);
export const notesRepository = new BaseRepository(notesTab);
