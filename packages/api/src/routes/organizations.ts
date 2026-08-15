import { z } from "zod";
import type { FastifyInstance } from "fastify";
import { Id } from "@jamot/contracts";
import type { JamotRepository } from "../repository.js";
import { requireAuth } from "../rbac.js";
import { fail, parse } from "../util.js";

const CreateOrganizationBody = z.object({
  name: z.string().min(1),
  dream: z.string().optional(),
});

export function organizationsRoutes(repo: JamotRepository) {
  return async function (app: FastifyInstance): Promise<void> {
    app.post("/organizations", { preHandler: requireAuth }, async (request, reply) => {
      const body = parse(CreateOrganizationBody, request.body, reply);
      if (!body) return;

      const actorId = request.session.actorId!;
      const space = await repo.createSpace({
        kind: "organization",
        ownerActorId: actorId,
        name: body.name,
      });
      const organization = await repo.createOrganization({
        spaceId: space.id,
        dream: body.dream,
      });
      await repo.createRole({ actorId, spaceId: space.id, kind: "owner" });

      reply.code(201);
      return { organization, space };
    });

    app.get("/organizations", { preHandler: requireAuth }, async () => {
      return { items: await repo.listOrganizations() };
    });

    app.get("/organizations/:id", { preHandler: requireAuth }, async (request, reply) => {
      const params = request.params as { id?: string };
      const id = parse(Id, params.id, reply);
      if (!id) return;
      const organization = await repo.getOrganization(id);
      if (!organization) return fail(reply, 404, "organization not found");
      return organization;
    });
  };
}
