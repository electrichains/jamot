import { randomUUID } from "node:crypto";
import { z } from "zod";
import {
  Actor,
  Id,
  Organization,
  Person,
  Role,
  Space,
  Task,
} from "@jamot/contracts";
import type {
  ActorSource,
  ActorStatus,
  ActorType,
  ExternalIdentity,
  PersonProfile,
  SpaceKind,
  TaskStatus,
  TaskTargetType,
} from "@jamot/contracts";

export const ROLE_KINDS = ["owner", "admin", "member", "agent", "external"] as const;
export type RoleKind = (typeof ROLE_KINDS)[number];
export const RoleKindSchema = z.enum(ROLE_KINDS);

export interface ActorInput {
  type: ActorType;
  source?: ActorSource;
  displayName: string;
  status?: ActorStatus;
  externalIdentities?: ExternalIdentity[];
  personalSpaceId?: Id | null;
}

export interface PersonInput {
  actorId: Id;
  email?: string | null;
  profile?: PersonProfile;
  membershipSpaceIds?: Id[];
  reputation?: Record<string, number>;
}

export interface SpaceInput {
  kind: SpaceKind;
  ownerActorId: Id;
  name: string;
}

export interface OrganizationInput {
  spaceId: Id;
  dream?: string;
  blueprint?: Record<string, unknown>;
  enabledAppIds?: Id[];
  treasuryId?: Id | null;
  reputation?: Record<string, number>;
}

export interface RoleInput {
  actorId: Id;
  spaceId: Id;
  kind: RoleKind;
  title?: string | null;
}

export interface TaskInput {
  spaceId: Id;
  projectId?: Id | null;
  title: string;
  description?: string;
  status?: TaskStatus;
  assigneeActorIds?: Id[];
  targetType?: TaskTargetType;
  requiredCapabilityIds?: Id[];
  outcome?: Record<string, unknown> | null;
}

export interface StoredUser {
  person: Person;
  actor: Actor;
  passwordHash: string;
}

export interface JamotRepository {
  createActor(input: ActorInput): Promise<Actor>;
  getActor(id: Id): Promise<Actor | null>;
  listActors(spaceId?: Id): Promise<Actor[]>;
  updateActor(id: Id, patch: Partial<Actor>): Promise<Actor | null>;

  createPerson(input: PersonInput): Promise<Person>;
  getPerson(id: Id): Promise<Person | null>;
  listPeople(): Promise<Person[]>;
  updatePerson(id: Id, patch: Partial<Person>): Promise<Person | null>;

  createSpace(input: SpaceInput): Promise<Space>;
  getSpace(id: Id): Promise<Space | null>;

  createOrganization(input: OrganizationInput): Promise<Organization>;
  getOrganization(id: Id): Promise<Organization | null>;
  listOrganizations(): Promise<Organization[]>;

  createRole(input: RoleInput): Promise<Role>;
  listRolesForActor(actorId: Id): Promise<Role[]>;
  listRolesForSpace(spaceId: Id): Promise<Role[]>;

  createTask(input: TaskInput): Promise<Task>;
  getTask(id: Id): Promise<Task | null>;
  listTasks(spaceId?: Id): Promise<Task[]>;
  updateTask(id: Id, patch: Partial<Task>): Promise<Task | null>;

  createUser(input: { person: Person; actor: Actor; passwordHash: string }): Promise<void>;
  findUserByEmail(email: string): Promise<StoredUser | null>;
}

