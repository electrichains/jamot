import { z } from "zod";
import { EntityBase, Id } from "./common.js";

/** Replaceable runtime harness. */
export const HarnessKind = z.enum([
  "hermes",
  "openclaw",
  "openmanus",
  "opencode",
  "codex",
  "generic_http",
  "mcp",
]);
export type HarnessKind = z.infer<typeof HarnessKind>;

export const Harness = z.object({
  kind: HarnessKind,
  /** MCP endpoint URL or generic HTTP endpoint for the harness. */
  endpoint: z.string().url().nullable(),
  config: z.record(z.string(), z.unknown()).default({}),
});
export type Harness = z.infer<typeof Harness>;

export const AutonomyLevel = z.enum(["suggest", "approve", "autonomous"]);
export type AutonomyLevel = z.infer<typeof AutonomyLevel>;

/** An Agent is an Actor, not merely a runtime. */
export const Agent = EntityBase.extend({
  actorId: Id,
  ownerId: Id,
  organizationIds: z.array(Id).default([]),
  role: z.string().nullable(),
  harness: Harness,
  skillIds: z.array(Id).default([]),
  capabilityIds: z.array(Id).default([]),
  permissions: z.array(Id).default([]),
  autonomy: AutonomyLevel.default("approve"),
  budget: z.number().min(0).nullable(),
  heartbeat: z
    .object({
      enabled: z.boolean().default(false),
      cron: z.string().nullable(),
      quietHours: z.string().nullable(),
    })
    .default({ enabled: false, cron: null, quietHours: null }),
  availability: z.enum(["available", "busy", "offline"]).default("offline"),
  performance: z.record(z.string(), z.number()).default({}),
});
export type Agent = z.infer<typeof Agent>;
