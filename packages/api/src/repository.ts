import { z } from "zod";
import type { Actor, Person } from "@jamot/contracts";
import type { JamotRepository as CoreJamotRepository } from "@jamot/core/repository";
import { createMemoryRepository as createCoreMemoryRepository } from "@jamot/core/repository/memory";

export const ROLE_KINDS = ["owner", "admin", "member", "agent", "external"] as const;
export type RoleKind = (typeof ROLE_KINDS)[number];
export const RoleKindSchema = z.enum(ROLE_KINDS);

export interface StoredUser {
  person: Person;
  actor: Actor;
  passwordHash: string;
}

/**
 * The api's repository view: the core domain repository plus the auth user
 * store (person/actor/password-hash). Auth users are kept out of the core
 * domain layer for now; they live in a dedicated store.
 */
export interface JamotRepository extends CoreJamotRepository {
  createUser(input: StoredUser): Promise<void>;
  findUserByEmail(email: string): Promise<StoredUser | null>;
}

export function createMemoryRepository(): JamotRepository {
  const core = createCoreMemoryRepository();
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
