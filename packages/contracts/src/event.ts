import { z } from "zod";
import { Id, Timestamp } from "./common.js";

/**
 * Canonical record of something that happened. The event layer is the source
 * for downstream memory, analytics and audit.
 *
 * `type` is `domain.action` (e.g. `actor.created`, `member.joined`).
 */
export const EventType = z.string().regex(/^[a-z]+\.[a-z_]+$/);
export type EventType = z.infer<typeof EventType>;

export const Event = z.object({
  id: Id,
  type: EventType,
  /** Space that this event is scoped to (tenant isolation). */
  spaceId: Id.nullable(),
  /** Actor that caused the event, if any. */
  actorId: Id.nullable(),
  /** Deduplication key; consumers must be idempotent. */
  idempotencyKey: z.string(),
  payload: z.record(z.string(), z.unknown()).default({}),
  occurredAt: Timestamp,
  /** Delivered to downstream consumers. */
  delivered: z.boolean().default(false),
});
export type Event = z.infer<typeof Event>;

/** Well-known event types (non-exhaustive; new types are additive). */
export const KNOWN_EVENT_TYPES = [
  "actor.created",
  "actor.updated",
  "organization.created",
  "member.joined",
  "member.left",
  "conversation.created",
  "message.received",
  "message.sent",
  "task.created",
  "task.assigned",
  "task.started",
  "task.completed",
  "decision.proposed",
  "decision.approved",
  "decision.rejected",
  "skill.created",
  "skill.updated",
  "capability.granted",
  "capability.revoked",
  "memory.created",
  "memory.updated",
  "knowledge.created",
  "knowledge.invalidated",
  "reputation.updated",
  "treasury.contribution",
  "treasury.proposal",
  "treasury.payment",
  "blueprint.proposed",
  "blueprint.approved",
  "blueprint.changed",
] as const;
