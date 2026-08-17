import { and, arrayContains, asc, eq, inArray, or } from "drizzle-orm";
import type {
  Actor,
  Agent,
  Capability,
  Connector,
  Organization,
  Person,
  Policy,
  Role,
  Skill,
  Space,
  Task,
  TaskAttachment,
  TaskList,
} from "@jamot/contracts";
import type { Id } from "@jamot/contracts";
import type { Db } from "../db.js";
import {
  actors,
  agents,
  capabilities,
  connectors,
  organizations,
  people,
  policies,
  roles,
  secrets,
  skills,
  spaces,
  taskAttachments,
  taskLists,
  tasks,
} from "../schema/index.js";
import type {
  JamotRepository,
  NewActor,
  NewAgent,
  NewCapability,
  NewConnector,
  NewOrganization,
  NewPerson,
  NewPolicy,
  NewRole,
  NewSkill,
  NewSpace,
  NewTask,
  NewTaskAttachment,
  NewTaskList,
  SecretRecord,
} from "./repository.js";

type ActorRow = typeof actors.$inferSelect;
type AgentRow = typeof agents.$inferSelect;
type SpaceRow = typeof spaces.$inferSelect;
type OrganizationRow = typeof organizations.$inferSelect;
type RoleRow = typeof roles.$inferSelect;
type TaskRow = typeof tasks.$inferSelect;
type TaskListRow = typeof taskLists.$inferSelect;
type TaskAttachmentRow = typeof taskAttachments.$inferSelect;
type SkillRow = typeof skills.$inferSelect;
type ConnectorRow = typeof connectors.$inferSelect;
type CapabilityRow = typeof capabilities.$inferSelect;
type PolicyRow = typeof policies.$inferSelect;
type SecretRow = typeof secrets.$inferSelect;

