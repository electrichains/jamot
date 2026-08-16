import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import type {
  ExternalIdentity,
  Harness,
  PersonProfile,
  Provenance,
  SecretRef,
} from "@jamot/contracts";

export const actorTypeEnum = pgEnum("actor_type", ["human", "agent"]);
export const actorSourceEnum = pgEnum("actor_source", ["internal", "external"]);
export const actorStatusEnum = pgEnum("actor_status", [
  "active",
  "inactive",
  "suspended",
]);
export const spaceKindEnum = pgEnum("space_kind", ["personal", "organization"]);
export const roleKindEnum = pgEnum("role_kind", [
  "owner",
  "admin",
  "member",
  "agent",
  "external",
]);
export const goalStatusEnum = pgEnum("goal_status", [
  "active",
  "done",
  "archived",
]);
export const taskStatusEnum = pgEnum("task_status", [
  "created",
  "assigned",
  "started",
  "completed",
  "cancelled",
]);
export const taskTargetTypeEnum = pgEnum("task_target_type", [
  "human",
  "agent",
  "human_agent",
  "organization",
  "external",
]);
export const skillStatusEnum = pgEnum("skill_status", [
  "draft",
  "validated",
  "deprecated",
]);
export const connectorProviderEnum = pgEnum("connector_provider", [
  "whatsapp",
  "telegram",
  "google_calendar",
  "github",
  "stripe",
  "erp",
  "database",
  "matrix",
  "discord",
  "custom",
]);
export const connectorTypeEnum = pgEnum("connector_type", [
  "channel",
  "mcp",
  "harness",
  "ai_provider",
  "data",
]);
export const connectorStatusEnum = pgEnum("connector_status", [
  "connected",
  "disconnected",
  "error",
]);
export const autonomyEnum = pgEnum("autonomy", [
  "suggest",
  "approve",
  "autonomous",
]);
export const availabilityEnum = pgEnum("availability", [
  "available",
  "busy",
  "offline",
]);
export const policyDecisionEnum = pgEnum("policy_decision", [
  "allow",
  "deny",
  "require_human",
  "require_admin",
  "require_multisig",
]);
export const secretScopeEnum = pgEnum("secret_scope", [
  "user",
  "organization",
  "system",
  "environment",
]);

