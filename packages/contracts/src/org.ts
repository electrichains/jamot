import { z } from "zod";
import { EntityBase, Id, Timestamp } from "./common.js";

export const SpaceKind = z.enum(["personal", "organization"]);
export type SpaceKind = z.infer<typeof SpaceKind>;

/** Execution and ownership boundary. */
export const Space = EntityBase.extend({
  kind: SpaceKind,
  ownerActorId: Id,
  /** For personal spaces this is the person; for orgs the organization. */
  name: z.string().min(1),
});
export type Space = z.infer<typeof Space>;

export const Organization = EntityBase.extend({
  spaceId: Id,
  dream: z.string().default(""),
  blueprint: z.record(z.string(), z.unknown()).default({}),
  /** Ids of apps in the App Registry that are enabled/allocated for this org. */
  enabledAppIds: z.array(z.string()).default([]),
  treasuryId: Id.nullable(),
  reputation: z.record(z.string(), z.number()).default({}),
});
export type Organization = z.infer<typeof Organization>;

/** Relationship between an Actor and a Space. */
export const Role = EntityBase.extend({
  actorId: Id,
  spaceId: Id,
  kind: z.enum(["owner", "admin", "member", "agent", "external"]),
  title: z.string().nullable(),
});
export type Role = z.infer<typeof Role>;

/** A place in an Organization's OrganicChart. Binds one Human or Agent. */
export const Position = EntityBase.extend({
  organizationId: Id,
  chartId: Id,
  title: z.string().min(1),
  parentPositionId: Id.nullable(),
  /** The actor currently holding the position (human or agent). */
  holderActorId: Id.nullable(),
});
export type Position = z.infer<typeof Position>;

export const OrganicChart = EntityBase.extend({
  organizationId: Id,
  name: z.string().min(1),
  rootPositionId: Id.nullable(),
});
export type OrganicChart = z.infer<typeof OrganicChart>;

/** Role a human member can hold inside an organization. */
export const OrgMemberRoleKind = z.enum(["owner", "admin", "member"]);
export type OrgMemberRoleKind = z.infer<typeof OrgMemberRoleKind>;

/** A human member of an organization, for the team/member management UI. */
export const OrganizationMember = z.object({
  personId: Id,
  actorId: Id,
  email: z.string().email().nullable(),
  displayName: z.string(),
  kind: OrgMemberRoleKind,
  title: z.string().nullable(),
  membershipSince: Timestamp,
});
export type OrganizationMember = z.infer<typeof OrganizationMember>;

/** Body for allocating (enabling/disabling) apps on an organization. */
export const UpdateOrganizationApps = z.object({
  enabledAppIds: z.array(z.string()),
});
export type UpdateOrganizationApps = z.infer<typeof UpdateOrganizationApps>;
