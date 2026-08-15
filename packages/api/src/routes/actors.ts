import type { FastifyInstance } from "fastify";
import { Id } from "@jamot/contracts";
import type { JamotRepository } from "../repository.js";
import { requireAuth } from "../rbac.js";
import { fail, parse } from "../util.js";

export function actorsRoutes(repo: JamotRepository) {
  return async function (app: FastifyInstance): Promise<void> {
    app.get("/actors", { preHandler: requireAuth }, async () => {
      return { items: await repo.listActors() };
    });

    app.get("/actors/:id", { preHandler: requireAuth }, async (request, reply) => {
      const params = request.params as { id?: string };
      const id = parse(Id, params.id, reply);
      if (!id) return;
      const actor = await repo.getActor(id);
      if (!actor) return fail(reply, 404, "actor not found");
      return actor;
    });
  };
}
