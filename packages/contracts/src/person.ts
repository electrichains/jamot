import { z } from "zod";
import { Id, Provenance } from "./common.js";

/**
 * A person's profile is layered and every derived attribute is provable.
 * Nothing here is a "fact" unless the source says so.
 */
export const ProfileAttribute = Provenance.extend({
  value: z.unknown(),
});

export const PersonProfile = z.object({
  selfDescribed: z.record(z.string(), ProfileAttribute).default({}),
  integral: z.record(z.string(), ProfileAttribute).default({}),
  skills: z.array(z.string()).default([]),
  preferences: z.record(z.string(), ProfileAttribute).default({}),
  goals: z.array(z.string()).default([]),
});

export const Person = z.object({
  id: Id,
  actorId: Id,
  email: z.string().email().nullable(),
  profile: PersonProfile,
  /** Space IDs this person participates in (organizations + personal). */
  membershipSpaceIds: z.array(Id).default([]),
  reputation: z.record(z.string(), z.number()).default({}),
});
export type Person = z.infer<typeof Person>;
export type PersonProfile = z.infer<typeof PersonProfile>;

/** Privacy/consent controls — the person owns their data. */
export const Consent = z.object({
  exportEnabled: z.boolean().default(true),
  visibility: z.enum(["private", "org", "public"]).default("private"),
  allowInference: z.boolean().default(true),
});
export type Consent = z.infer<typeof Consent>;
