import { createDb } from "@jamot/core";
import type { Db } from "@jamot/core";
import { createPgRepository as createCorePgRepository } from "@jamot/core/repository/pg";
import type { JamotRepository, StoredUser } from "./repository.js";

interface UserRow {
  person_id: string;
  actor_id: string;
  password_hash: string | null;
  provider: string | null;
  provider_id: string | null;
}

/**
 * Postgres-backed repository. Domain state lives in Postgres via the core
 * repository; auth users persist in the `users` table (see migration 0004).
 */
export function createPgRepository(
  databaseUrl: string = process.env.DATABASE_URL ?? "",
): JamotRepository {
  if (!databaseUrl) throw new Error("DATABASE_URL is required for the pg repository");
  return createPgRepositoryFromDb(createDb(databaseUrl));
}

export function createPgRepositoryFromDb(db: Db): JamotRepository {
  const core = createCorePgRepository(db);
  const pool = db.pool;

  async function hydrate(row: UserRow): Promise<StoredUser | null> {
    const [person, actor] = await Promise.all([
      core.getPerson(row.person_id),
      core.getActor(row.actor_id),
    ]);
    if (!person || !actor) return null;
    return {
      person,
      actor,
      passwordHash: row.password_hash,
      provider: row.provider,
      providerId: row.provider_id,
    };
  }

  return {
    ...core,
    async createUser(input) {
      await pool.query(
        `INSERT INTO users (person_id, actor_id, email, password_hash, provider, provider_id)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          input.person.id,
          input.actor.id,
          input.person.email?.toLowerCase() ?? null,
          input.passwordHash,
          input.provider ?? null,
          input.providerId ?? null,
        ],
      );
    },
    async findUserByEmail(email) {
      const { rows } = await pool.query<UserRow>(
        `SELECT person_id, actor_id, password_hash, provider, provider_id
         FROM users WHERE email = $1 LIMIT 1`,
        [email.toLowerCase()],
      );
      return rows[0] ? hydrate(rows[0]) : null;
    },
    async findUserByProvider(provider, providerId) {
      const { rows } = await pool.query<UserRow>(
        `SELECT person_id, actor_id, password_hash, provider, provider_id
         FROM users WHERE provider = $1 AND provider_id = $2 LIMIT 1`,
        [provider, providerId],
      );
      return rows[0] ? hydrate(rows[0]) : null;
    },
  };
}
