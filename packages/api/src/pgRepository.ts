import type { JamotRepository } from "./repository.js";

export function createPgRepository(): JamotRepository {
  const notImplemented = (): never => {
    throw new Error("not implemented");
  };

  return {
    createActor: notImplemented,
    getActor: notImplemented,
    listActors: notImplemented,
    updateActor: notImplemented,
    createPerson: notImplemented,
    getPerson: notImplemented,
    listPeople: notImplemented,
    updatePerson: notImplemented,
    createSpace: notImplemented,
    getSpace: notImplemented,
    createOrganization: notImplemented,
    getOrganization: notImplemented,
    listOrganizations: notImplemented,
    createRole: notImplemented,
    listRolesForActor: notImplemented,
    listRolesForSpace: notImplemented,
    createTask: notImplemented,
    getTask: notImplemented,
    listTasks: notImplemented,
    updateTask: notImplemented,
    createUser: notImplemented,
    findUserByEmail: notImplemented,
  };
}
