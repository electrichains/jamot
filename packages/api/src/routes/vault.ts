import { z } from "zod";
import type { FastifyInstance } from "fastify";
import { ConnectorProvider, ConnectorType, Id } from "@jamot/contracts";
import { requireAuth } from "../rbac.js";
import { fail, parse } from "../util.js";
import type { RoutesOptions } from "./types.js";

const AddConnectionBody = z.object({
  provider: ConnectorProvider,
  type: ConnectorType.optional(),
  ref: z.string().min(1),
  scope: z.enum(["user", "organization", "system", "environment"]).optional(),
  ownerActorId: Id.nullable().optional(),
  ownerOrganizationId: Id.nullable().optional(),
  capabilities: z.array(z.string()).optional(),
  scopes: z.array(z.string()).optional(),
  configuration: z.record(z.string(), z.unknown()).optional(),
  secretPlaintext: z.string().min(1),
});

export default async function vaultRoutes(
  app: FastifyInstance,
  opts: RoutesOptions,
): Promise<void> {
  const { repository, secretStore } = opts;

  app.get("/vault", { preHandler: requireAuth }, async () => {
    const connectors = await repository.listConnectors();
    const secretRefs = [
      ...new Map(
        connectors.map((c) => [
          c.credentialRef.ref,
          { ref: c.credentialRef.ref, scope: c.credentialRef.scope },
        ]),
      ).values(),
    ];
    return { connectors, secretRefs };
  });

  app.post("/vault/connections", { preHandler: requireAuth }, async (request, reply) => {
    const body = parse(AddConnectionBody, request.body, reply);
    if (!body) return;

    const scope = body.scope ?? "system";
    await repository.putSecret({
      ref: body.ref,
      scope,
      ownerActorId: body.ownerActorId ?? null,
      ownerOrganizationId: body.ownerOrganizationId ?? null,
      ciphertext: secretStore.encrypt(body.secretPlaintext),
    });

    const connector = await repository.createConnector({
      provider: body.provider,
      type: body.type ?? "channel",
      ownerActorId: body.ownerActorId ?? null,
      ownerOrganizationId: body.ownerOrganizationId ?? null,
      capabilities: body.capabilities ?? [],
      credentialRef: { ref: body.ref, scope },
      scopes: body.scopes ?? [],
      configuration: body.configuration ?? {},
      status: "connected",
    });

    reply.code(201);
    return connector;
  });

  app.delete("/vault/connections/:ref", { preHandler: requireAuth }, async (request, reply) => {
    const params = request.params as { ref?: string };
    const ref = parse(z.string().min(1), params.ref, reply);
    if (!ref) return;
    await repository.deleteSecret(ref);
    return { status: "ok" };
  });
}
