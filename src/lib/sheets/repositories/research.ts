import { BaseRepository } from "../repository";
import { respondentsTab } from "../schema/research";

export const respondentsRepository = new BaseRepository(respondentsTab);