function timestamps() {
  return {
    createdAt: timestamp("created_at", { mode: "string", withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string", withTimezone: true })
      .notNull()
      .defaultNow(),
  };
}

export const actors = pgTable("actors", {
  id: uuid("id").defaultRandom().primaryKey(),
  type: actorTypeEnum("type").notNull(),
  source: actorSourceEnum("source").notNull().default("internal"),
  displayName: text("display_name").notNull(),
  status: actorStatusEnum("status").notNull().default("active"),
  externalIdentities: jsonb("external_identities")
    .$type<ExternalIdentity[]>()
    .notNull()
    .default(sql`'[]'::jsonb`),
  personalSpaceId: uuid("personal_space_id").references(
    (): AnyPgColumn => spaces.id,
  ),
  ...timestamps(),
});

export const spaces = pgTable("spaces", {
  id: uuid("id").defaultRandom().primaryKey(),
  kind: spaceKindEnum("kind").notNull(),
  ownerActorId: uuid("owner_actor_id")
    .notNull()
    .references((): AnyPgColumn => actors.id),
  name: text("name").notNull(),
  ...timestamps(),
});

export const people = pgTable("people", {
  id: uuid("id").defaultRandom().primaryKey(),
  actorId: uuid("actor_id")
    .notNull()
    .references(() => actors.id),
  email: text("email"),
  profile: jsonb("profile")
    .$type<PersonProfile>()
    .notNull()
    .default(sql`'{}'::jsonb`),
  membershipSpaceIds: uuid("membership_space_ids")
    .array()
    .notNull()
    .default(sql`'{}'::uuid[]`),
  reputation: jsonb("reputation")
    .$type<Record<string, number>>()
    .notNull()
    .default(sql`'{}'::jsonb`),
});

export const agents = pgTable("agents", {
  id: uuid("id").defaultRandom().primaryKey(),
  actorId: uuid("actor_id")
    .notNull()
    .references(() => actors.id),
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => actors.id),
  organizationIds: uuid("organization_ids")
    .array()
    .notNull()
    .default(sql`'{}'::uuid[]`),
  role: text("role"),
  harness: jsonb("harness").$type<Harness>().notNull(),
  skillIds: uuid("skill_ids").array().notNull().default(sql`'{}'::uuid[]`),
  capabilityIds: uuid("capability_ids")
    .array()
    .notNull()
    .default(sql`'{}'::uuid[]`),
  permissions: uuid("permissions")
    .array()
    .notNull()
    .default(sql`'{}'::uuid[]`),
  autonomy: autonomyEnum("autonomy").notNull().default("approve"),
  budget: numeric("budget"),
  heartbeat: jsonb("heartbeat")
    .$type<{ enabled: boolean; cron: string | null; quietHours: string | null }>()
    .notNull()
    .default(sql`'{"enabled":false,"cron":null,"quietHours":null}'::jsonb`),
  availability: availabilityEnum("availability").notNull().default("offline"),
  performance: jsonb("performance")
    .$type<Record<string, number>>()
    .notNull()
    .default(sql`'{}'::jsonb`),
  ...timestamps(),
});

export const organizations = pgTable("organizations", {
  id: uuid("id").defaultRandom().primaryKey(),
  spaceId: uuid("space_id")
    .notNull()
    .references(() => spaces.id),
  dream: text("dream").notNull().default(""),
  blueprint: jsonb("blueprint")
    .$type<Record<string, unknown>>()
    .notNull()
    .default(sql`'{}'::jsonb`),
  enabledAppIds: uuid("enabled_app_ids")
    .array()
    .notNull()
    .default(sql`'{}'::uuid[]`),
  treasuryId: uuid("treasury_id"),
  reputation: jsonb("reputation")
    .$type<Record<string, number>>()
    .notNull()
    .default(sql`'{}'::jsonb`),
  ...timestamps(),
});

export const roles = pgTable(
  "roles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    actorId: uuid("actor_id")
      .notNull()
      .references(() => actors.id),
    spaceId: uuid("space_id")
      .notNull()
      .references(() => spaces.id),
    kind: roleKindEnum("kind").notNull(),
    title: text("title"),
    ...timestamps(),
  },
  (table) => [
    index("roles_actor_id_idx").on(table.actorId),
    index("roles_space_id_idx").on(table.spaceId),
  ],
);

export const organicCharts = pgTable("organic_charts", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  name: text("name").notNull(),
  rootPositionId: uuid("root_position_id"),
  ...timestamps(),
});

export const positions = pgTable("positions", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  chartId: uuid("chart_id")
    .notNull()
    .references(() => organicCharts.id),
  title: text("title").notNull(),
  parentPositionId: uuid("parent_position_id").references(
    (): AnyPgColumn => positions.id,
  ),
  holderActorId: uuid("holder_actor_id").references(() => actors.id),
  ...timestamps(),
});

export const goals = pgTable("goals", {
  id: uuid("id").defaultRandom().primaryKey(),
  spaceId: uuid("space_id")
    .notNull()
    .references(() => spaces.id),
  parentGoalId: uuid("parent_goal_id").references((): AnyPgColumn => goals.id),
  title: text("title").notNull(),
  status: goalStatusEnum("status").notNull().default("active"),
  ...timestamps(),
});

export const projects = pgTable("projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  goalId: uuid("goal_id").references(() => goals.id),
  title: text("title").notNull(),
  ...timestamps(),
});

