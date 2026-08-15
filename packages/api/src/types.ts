import type { Actor, Id, Person } from "@jamot/contracts";

declare module "fastify" {
  interface Session {
    actorId?: Id;
    personId?: Id;
    oauthState?: string;
  }

  interface FastifyRequest {
    actor: Actor | null;
    person: Person | null;
  }
}

export {};
