import { z } from "zod";
import { EntityBase, Id } from "./common.js";

export const TaskStatus = z.enum([
  "created",
  "assigned",
  "started",
  "completed",
  "cancelled",
]);
export type TaskStatus = z.infer<typeof TaskStatus>;

export const TaskTargetType = z.enum([
  "human",
  "agent",
  "human_agent",
  "organization",
  "external",
]);
export type TaskTargetType = z.infer<typeof TaskTargetType>;

export const Goal = EntityBase.extend({
  spaceId: Id,
  parentGoalId: Id.nullable(),
  title: z.string().min(1),
  status: z.enum(["active", "done", "archived"]).default("active"),
});
export type Goal = z.infer<typeof Goal>;

export const Project = EntityBase.extend({
  organizationId: Id,
  goalId: Id.nullable(),
  title: z.string().min(1),
});
export type Project = z.infer<typeof Project>;

/** A concrete unit of work assigned to an Actor. */
export const Task = EntityBase.extend({
  spaceId: Id,
  projectId: Id.nullable(),
  title: z.string().min(1),
  description: z.string().default(""),
  status: TaskStatus.default("created"),
  /** Actors the task is (or will be) assigned to. */
  assigneeActorIds: z.array(Id).default([]),
  targetType: TaskTargetType.default("human"),
  requiredCapabilityIds: z.array(Id).default([]),
  outcome: z.record(z.string(), z.unknown()).nullable(),
});
export type Task = z.infer<typeof Task>;
