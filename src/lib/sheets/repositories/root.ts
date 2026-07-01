import { BaseRepository } from "../repository";
import { usersTab, rolesPermissionsTab, workspacesTab, userWorkspacesTab } from "../schema/root";

export const usersRepository = new BaseRepository(usersTab);
export const rolesPermissionsRepository = new BaseRepository(rolesPermissionsTab);
export const workspacesRepository = new BaseRepository(workspacesTab);
export const userWorkspacesRepository = new BaseRepository(userWorkspacesTab);