export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    spaceId: uuid("space_id")
      .notNull()
      .references(() => spaces.id),
    projectId: uuid("project_id").references(() => projects.id),
    listId: uuid("list_id").references(() => taskLists.id),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    status: taskStatusEnum("status").notNull().default("created"),
    assigneeActorIds: uuid("assignee_actor_ids")
      .array()
      .notNull()
      .default(sql`'{}'::uuid[]`),
    targetType: taskTargetTypeEnum("target_type").notNull().default("human"),
    requiredCapabilityIds: uuid("required_capability_ids")
      .array()
      .notNull()
      .default(sql`'{}'::uuid[]`),
    outcome: jsonb("outcome").$type<Record<string, unknown>>(),
    dueDate: timestamp("due_date", { mode: "string", withTimezone: true }),
    position: integer("position").notNull().default(0),
    ...timestamps(),
  },
  (table) => [
    index("tasks_space_id_idx").on(table.spaceId),
    index("tasks_list_id_idx").on(table.listId),
  ],
);

export const taskLists = pgTable("task_lists", {
  id: uuid("id").defaultRandom().primaryKey(),
  spaceId: uuid("space_id")
    .notNull()
    .references(() => spaces.id),
  name: text("name").notNull(),
  position: integer("position").notNull().default(0),
  ...timestamps(),
});

export const taskAttachments = pgTable("task_attachments", {
  id: uuid("id").defaultRandom().primaryKey(),
  taskId: uuid("task_id")
    .notNull()
    .references(() => tasks.id),
  name: text("name").notNull(),
  mimeType: text("mime_type").notNull().default("application/octet-stream"),
  size: integer("size").notNull().default(0),
  data: text("data").notNull(),
  ...timestamps(),
});

export const skills = pgTable("skills", {
  id: uuid("id").defaultRandom().primaryKey(),
  ownerActorId: uuid("owner_actor_id").references(() => actors.id),
  ownerOrganizationId: uuid("owner_organization_id").references(
    () => organizations.id,
  ),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  version: text("version").notNull().default("1.0.0"),
  inputs: jsonb("inputs")
    .$type<Record<string, unknown>>()
    .notNull()
    .default(sql`'{}'::jsonb`),
  outputs: jsonb("outputs")
    .$type<Record<string, unknown>>()
    .notNull()
    .default(sql`'{}'::jsonb`),
  prerequisites: uuid("prerequisites")
    .array()
    .notNull()
    .default(sql`'{}'::uuid[]`),
  allowedCapabilityIds: uuid("allowed_capability_ids")
    .array()
    .notNull()
    .default(sql`'{}'::uuid[]`),
  evaluationCriteria: jsonb("evaluation_criteria")
    .$type<string[]>()
    .notNull()
    .default(sql`'[]'::jsonb`),
  provenance: jsonb("provenance").$type<Provenance>().notNull(),
  status: skillStatusEnum("status").notNull().default("draft"),
  ...timestamps(),
});

export const connectors = pgTable("connectors", {
  id: uuid("id").defaultRandom().primaryKey(),
  provider: connectorProviderEnum("provider").notNull(),
  type: connectorTypeEnum("type").notNull().default("channel"),
  ownerActorId: uuid("owner_actor_id").references(() => actors.id),
  ownerOrganizationId: uuid("owner_organization_id").references(
    () => organizations.id,
  ),
  capabilities: jsonb("capabilities")
    .$type<string[]>()
    .notNull()
    .default(sql`'[]'::jsonb`),
  credentialRef: jsonb("credential_ref").$type<SecretRef>().notNull(),
  scopes: jsonb("scopes")
    .$type<string[]>()
    .notNull()
    .default(sql`'[]'::jsonb`),
  configuration: jsonb("configuration")
    .$type<Record<string, unknown>>()
    .notNull()
    .default(sql`'{}'::jsonb`),
  status: connectorStatusEnum("status").notNull().default("disconnected"),
  ...timestamps(),
});