export function createMemoryRepository(): JamotRepository {
  const actors = new Map<string, Actor>();
  const people = new Map<string, Person>();
  const spaces = new Map<string, Space>();
  const organizations = new Map<string, Organization>();
  const roles: Role[] = [];
  const tasks = new Map<string, Task>();
  const users = new Map<string, StoredUser>();

  const now = () => new Date().toISOString();
  const id = () => randomUUID() as Id;

  return {
    async createActor(input) {
      const actor = Actor.parse({
        id: id(),
        createdAt: now(),
        updatedAt: now(),
        type: input.type,
        source: input.source ?? "internal",
        displayName: input.displayName,
        status: input.status ?? "active",
        externalIdentities: input.externalIdentities ?? [],
        personalSpaceId: input.personalSpaceId ?? null,
      });
      actors.set(actor.id, actor);
      return actor;
    },

    async getActor(actorId) {
      return actors.get(actorId) ?? null;
    },

    async listActors(spaceId) {
      const all = [...actors.values()];
      if (!spaceId) return all;
      const memberIds = new Set(roles.filter((r) => r.spaceId === spaceId).map((r) => r.actorId));
      return all.filter((a) => a.personalSpaceId === spaceId || memberIds.has(a.id));
    },

    async updateActor(actorId, patch) {
      const existing = actors.get(actorId);
      if (!existing) return null;
      const updated = Actor.parse({ ...existing, ...patch, updatedAt: now() });
      actors.set(actorId, updated);
      return updated;
    },

    async createPerson(input) {
      const person = Person.parse({
        id: id(),
        actorId: input.actorId,
        email: input.email ?? null,
        profile: input.profile ?? {},
        membershipSpaceIds: input.membershipSpaceIds ?? [],
        reputation: input.reputation ?? {},
      });
      people.set(person.id, person);
      return person;
    },

    async getPerson(personId) {
      return people.get(personId) ?? null;
    },

    async listPeople() {
      return [...people.values()];
    },

    async updatePerson(personId, patch) {
      const existing = people.get(personId);
      if (!existing) return null;
      const updated = Person.parse({ ...existing, ...patch });
      people.set(personId, updated);
      return updated;
    },

    async createSpace(input) {
      const space = Space.parse({
        id: id(),
        createdAt: now(),
        updatedAt: now(),
        kind: input.kind,
        ownerActorId: input.ownerActorId,
        name: input.name,
      });
      spaces.set(space.id, space);
      return space;
    },

    async getSpace(spaceId) {
      return spaces.get(spaceId) ?? null;
    },

    async createOrganization(input) {
      const organization = Organization.parse({
        id: id(),
        createdAt: now(),
        updatedAt: now(),
        spaceId: input.spaceId,
        dream: input.dream ?? "",
        blueprint: input.blueprint ?? {},
        enabledAppIds: input.enabledAppIds ?? [],
        treasuryId: input.treasuryId ?? null,
        reputation: input.reputation ?? {},
      });
      organizations.set(organization.id, organization);
      return organization;
    },

    async getOrganization(organizationId) {
      return organizations.get(organizationId) ?? null;
    },

    async listOrganizations() {
      return [...organizations.values()];
    },

    async createRole(input) {
      const role = Role.parse({
        id: id(),
        createdAt: now(),
        updatedAt: now(),
        actorId: input.actorId,
        spaceId: input.spaceId,
        kind: input.kind,
        title: input.title ?? null,
      });
      roles.push(role);
      return role;
    },

    async listRolesForActor(actorId) {
      return roles.filter((r) => r.actorId === actorId);
    },

    async listRolesForSpace(spaceId) {
      return roles.filter((r) => r.spaceId === spaceId);
    },

    async createTask(input) {
      const task = Task.parse({
        id: id(),
        createdAt: now(),
        updatedAt: now(),
        spaceId: input.spaceId,
        projectId: input.projectId ?? null,
        title: input.title,
        description: input.description ?? "",
        status: input.status ?? "created",
        assigneeActorIds: input.assigneeActorIds ?? [],
        targetType: input.targetType ?? "human",
        requiredCapabilityIds: input.requiredCapabilityIds ?? [],
        outcome: input.outcome ?? null,
      });
      tasks.set(task.id, task);
      return task;
    },

    async getTask(taskId) {
      return tasks.get(taskId) ?? null;
    },

    async listTasks(spaceId) {
      const all = [...tasks.values()];
      if (!spaceId) return all;
      return all.filter((t) => t.spaceId === spaceId);
    },

    async updateTask(taskId, patch) {
      const existing = tasks.get(taskId);
      if (!existing) return null;
      const updated = Task.parse({ ...existing, ...patch, updatedAt: now() });
      tasks.set(taskId, updated);
      return updated;
    },

    async createUser(input) {
      const key = input.person.email;
      if (key) users.set(key.toLowerCase(), input);
    },

    async findUserByEmail(email) {
      return users.get(email.toLowerCase()) ?? null;
    },
  };
}