function toActor(row: ActorRow): Actor {
  return {
    id: row.id as Id,
    type: row.type,
    source: row.source,
    displayName: row.displayName,
    status: row.status,
    externalIdentities: row.externalIdentities,
    personalSpaceId: (row.personalSpaceId as Id | null) ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toPerson(row: typeof people.$inferSelect): Person {
  return {
    id: row.id as Id,
    actorId: row.actorId as Id,
    email: row.email,
    profile: row.profile,
    membershipSpaceIds: row.membershipSpaceIds as Id[],
    reputation: row.reputation,
  };
}

function toAgent(row: AgentRow): Agent {
  return {
    id: row.id as Id,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    actorId: row.actorId as Id,
    ownerId: row.ownerId as Id,
    organizationIds: row.organizationIds as Id[],
    role: row.role,
    harness: row.harness,
    skillIds: row.skillIds as Id[],
    capabilityIds: row.capabilityIds as Id[],
    permissions: row.permissions as Id[],
    autonomy: row.autonomy,
    budget: row.budget === null ? null : Number(row.budget),
    heartbeat: row.heartbeat,
    availability: row.availability,
    performance: row.performance,
  };
}

function toSpace(row: SpaceRow): Space {
  return {
    id: row.id as Id,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    kind: row.kind,
    ownerActorId: row.ownerActorId as Id,
    name: row.name,
  };
}

function toOrganization(row: OrganizationRow): Organization {
  return {
    id: row.id as Id,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    spaceId: row.spaceId as Id,
    dream: row.dream,
    blueprint: row.blueprint,
    enabledAppIds: row.enabledAppIds,
    treasuryId: (row.treasuryId as Id | null) ?? null,
    reputation: row.reputation,
  };
}

function toRole(row: RoleRow): Role {
  return {
    id: row.id as Id,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    actorId: row.actorId as Id,
    spaceId: row.spaceId as Id,
    kind: row.kind,
    title: row.title,
  };
}

function toTask(row: TaskRow): Task {
  return {
    id: row.id as Id,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    spaceId: row.spaceId as Id,
    projectId: (row.projectId as Id | null) ?? null,
    listId: (row.listId as Id | null) ?? null,
    title: row.title,
    description: row.description,
    status: row.status,
    assigneeActorIds: row.assigneeActorIds as Id[],
    targetType: row.targetType,
    requiredCapabilityIds: row.requiredCapabilityIds as Id[],
    outcome: row.outcome,
    dueDate: row.dueDate,
    position: row.position,
  };
}

function toTaskList(row: TaskListRow): TaskList {
  return {
    id: row.id as Id,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    spaceId: row.spaceId as Id,
    name: row.name,
    position: row.position,
  };
}

function toTaskAttachment(row: TaskAttachmentRow): TaskAttachment {
  return {
    id: row.id as Id,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    taskId: row.taskId as Id,
    name: row.name,
    mimeType: row.mimeType,
    size: row.size,
    data: row.data,
  };
}

function toSkill(row: SkillRow): Skill {
  return {
    id: row.id as Id,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    ownerActorId: (row.ownerActorId as Id | null) ?? null,
    ownerOrganizationId: (row.ownerOrganizationId as Id | null) ?? null,
    name: row.name,
    description: row.description,
    version: row.version,
    inputs: row.inputs,
    outputs: row.outputs,
    prerequisites: row.prerequisites as Id[],
    allowedCapabilityIds: row.allowedCapabilityIds as Id[],
    evaluationCriteria: row.evaluationCriteria,
    provenance: row.provenance,
    status: row.status,
  };
}

function toConnector(row: ConnectorRow): Connector {
  return {
    id: row.id as Id,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    provider: row.provider,
    type: row.type,
    ownerActorId: (row.ownerActorId as Id | null) ?? null,
    ownerOrganizationId: (row.ownerOrganizationId as Id | null) ?? null,
    capabilities: row.capabilities,
    credentialRef: row.credentialRef,
    scopes: row.scopes,
    configuration: row.configuration,
    status: row.status,
  };
}

function toCapability(row: CapabilityRow): Capability {
  return {
    id: row.id as Id,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    name: row.name,
    skillId: row.skillId as Id,
    connectorId: row.connectorId as Id,
    policyIds: row.policyIds as Id[],
    context: row.context,
    spaceId: row.spaceId as Id,
  };
}

function toPolicy(row: PolicyRow): Policy {
  return {
    id: row.id as Id,
    spaceId: row.spaceId as Id,
    name: row.name,
    capability: row.capability,
    resource: row.resource,
    minRole: row.minRole,
    riskThreshold: Number(row.riskThreshold),
    decision: row.decision,
  };
}

function toSecret(row: SecretRow): SecretRecord {
  return {
    ref: row.ref,
    scope: row.scope,
    ownerActorId: (row.ownerActorId as Id | null) ?? null,
    ownerOrganizationId: (row.ownerOrganizationId as Id | null) ?? null,
    ciphertext: row.ciphertext,
  };
}

const nowIso = () => new Date().toISOString();

export function createPgRepository(db: Db): JamotRepository {
  const q = db.db;

  const repo: JamotRepository = {
    async createActor(input: NewActor) {
      const [row] = await q
        .insert(actors)
        .values({
          type: input.type,
          source: input.source ?? "internal",
          displayName: input.displayName,
          status: input.status ?? "active",
          externalIdentities: input.externalIdentities ?? [],
          personalSpaceId: input.personalSpaceId ?? null,
        })
        .returning();
      if (!row) throw new Error("failed to create actor");
      return toActor(row);
    },

    async getActor(id) {
      const [row] = await q
        .select()
        .from(actors)
        .where(eq(actors.id, id))
        .limit(1);
      return row ? toActor(row) : null;
    },

    async listActors(filter) {
      if (!filter?.spaceId) {
        const rows = await q.select().from(actors);
        return rows.map(toActor);
      }
      const spaceId = filter.spaceId;
      const members = await q
        .select({ actorId: roles.actorId })
        .from(roles)
        .where(eq(roles.spaceId, spaceId));
      const memberIds = members.map((m) => m.actorId);
      const rows = await q
        .select()
        .from(actors)
        .where(
          or(
            eq(actors.personalSpaceId, spaceId),
            memberIds.length > 0 ? inArray(actors.id, memberIds) : undefined,
          ),
        );
      return rows.map(toActor);
    },

    async updateActor(id, patch) {
      const [row] = await q
        .update(actors)
        .set({ ...patch, updatedAt: nowIso() })
        .where(eq(actors.id, id))
        .returning();
      return row ? toActor(row) : null;
    },

    async createPerson(input: NewPerson) {
      const [row] = await q
        .insert(people)
        .values({
          actorId: input.actorId,
          email: input.email ?? null,
          profile: input.profile ?? {
            selfDescribed: {},
            integral: {},
            skills: [],
            preferences: {},
            goals: [],
          },
          membershipSpaceIds: input.membershipSpaceIds ?? [],
          reputation: input.reputation ?? {},
        })
        .returning();
      if (!row) throw new Error("failed to create person");
      return toPerson(row);
    },

    async getPerson(id) {
      const [row] = await q
        .select()
        .from(people)
        .where(eq(people.id, id))
        .limit(1);
      return row ? toPerson(row) : null;
    },

    async listPeople() {
      const rows = await q.select().from(people);
      return rows.map(toPerson);
    },

    async updatePerson(id, patch) {
      const [row] = await q
        .update(people)
        .set(patch)
        .where(eq(people.id, id))
        .returning();
      return row ? toPerson(row) : null;
    },

    async createAgent(input: NewAgent) {
      const [row] = await q
        .insert(agents)
        .values({
          actorId: input.actorId,
          ownerId: input.ownerId,
          organizationIds: input.organizationIds ?? [],
          role: input.role ?? null,
          harness: input.harness,
          skillIds: input.skillIds ?? [],
          capabilityIds: input.capabilityIds ?? [],
          permissions: input.permissions ?? [],
          autonomy: input.autonomy ?? "approve",
          budget: input.budget == null ? null : String(input.budget),
          heartbeat: input.heartbeat ?? {
            enabled: false,
            cron: null,
            quietHours: null,
          },
          availability: input.availability ?? "offline",
          performance: input.performance ?? {},
        })
        .returning();
      if (!row) throw new Error("failed to create agent");
      return toAgent(row);
    },

    async getAgent(id) {
      const [row] = await q
        .select()
        .from(agents)
        .where(eq(agents.id, id))
        .limit(1);
      return row ? toAgent(row) : null;
    },

    async listAgents(filter) {
      const rows = await q
        .select()
        .from(agents)
        .where(
          filter?.organizationId
            ? arrayContains(agents.organizationIds, [filter.organizationId])
            : undefined,
        );
      return rows.map(toAgent);
    },

    async createSpace(input: NewSpace) {
      const [row] = await q
        .insert(spaces)
        .values({
          kind: input.kind,
          ownerActorId: input.ownerActorId,
          name: input.name,
        })
        .returning();
      if (!row) throw new Error("failed to create space");
      return toSpace(row);
    },

    async getSpace(id) {
      const [row] = await q
        .select()
        .from(spaces)
        .where(eq(spaces.id, id))
        .limit(1);
      return row ? toSpace(row) : null;
    },

    async listSpaces() {
      const rows = await q.select().from(spaces);
      return rows.map(toSpace);
    },

    async createOrganization(input: NewOrganization) {
      const [row] = await q
        .insert(organizations)
        .values({
          spaceId: input.spaceId,
          dream: input.dream ?? "",
          blueprint: input.blueprint ?? {},
          enabledAppIds: input.enabledAppIds ?? [],
          treasuryId: input.treasuryId ?? null,
          reputation: input.reputation ?? {},
        })
        .returning();
      if (!row) throw new Error("failed to create organization");
      return toOrganization(row);
    },

    async getOrganization(id) {
      const [row] = await q
        .select()
        .from(organizations)
        .where(eq(organizations.id, id))
        .limit(1);
      return row ? toOrganization(row) : null;
    },

    async listOrganizations() {
      const rows = await q.select().from(organizations);
      return rows.map(toOrganization);
    },

    async updateOrganization(id, patch) {
      const [row] = await q
        .update(organizations)
        .set({ ...patch, updatedAt: nowIso() })
        .where(eq(organizations.id, id))
        .returning();
      return row ? toOrganization(row) : null;
    },

    async createRole(input: NewRole) {
      const [row] = await q
        .insert(roles)
        .values({
          actorId: input.actorId,
          spaceId: input.spaceId,
          kind: input.kind,
          title: input.title ?? null,
        })
        .returning();
      if (!row) throw new Error("failed to create role");
      return toRole(row);
    },

    async listRolesForActor(actorId) {
      const rows = await q
        .select()
        .from(roles)
        .where(eq(roles.actorId, actorId));
      return rows.map(toRole);
    },

    async listRolesForSpace(spaceId) {
      const rows = await q
        .select()
        .from(roles)
        .where(eq(roles.spaceId, spaceId));
      return rows.map(toRole);
    },

    async updateRole(id, patch) {
      const [row] = await q
        .update(roles)
        .set({ ...patch, updatedAt: nowIso() })
        .where(eq(roles.id, id))
        .returning();
      return row ? toRole(row) : null;
    },

    async deleteRole(id) {
      await q.delete(roles).where(eq(roles.id, id));
    },

    async createTask(input: NewTask) {
      const [row] = await q
        .insert(tasks)
        .values({
          spaceId: input.spaceId,
          projectId: input.projectId ?? null,
          listId: input.listId ?? null,
          title: input.title,
          description: input.description ?? "",
          status: input.status ?? "created",
          assigneeActorIds: input.assigneeActorIds ?? [],
          targetType: input.targetType ?? "human",
          requiredCapabilityIds: input.requiredCapabilityIds ?? [],
          outcome: input.outcome ?? null,
          dueDate: input.dueDate ?? null,
          position: input.position ?? 0,
        })
        .returning();
      if (!row) throw new Error("failed to create task");
      return toTask(row);
    },

    async getTask(id) {
      const [row] = await q
        .select()
        .from(tasks)
        .where(eq(tasks.id, id))
        .limit(1);
      return row ? toTask(row) : null;
    },

    async listTasks(filter) {
      const rows = await q
        .select()
        .from(tasks)
        .where(
          and(
            filter?.spaceId ? eq(tasks.spaceId, filter.spaceId) : undefined,
            filter?.listId ? eq(tasks.listId, filter.listId) : undefined,
            filter?.assigneeActorId
              ? arrayContains(tasks.assigneeActorIds, [filter.assigneeActorId])
              : undefined,
          ),
        );
      return rows.map(toTask);
    },

    async updateTaskStatus(id, status) {
      const [row] = await q
        .update(tasks)
        .set({ status, updatedAt: nowIso() })
        .where(eq(tasks.id, id))
        .returning();
      return row ? toTask(row) : null;
    },

    async assignTask(id, assigneeActorIds) {
      const [row] = await q
        .update(tasks)
        .set({ assigneeActorIds, updatedAt: nowIso() })
        .where(eq(tasks.id, id))
        .returning();
      return row ? toTask(row) : null;
    },

    async updateTask(id, patch) {
      const [row] = await q
        .update(tasks)
        .set({ ...patch, updatedAt: nowIso() })
        .where(eq(tasks.id, id))
        .returning();
      return row ? toTask(row) : null;
    },

    async createTaskList(input: NewTaskList) {
      const [row] = await q
        .insert(taskLists)
        .values({
          spaceId: input.spaceId,
          name: input.name,
          position: input.position ?? 0,
        })
        .returning();
      if (!row) throw new Error("failed to create task list");
      return toTaskList(row);
    },

    async getTaskList(id) {
      const [row] = await q
        .select()
        .from(taskLists)
        .where(eq(taskLists.id, id))
        .limit(1);
      return row ? toTaskList(row) : null;
    },

    async listTaskLists(spaceId) {
      const rows = await q
        .select()
        .from(taskLists)
        .where(eq(taskLists.spaceId, spaceId))
        .orderBy(asc(taskLists.position));
      return rows.map(toTaskList);
    },

    async updateTaskList(id, patch) {
      const [row] = await q
        .update(taskLists)
        .set({ ...patch, updatedAt: nowIso() })
        .where(eq(taskLists.id, id))
        .returning();
      return row ? toTaskList(row) : null;
    },

    async deleteTaskList(id) {
      await q.delete(taskLists).where(eq(taskLists.id, id));
    },

    async addTaskAttachment(input: NewTaskAttachment) {
      const [row] = await q
        .insert(taskAttachments)
        .values({
          taskId: input.taskId,
          name: input.name,
          mimeType: input.mimeType ?? "application/octet-stream",
          size: input.size ?? 0,
          data: input.data,
        })
        .returning();
      if (!row) throw new Error("failed to add task attachment");
      return toTaskAttachment(row);
    },

    async listTaskAttachments(taskId) {
      const rows = await q
        .select()
        .from(taskAttachments)
        .where(eq(taskAttachments.taskId, taskId));
      return rows.map(toTaskAttachment);
    },

    async deleteTaskAttachment(id) {
      await q.delete(taskAttachments).where(eq(taskAttachments.id, id));
    },

    async createSkill(input: NewSkill) {
      const [row] = await q
        .insert(skills)
        .values({
          ownerActorId: input.ownerActorId ?? null,
          ownerOrganizationId: input.ownerOrganizationId ?? null,
          name: input.name,
          description: input.description ?? "",
          version: input.version ?? "1.0.0",
          inputs: input.inputs ?? {},
          outputs: input.outputs ?? {},
          prerequisites: input.prerequisites ?? [],
          allowedCapabilityIds: input.allowedCapabilityIds ?? [],
          evaluationCriteria: input.evaluationCriteria ?? [],
          provenance: input.provenance,
          status: input.status ?? "draft",
        })
        .returning();
      if (!row) throw new Error("failed to create skill");
      return toSkill(row);
    },

    async getSkill(id) {
      const [row] = await q
        .select()
        .from(skills)
        .where(eq(skills.id, id))
        .limit(1);
      return row ? toSkill(row) : null;
    },

    async listSkills(filter) {
      const rows = await q
        .select()
        .from(skills)
        .where(
          filter?.ownerOrganizationId
            ? eq(skills.ownerOrganizationId, filter.ownerOrganizationId)
            : undefined,
        );
      return rows.map(toSkill);
    },

    async createConnector(input: NewConnector) {
      const [row] = await q
        .insert(connectors)
        .values({
          provider: input.provider,
          type: input.type ?? "channel",
          ownerActorId: input.ownerActorId ?? null,
          ownerOrganizationId: input.ownerOrganizationId ?? null,
          capabilities: input.capabilities ?? [],
          credentialRef: input.credentialRef,
          scopes: input.scopes ?? [],
          configuration: input.configuration ?? {},
          status: input.status ?? "disconnected",
        })
        .returning();
      if (!row) throw new Error("failed to create connector");
      return toConnector(row);
    },

    async getConnector(id) {
      const [row] = await q
        .select()
        .from(connectors)
        .where(eq(connectors.id, id))
        .limit(1);
      return row ? toConnector(row) : null;
    },

    async listConnectors(filter) {
      const rows = await q
        .select()
        .from(connectors)
        .where(
          filter?.ownerOrganizationId
            ? eq(connectors.ownerOrganizationId, filter.ownerOrganizationId)
            : undefined,
        );
      return rows.map(toConnector);
    },

    async updateConnectorStatus(id, status) {
      const [row] = await q
        .update(connectors)
        .set({ status, updatedAt: nowIso() })
        .where(eq(connectors.id, id))
        .returning();
      return row ? toConnector(row) : null;
    },

    async createCapability(input: NewCapability) {
      const [row] = await q
        .insert(capabilities)
        .values({
          name: input.name,
          skillId: input.skillId,
          connectorId: input.connectorId,
          policyIds: input.policyIds ?? [],
          context: input.context ?? {},
          spaceId: input.spaceId,
        })
        .returning();
      if (!row) throw new Error("failed to create capability");
      return toCapability(row);
    },

    async getCapability(id) {
      const [row] = await q
        .select()
        .from(capabilities)
        .where(eq(capabilities.id, id))
        .limit(1);
      return row ? toCapability(row) : null;
    },

    async listCapabilities(filter) {
      const rows = await q
        .select()
        .from(capabilities)
        .where(
          filter?.spaceId ? eq(capabilities.spaceId, filter.spaceId) : undefined,
        );
      return rows.map(toCapability);
    },

    async createPolicy(input: NewPolicy) {
      const [row] = await q
        .insert(policies)
        .values({
          spaceId: input.spaceId,
          name: input.name,
          capability: input.capability,
          resource: input.resource ?? "*",
          minRole: input.minRole ?? null,
          riskThreshold: String(input.riskThreshold ?? 0.5),
          decision: input.decision,
        })
        .returning();
      if (!row) throw new Error("failed to create policy");
      return toPolicy(row);
    },

    async listPolicies(filter) {
      const rows = await q
        .select()
        .from(policies)
        .where(
          filter?.spaceId ? eq(policies.spaceId, filter.spaceId) : undefined,
        );
      return rows.map(toPolicy);
    },

    async putSecret(secret) {
      await q
        .insert(secrets)
        .values({
          ref: secret.ref,
          scope: secret.scope,
          ownerActorId: secret.ownerActorId ?? null,
          ownerOrganizationId: secret.ownerOrganizationId ?? null,
          ciphertext: secret.ciphertext,
        })
        .onConflictDoUpdate({
          target: secrets.ref,
          set: {
            scope: secret.scope,
            ownerActorId: secret.ownerActorId ?? null,
            ownerOrganizationId: secret.ownerOrganizationId ?? null,
            ciphertext: secret.ciphertext,
            updatedAt: nowIso(),
          },
        });
    },

    async getSecret(ref) {
      const [row] = await q
        .select()
        .from(secrets)
        .where(eq(secrets.ref, ref))
        .limit(1);
      return row ? toSecret(row) : null;
    },

    async deleteSecret(ref) {
      await q.delete(secrets).where(eq(secrets.ref, ref));
    },
  };

  return repo;
}
