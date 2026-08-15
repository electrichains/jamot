import { z } from "zod";
import type { FastifyInstance } from "fastify";
import { AutonomyLevel, Harness, Id } from "@jamot/contracts";
import type { JamotRepository } from "@jamot/core/repository";
import {
  assertSafeMcpUrl,
  createMcpClient,
  importExternalAgent,
} from "@jamot/core/mcp";
import { requireAuth } from "../rbac.js";
import { fail, parse } from "../util.js";

export interface AgentsRoutesOptions {
  repository: JamotRepository;
}

const CreateAgentBody = z.object({
  name: z.string().min(1),
  ownerId: Id,
  harness: Harness,
  autonomy: AutonomyLevel.optional(),
  role: z.string().nullable().optional(),
  organizationIds: z.array(Id).optional(),
  availability: z.enum(["available", "busy", "offline"]).optional(),
});

const ImportMcpBody = z.object({
  name: z.string().min(1),
  mcpUrl: z.string().url(),
});

export default async function agentsRoutes(
  app: FastifyInstance,
  opts: AgentsRoutesOptions,
): Promise<void> {
  const { repository } = opts;

  app.post("/agents", { preHandler: requireAuth }, async (request, reply) => {
    const body = parse(CreateAgentBody, request.body, reply);
    if (!body) return;

    const actor = await repository.createActor({
      type: "agent",
      source: "internal",
      displayName: body.name,
    });

    const agent = await repository.createAgent({
      actorId: actor.id,
      ownerId: body.ownerId,
      role: body.role ?? null,
      organizationIds: body.organizationIds ?? [],
      harness: body.harness,
      autonomy: body.autonomy ?? "approve",
      availability: body.availability ?? "available",
    });

    reply.code(201);
    return agent;
  });

  app.get("/agents", { preHandler: requireAuth }, async () => {
    return { items: await repository.listAgents() };
  });

  app.get("/agents/:id", { preHandler: requireAuth }, async (request, reply) => {
    const params = request.params as { id?: string };
    const id = parse(Id, params.id, reply);
    if (!id) return;
    const agent = await repository.getAgent(id);
    if (!agent) return fail(reply, 404, "agent not found");
    return agent;
  });

  app.post(
    "/agents/import-mcp",
    { preHandler: requireAuth },
    async (request, reply) => {
      const body = parse(ImportMcpBody, request.body, reply);
      if (!body) return;

      const ownerId = request.session.actorId;
      if (!ownerId) return fail(reply, 401, "Unauthenticated");

      try {
        assertSafeMcpUrl(body.mcpUrl);
      } catch (err) {
        return fail(reply, 400, err instanceof Error ? err.message : "invalid mcp url");
      }

      const client = createMcpClient(body.mcpUrl);
      const agent = await importExternalAgent({
        repo: repository,
        client,
        name: body.name,
        mcpUrl: body.mcpUrl,
        ownerId,
      });

      reply.code(201);
      return agent;
    },
  );
}