export const capabilities = pgTable("capabilities", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  skillId: uuid("skill_id")
    .notNull()
    .references(() => skills.id),
  connectorId: uuid("connector_id")
    .notNull()
    .references(() => connectors.id),
  policyIds: uuid("policy_ids").array().notNull().default(sql`'{}'::uuid[]`),
  context: jsonb("context")
    .$type<Record<string, unknown>>()
    .notNull()
    .default(sql`'{}'::jsonb`),
  spaceId: uuid("space_id")
    .notNull()
    .references(() => spaces.id),
  ...timestamps(),
});

export const policies = pgTable("policies", {
  id: uuid("id").defaultRandom().primaryKey(),
  spaceId: uuid("space_id")
    .notNull()
    .references(() => spaces.id),
  name: text("name").notNull(),
  capability: text("capability").notNull(),
  resource: text("resource").notNull().default("*"),
  minRole: roleKindEnum("min_role"),
  riskThreshold: numeric("risk_threshold").notNull().default("0.5"),
  decision: policyDecisionEnum("decision").notNull(),
});

export const events = pgTable(
  "events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    type: text("type").notNull(),
    spaceId: uuid("space_id"),
    actorId: uuid("actor_id"),
    idempotencyKey: text("idempotency_key").notNull().unique(),
    payload: jsonb("payload")
      .$type<Record<string, unknown>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    occurredAt: timestamp("occurred_at", { mode: "string", withTimezone: true })
      .notNull()
      .defaultNow(),
    delivered: boolean("delivered").notNull().default(false),
  },
  (table) => [index("events_type_idx").on(table.type)],
);

export const auditLog = pgTable("audit_log", {
  id: uuid("id").defaultRandom().primaryKey(),
  spaceId: uuid("space_id"),
  actorId: uuid("actor_id"),
  action: text("action").notNull(),
  resource: text("resource").notNull(),
  resourceId: uuid("resource_id"),
  metadata: jsonb("metadata")
    .$type<Record<string, unknown>>()
    .notNull()
    .default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at", { mode: "string", withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const secrets = pgTable("secrets", {
  id: uuid("id").defaultRandom().primaryKey(),
  ref: text("ref").notNull().unique(),
  scope: secretScopeEnum("scope").notNull(),
  ownerActorId: uuid("owner_actor_id"),
  ownerOrganizationId: uuid("owner_organization_id"),
  ciphertext: text("ciphertext").notNull(),
  ...timestamps(),
});

export const channels = pgTable("channels", {
  id: uuid("id").defaultRandom().primaryKey(),
  spaceId: uuid("space_id")
    .notNull()
    .references(() => spaces.id),
  name: text("name").notNull(),
  kind: text("kind").notNull(),
  ...timestamps(),
});

export const conversations = pgTable("conversations", {
  id: uuid("id").defaultRandom().primaryKey(),
  spaceId: uuid("space_id")
    .notNull()
    .references(() => spaces.id),
  channelId: uuid("channel_id").references(() => channels.id),
  title: text("title"),
  ...timestamps(),
});

export const messages = pgTable("messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  conversationId: uuid("conversation_id")
    .notNull()
    .references(() => conversations.id),
  actorId: uuid("actor_id"),
  content: text("content").notNull(),
  ...timestamps(),
});

export const memories = pgTable(
  "memories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    scope: text("scope").notNull(),
    ownerId: uuid("owner_id").notNull(),
    content: jsonb("content").$type<Record<string, unknown>>().notNull(),
    sourceEventId: uuid("source_event_id"),
    provenance: jsonb("provenance").$type<Provenance>().notNull(),
    ...timestamps(),
  },
  (table) => [
    index("memories_scope_owner_id_idx").on(table.scope, table.ownerId),
  ],
);

export const knowledgeEntities = pgTable("knowledge_entities", {
  id: uuid("id").defaultRandom().primaryKey(),
  type: text("type").notNull(),
  name: text("name").notNull(),
  properties: jsonb("properties")
    .$type<Record<string, unknown>>()
    .notNull()
    .default(sql`'{}'::jsonb`),
  ...timestamps(),
});

