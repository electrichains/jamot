import { z } from "zod";
import type { FastifyInstance } from "fastify";
import { Id } from "@jamot/contracts";
import type { Provenance } from "@jamot/contracts";
import { requireAuth } from "../rbac.js";
import { fail, parse } from "../util.js";
import type { RoutesOptions } from "./types.js";

const ProvenanceInput = z.object({
  source: z
    .enum([
      "self_declared",
      "assessment",
      "observed",
      "manager_feedback",
      "inferred",
      "system",
    ])
    .optional(),
  confidence: z.number().min(0).max(1).optional(),
});

const CreateSkillBody = z.object({
  ownerActorId: Id.nullable().optional(),
  ownerOrganizationId: Id.nullable().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  version: z.string().optional(),
  inputs: z.record(z.string(), z.unknown()).optional(),
  outputs: z.record(z.string(), z.unknown()).optional(),
  prerequisites: z.array(Id).optional(),
  allowedCapabilityIds: z.array(Id).optional(),
  evaluationCriteria: z.array(z.string()).optional(),
  provenance: ProvenanceInput.optional(),
  status: z.enum(["draft", "validated", "deprecated"]).optional(),
});

function buildProvenance(input: z.infer<typeof ProvenanceInput> | undefined): Provenance {
  const ts = new Date().toISOString();
  return {
    source: input?.source ?? "self_declared",
    confidence: input?.confidence ?? 0.5,
    createdAt: ts,
    updatedAt: ts,
  };
}

export default async function skillsRoutes(
  app: FastifyInstance,
  opts: RoutesOptions,
): Promise<void> {
  const { repository } = opts;

  app.post("/skills", { preHandler: requireAuth }, async (request, reply) => {
    const body = parse(CreateSkillBody, request.body, reply);
    if (!body) return;

    const skill = await repository.createSkill({
      ownerActorId: body.ownerActorId ?? null,
      ownerOrganizationId: body.ownerOrganizationId ?? null,
      name: body.name,
      description: body.description,
      version: body.version,
      inputs: body.inputs,
      outputs: body.outputs,
      prerequisites: body.prerequisites,
      allowedCapabilityIds: body.allowedCapabilityIds,
      evaluationCriteria: body.evaluationCriteria,
      provenance: buildProvenance(body.provenance),
      status: body.status,
    });

    reply.code(201);
    return skill;
  });

  app.get("/skills", { preHandler: requireAuth }, async (request, reply) => {
    const query = request.query as { ownerOrganizationId?: string };
    if (query.ownerOrganizationId) {
      const ownerOrganizationId = parse(Id, query.ownerOrganizationId, reply);
      if (!ownerOrganizationId) return;
      return { items: await repository.listSkills({ ownerOrganizationId }) };
    }
    return { items: await repository.listSkills() };
  });

  app.get("/skills/:id", { preHandler: requireAuth }, async (request, reply) => {
    const params = request.params as { id?: string };
    const id = parse(Id, params.id, reply);
    if (!id) return;
    const skill = await repository.getSkill(id);
    if (!skill) return fail(reply, 404, "skill not found");
    return skill;
  });
}
