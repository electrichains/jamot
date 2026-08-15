import { createHash, randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import type { Actor, Person, Space } from "@jamot/contracts";
import type { FastifySessionOptions } from "@fastify/session";
import type { JamotRepository } from "./repository.js";

const KEY_LENGTH = 64;

function scryptAsync(password: string, salt: string, keylen: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCb(password, salt, keylen, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey);
    });
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("base64");
  const derived = await scryptAsync(password, salt, KEY_LENGTH);
  return `${salt}:${derived.toString("base64")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const expected = Buffer.from(hash, "base64");
  const derived = await scryptAsync(password, salt, KEY_LENGTH);
  if (derived.length !== expected.length) return false;
  return timingSafeEqual(derived, expected);
}

export function sessionOptions(secret: string): FastifySessionOptions {
  const key = secret.length >= 32 ? secret : createHash("sha256").update(secret).digest("hex");
  return {
    secret: key,
    cookieName: "jamot_session",
    saveUninitialized: false,
    cookie: {
      secure: "auto",
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  };
}

export interface RegisterInput {
  email: string;
  password: string;
  displayName?: string;
}

export interface RegisterResult {
  actor: Actor;
  person: Person;
  space: Space;
}

export async function registerPerson(
  repo: JamotRepository,
  input: RegisterInput,
): Promise<RegisterResult> {
  const displayName = input.displayName ?? input.email.split("@")[0] ?? input.email;
  const actor = await repo.createActor({ type: "human", displayName });
  const space = await repo.createSpace({ kind: "personal", ownerActorId: actor.id, name: displayName });
  const actorWithSpace = await repo.updateActor(actor.id, { personalSpaceId: space.id });
  const person = await repo.createPerson({
    actorId: actor.id,
    email: input.email.toLowerCase(),
    membershipSpaceIds: [space.id],
  });
  const passwordHash = await hashPassword(input.password);
  await repo.createUser({ person, actor: actorWithSpace ?? actor, passwordHash });
  await repo.createRole({ actorId: actor.id, spaceId: space.id, kind: "owner" });
  return { actor: actorWithSpace ?? actor, person, space };
}