export const knowledgeEdges = pgTable(
  "knowledge_edges",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sourceId: uuid("source_id").notNull(),
    targetId: uuid("target_id").notNull(),
    relation: text("relation").notNull(),
    validFrom: timestamp("valid_from", { mode: "string", withTimezone: true })
      .notNull()
      .defaultNow(),
    validTo: timestamp("valid_to", { mode: "string", withTimezone: true }),
    provenance: jsonb("provenance").$type<Provenance>().notNull(),
    ...timestamps(),
  },
  (table) => [
    index("knowledge_edges_source_id_idx").on(table.sourceId),
    index("knowledge_edges_target_id_idx").on(table.targetId),
  ],
);

export const reputationEntries = pgTable(
  "reputation_entries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    actorId: uuid("actor_id").notNull(),
    capability: text("capability").notNull(),
    score: numeric("score").notNull(),
    evidence: jsonb("evidence")
      .$type<{
        taskId?: string | null;
        outcome: Record<string, unknown>;
        feedback?: number | null;
        verified: boolean;
      }>()
      .notNull(),
    provenance: jsonb("provenance").$type<Provenance>().notNull(),
    ...timestamps(),
  },
  (table) => [
    index("reputation_entries_actor_capability_idx").on(
      table.actorId,
      table.capability,
    ),
  ],
);

export const treasuryAccounts = pgTable("treasury_accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull(),
  currency: text("currency").notNull().default("USD"),
  balance: numeric("balance").notNull().default("0"),
});

export const treasuryLedger = pgTable("treasury_ledger", {
  id: uuid("id").defaultRandom().primaryKey(),
  accountId: uuid("account_id").notNull(),
  entryType: text("entry_type").notNull(),
  amount: numeric("amount").notNull(),
  description: text("description"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { mode: "string", withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const treasuryProposals = pgTable("treasury_proposals", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  amount: numeric("amount").notNull(),
  status: text("status").notNull().default("proposed"),
  proposedByActorId: uuid("proposed_by_actor_id").notNull(),
  ...timestamps(),
});

export const contributionCredits = pgTable("contribution_credits", {
  id: uuid("id").defaultRandom().primaryKey(),
  actorId: uuid("actor_id").notNull(),
  organizationId: uuid("organization_id").notNull(),
  capability: text("capability").notNull(),
  amount: numeric("amount").notNull(),
  createdAt: timestamp("created_at", { mode: "string", withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const distributionRules = pgTable("distribution_rules", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull(),
  capability: text("capability").notNull(),
  share: numeric("share").notNull(),
  ...timestamps(),
});

export const sessions = pgTable("sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  actorId: uuid("actor_id"),
  tokenHash: text("token_hash").notNull(),
  expiresAt: timestamp("expires_at", { mode: "string", withTimezone: true }),
  createdAt: timestamp("created_at", { mode: "string", withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    personId: uuid("person_id").notNull(),
    actorId: uuid("actor_id").notNull(),
    email: text("email").unique(),
    passwordHash: text("password_hash"),
    provider: text("provider"),
    providerId: text("provider_id"),
    ...timestamps(),
  },
  (table) => ({
    providerIdx: index("users_provider_idx").on(
      table.provider,
      table.providerId,
    ),
  }),
);

export const schema = {
  actors,
  spaces,
  people,
  agents,
  organizations,
  roles,
  organicCharts,
  positions,
  goals,
  projects,
  tasks,
  taskLists,
  taskAttachments,
  skills,
  connectors,
  capabilities,
  policies,
  events,
  auditLog,
  secrets,
  channels,
  conversations,
  messages,
  memories,
  knowledgeEntities,
  knowledgeEdges,
  reputationEntries,
  treasuryAccounts,
  treasuryLedger,
  treasuryProposals,
  contributionCredits,
  distributionRules,
  sessions,
  users,
};

export type Schema = typeof schema;
