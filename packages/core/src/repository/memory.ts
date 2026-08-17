import { randomUUID } from "node:crypto";
import {
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

const now = () => new Date().toISOString();
const uuid = () => randomUUID();

export function createMemoryRepository(): JamotRepository {
  const actors = new Map<string, Actor>();
  const people = new Map<string, Person>();
  const agents = new Map<string, Agent>();
  const spaces = new Map<string, Space>();
  const organizations = new Map<string, Organization>();
  const roles = new Map<string, Role>();
  const tasks = new Map<string, Task>();
  const taskLists = new Map<string, TaskList>();
  const taskAttachments = new Map<string, TaskAttachment>();
  const skills = new Map<string, Skill>();
  const connectors = new Map<string, Connector>();
  const capabilities = new Map<string, Capability>();
  const policies = new Map<string, Policy>();
  const secrets = new Map<string, SecretRecord>();

  const repo: JamotRepository = {
    async createActor(input: NewActor) {
      const actor = Actor.parse({
        id: uuid(),
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

    async getActor(id) {
      return actors.get(id) ?? null;
    },

    async listActors(filter) {
      const all = [...actors.values()];
      if (!filter?.spaceId) return all;
      const spaceId = filter.spaceId;
      const memberIds = new Set(
        [...roles.values()].filter((r) => r.spaceId === spaceId).map((r) => r.actorId),
      );
      return all.filter((a) => a.personalSpaceId === spaceId || memberIds.has(a.id));
    },

    async updateActor(id, patch) {
      const existing = actors.get(id);
      if (!existing) return null;
      const updated = Actor.parse({ ...existing, ...patch, updatedAt: now() });
      actors.set(id, updated);
      return updated;
    },

    async createPerson(input: NewPerson) {
      const person = Person.parse({
        id: uuid(),
        actorId: input.actorId,
        email: input.email ?? null,
        profile: input.profile ?? {},
        membershipSpaceIds: input.membershipSpaceIds ?? [],
        reputation: input.reputation ?? {},
      });
      people.set(person.id, person);
      return person;
    },

    async getPerson(id) {
      return people.get(id) ?? null;
    },

    async listPeople() {
      return [...people.values()];
    },

    async updatePerson(id, patch) {
      const existing = people.get(id);
      if (!existing) return null;
      const updated = Person.parse({ ...existing, ...patch });
      people.set(id, updated);
      return updated;
    },

    async createAgent(input: NewAgent) {
      const agent = Agent.parse({
        id: uuid(),
        createdAt: now(),
        updatedAt: now(),
        actorId: input.actorId,
        ownerId: input.ownerId,
        organizationIds: input.organizationIds ?? [],
        role: input.role ?? null,
        harness: input.harness,
        skillIds: input.skillIds ?? [],
        capabilityIds: input.capabilityIds ?? [],
        permissions: input.permissions ?? [],
        autonomy: input.autonomy ?? "approve",
        budget: input.budget ?? null,
        heartbeat: input.heartbeat ?? { enabled: false, cron: null, quietHours: null },
        availability: input.availability ?? "offline",
        performance: input.performance ?? {},
      });
      agents.set(agent.id, agent);
      return agent;
    },

    async getAgent(id) {
      return agents.get(id) ?? null;
    },

    async listAgents(filter) {
      const all = [...agents.values()];
      if (!filter?.organizationId) return all;
      return all.filter((a) =>
        a.organizationIds.includes(filter.organizationId as Id),
      );
    },

    async createSpace(input: NewSpace) {
      const space = Space.parse({
        id: uuid(),
        createdAt: now(),
        updatedAt: now(),
        kind: input.kind,
        ownerActorId: input.ownerActorId,
        name: input.name,
      });
      spaces.set(space.id, space);
      return space;
    },

    async getSpace(id) {
      return spaces.get(id) ?? null;
    },

    async listSpaces() {
      return [...spaces.values()];
    },

    async createOrganization(input: NewOrganization) {
      const organization = Organization.parse({
        id: uuid(),
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

    async getOrganization(id) {
      return organizations.get(id) ?? null;
    },

    async listOrganizations() {
      return [...organizations.values()];
    },

    async updateOrganization(id, patch) {
      const existing = organizations.get(id);
      if (!existing) return null;
      const updated = Organization.parse({ ...existing, ...patch, updatedAt: now() });
      organizations.set(id, updated);
      return updated;
    },

    async createRole(input: NewRole) {
      const role = Role.parse({
        id: uuid(),
        createdAt: now(),
        updatedAt: now(),
        actorId: input.actorId,
        spaceId: input.spaceId,
        kind: input.kind,
        title: input.title ?? null,
      });
      roles.set(role.id, role);
      return role;
    },

    async listRolesForActor(actorId) {
      return [...roles.values()].filter((r) => r.actorId === actorId);
    },

    async listRolesForSpace(spaceId) {
      return [...roles.values()].filter((r) => r.spaceId === spaceId);
    },

    async updateRole(id, patch) {
      const existing = roles.get(id);
      if (!existing) return null;
      const updated = Role.parse({ ...existing, ...patch, updatedAt: now() });
      roles.set(id, updated);
      return updated;
    },

    async deleteRole(id) {
      roles.delete(id);
    },

    async createTask(input: NewTask) {
      const task = Task.parse({
        id: uuid(),
        createdAt: now(),
        updatedAt: now(),
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
      });
      tasks.set(task.id, task);
      return task;
    },

    async getTask(id) {
      return tasks.get(id) ?? null;
    },

    async listTasks(filter) {
      let all = [...tasks.values()];
      if (filter?.spaceId) all = all.filter((t) => t.spaceId === filter.spaceId);
      if (filter?.listId) all = all.filter((t) => t.listId === filter.listId);
      if (filter?.assigneeActorId) {
        all = all.filter((t) =>
          t.assigneeActorIds.includes(filter.assigneeActorId as Id),
        );
      }
      return all;
    },

    async updateTaskStatus(id, status) {
      const existing = tasks.get(id);
      if (!existing) return null;
      const updated = Task.parse({ ...existing, status, updatedAt: now() });
      tasks.set(id, updated);
      return updated;
    },

    async assignTask(id, assigneeActorIds) {
      const existing = tasks.get(id);
      if (!existing) return null;
      const updated = Task.parse({ ...existing, assigneeActorIds, updatedAt: now() });
      tasks.set(id, updated);
      return updated;
    },

    async updateTask(id, patch) {
      const existing = tasks.get(id);
      if (!existing) return null;
      const updated = Task.parse({ ...existing, ...patch, updatedAt: now() });
      tasks.set(id, updated);
      return updated;
    },

    async createTaskList(input: NewTaskList) {
      const list = TaskList.parse({
        id: uuid(),
        createdAt: now(),
        updatedAt: now(),
        spaceId: input.spaceId,
        name: input.name,
        position: input.position ?? 0,
      });
      taskLists.set(list.id, list);
      return list;
    },

    async getTaskList(id) {
      return taskLists.get(id) ?? null;
    },

    async listTaskLists(spaceId) {
      return [...taskLists.values()]
        .filter((list) => list.spaceId === spaceId)
        .sort((a, b) => a.position - b.position);
    },

    async updateTaskList(id, patch) {
      const existing = taskLists.get(id);
      if (!existing) return null;
      const updated = TaskList.parse({ ...existing, ...patch, updatedAt: now() });
      taskLists.set(id, updated);
      return updated;
    },

    async deleteTaskList(id) {
      taskLists.delete(id);
    },

    async addTaskAttachment(input: NewTaskAttachment) {
      const attachment = TaskAttachment.parse({
        id: uuid(),
        createdAt: now(),
        updatedAt: now(),
        taskId: input.taskId,
        name: input.name,
        mimeType: input.mimeType ?? "application/octet-stream",
        size: input.size ?? 0,
        data: input.data,
      });
      taskAttachments.set(attachment.id, attachment);
      return attachment;
    },

    async listTaskAttachments(taskId) {
      return [...taskAttachments.values()].filter((a) => a.taskId === taskId);
    },

    async deleteTaskAttachment(id) {
      taskAttachments.delete(id);
    },

    async createSkill(input: NewSkill) {
      const skill = Skill.parse({
        id: uuid(),
        createdAt: now(),
        updatedAt: now(),
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
      });
      skills.set(skill.id, skill);
      return skill;
    },

    async getSkill(id) {
      return skills.get(id) ?? null;
    },

    async listSkills(filter) {
      const all = [...skills.values()];
      if (!filter?.ownerOrganizationId) return all;
      return all.filter((s) => s.ownerOrganizationId === filter.ownerOrganizationId);
    },

    async createConnector(input: NewConnector) {
      const connector = Connector.parse({
        id: uuid(),
        createdAt: now(),
        updatedAt: now(),
        provider: input.provider,
        type: input.type ?? "channel",
        ownerActorId: input.ownerActorId ?? null,
        ownerOrganizationId: input.ownerOrganizationId ?? null,
        capabilities: input.capabilities ?? [],
        credentialRef: input.credentialRef,
        scopes: input.scopes ?? [],
        configuration: input.configuration ?? {},
        status: input.status ?? "disconnected",
      });
      connectors.set(connector.id, connector);
      return connector;
    },

    async getConnector(id) {
      return connectors.get(id) ?? null;
    },

    async listConnectors(filter) {
      const all = [...connectors.values()];
      if (!filter?.ownerOrganizationId) return all;
      return all.filter((c) => c.ownerOrganizationId === filter.ownerOrganizationId);
    },

    async updateConnectorStatus(id, status) {
      const existing = connectors.get(id);
      if (!existing) return null;
      const updated = Connector.parse({ ...existing, status, updatedAt: now() });
      connectors.set(id, updated);
      return updated;
    },

    async createCapability(input: NewCapability) {
      const capability = Capability.parse({
        id: uuid(),
        createdAt: now(),
        updatedAt: now(),
        name: input.name,
        skillId: input.skillId,
        connectorId: input.connectorId,
        policyIds: input.policyIds ?? [],
        context: input.context ?? {},
        spaceId: input.spaceId,
      });
      capabilities.set(capability.id, capability);
      return capability;
    },

    async getCapability(id) {
      return capabilities.get(id) ?? null;
    },

    async listCapabilities(filter) {
      const all = [...capabilities.values()];
      if (!filter?.spaceId) return all;
      return all.filter((c) => c.spaceId === filter.spaceId);
    },

    async createPolicy(input: NewPolicy) {
      const policy = Policy.parse({
        id: uuid(),
        spaceId: input.spaceId,
        name: input.name,
        capability: input.capability,
        resource: input.resource ?? "*",
        minRole: input.minRole ?? null,
        riskThreshold: input.riskThreshold ?? 0.5,
        decision: input.decision,
      });
      policies.set(policy.id, policy);
      return policy;
    },

    async listPolicies(filter) {
      const all = [...policies.values()];
      if (!filter?.spaceId) return all;
      return all.filter((p) => p.spaceId === filter.spaceId);
    },

    async putSecret(secret) {
      secrets.set(secret.ref, secret);
    },

    async getSecret(ref) {
      return secrets.get(ref) ?? null;
    },

    async deleteSecret(ref) {
      secrets.delete(ref);
    },
  };

  return repo;
}
