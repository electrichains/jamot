import type { Actor, Id, Person } from "@jamot/contracts";

declare module "fastify" {
  interface Session {
    actorId?: Id;
    personId?: Id;
  }

  interface FastifyRequest {
    actor: Actor | null;
    person: Person | null;
  }
}

export {};
