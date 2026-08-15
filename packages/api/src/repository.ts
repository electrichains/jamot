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
  passwordHash: string | null;
  provider?: string | null;
  providerId?: string | null;
}

/**
 * The api's repository view: the core domain repository plus the auth user
 * store (person/actor/password-hash + OAuth provider identity).
 */
export interface JamotRepository extends CoreJamotRepository {
  createUser(input: StoredUser): Promise<void>;
  findUserByEmail(email: string): Promise<StoredUser | null>;
  findUserByProvider(provider: string, providerId: string): Promise<StoredUser | null>;
}

export function createMemoryRepository(): JamotRepository {
  const core = createCoreMemoryRepository();
  const users = new Map<string, StoredUser>();
  const usersByProvider = new Map<string, StoredUser>();

  return {
    ...core,
    async createUser(input) {
      const email = input.person.email;
      if (email) users.set(email.toLowerCase(), input);
      if (input.provider && input.providerId) {
        usersByProvider.set(`${input.provider}:${input.providerId}`, input);
      }
    },
    async findUserByEmail(email) {
      return users.get(email.toLowerCase()) ?? null;
    },
    async findUserByProvider(provider, providerId) {
      return usersByProvider.get(`${provider}:${providerId}`) ?? null;
    },
  };
}
