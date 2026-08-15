import { createDb } from "@jamot/core";
import type { Db } from "@jamot/core";
import { createPgRepository as createCorePgRepository } from "@jamot/core/repository/pg";
import type { JamotRepository, StoredUser } from "./repository.js";

/**
 * Postgres-backed repository. Domain state lives in Postgres via the core
 * repository; auth users are held in-memory until a `users` table lands.
 */
export function createPgRepository(
  databaseUrl: string = process.env.DATABASE_URL ?? "",
): JamotRepository {
  if (!databaseUrl) throw new Error("DATABASE_URL is required for the pg repository");
  return createPgRepositoryFromDb(createDb(databaseUrl));
}

export function createPgRepositoryFromDb(db: Db): JamotRepository {
  const core = createCorePgRepository(db);
  const users = new Map<string, StoredUser>();

  return {
    ...core,
    async createUser(input) {
      const email = input.person.email;
      if (email) users.set(email.toLowerCase(), input);
    },
    async findUserByEmail(email) {
      return users.get(email.toLowerCase()) ?? null;
    },
  };
}
