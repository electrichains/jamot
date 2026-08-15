import { z } from "zod";
import type { FastifyInstance } from "fastify";
import { Id, ProfileAttribute } from "@jamot/contracts";
import type { JamotRepository } from "../repository.js";
import { registerPerson } from "../auth.js";
import { requireAuth } from "../rbac.js";
import { fail, parse } from "../util.js";

const RegisterBody = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(1).optional(),
});

const ProfileAttributePatch = z.object({
  value: z.unknown(),
  source: z
    .enum(["self_declared", "assessment", "observed", "manager_feedback", "inferred", "system"])
    .optional(),
  confidence: z.number().min(0).max(1).optional(),
});

const PersonPatch = z.object({
  email: z.string().email().nullable().optional(),
  profile: z
    .object({
      selfDescribed: z.record(z.string(), ProfileAttributePatch).optional(),
      integral: z.record(z.string(), ProfileAttributePatch).optional(),
      preferences: z.record(z.string(), ProfileAttributePatch).optional(),
      skills: z.array(z.string()).optional(),
      goals: z.array(z.string()).optional(),
    })
    .optional(),
});

function buildAttribute(input: z.infer<typeof ProfileAttributePatch>): z.infer<typeof ProfileAttribute> {
  const timestamp = new Date().toISOString();
  return {
    value: input.value,
    source: input.source ?? "self_declared",
    confidence: input.confidence ?? 0.5,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function peopleRoutes(repo: JamotRepository) {
  return async function (app: FastifyInstance): Promise<void> {
    app.post("/people", async (request, reply) => {
      const body = parse(RegisterBody, request.body, reply);
      if (!body) return;

      const existing = await repo.findUserByEmail(body.email.toLowerCase());
      if (existing) return fail(reply, 409, "email already registered");

      const result = await registerPerson(repo, {
        email: body.email,
        password: body.password,
        displayName: body.displayName,
      });

      reply.code(201);
      return { person: result.person, actor: result.actor, space: result.space };
    });

    app.get("/people", { preHandler: requireAuth }, async () => {
      return { items: await repo.listPeople() };
    });

    app.get("/people/:id", { preHandler: requireAuth }, async (request, reply) => {
      const params = request.params as { id?: string };
      const id = parse(Id, params.id, reply);
      if (!id) return;
      const person = await repo.getPerson(id);
      if (!person) return fail(reply, 404, "person not found");
      return person;
    });

    app.patch("/people/:id", { preHandler: requireAuth }, async (request, reply) => {
      const params = request.params as { id?: string };
      const id = parse(Id, params.id, reply);
      if (!id) return;
      const patch = parse(PersonPatch, request.body, reply);
      if (!patch) return;

      const actorId = request.session.actorId!;
      const existing = await repo.getPerson(id);
      if (!existing) return fail(reply, 404, "person not found");
      if (existing.actorId !== actorId) {
        return fail(reply, 403, "you can only update your own profile");
      }

      const profile = { ...existing.profile };
      if (patch.profile) {
        if (patch.profile.selfDescribed) {
          profile.selfDescribed = { ...profile.selfDescribed };
          for (const [key, value] of Object.entries(patch.profile.selfDescribed)) {
            profile.selfDescribed[key] = buildAttribute(value);
          }
        }
        if (patch.profile.integral) {
          profile.integral = { ...profile.integral };
          for (const [key, value] of Object.entries(patch.profile.integral)) {
            profile.integral[key] = buildAttribute(value);
          }
        }
        if (patch.profile.preferences) {
          profile.preferences = { ...profile.preferences };
          for (const [key, value] of Object.entries(patch.profile.preferences)) {
            profile.preferences[key] = buildAttribute(value);
          }
        }
        if (patch.profile.skills) profile.skills = patch.profile.skills;
        if (patch.profile.goals) profile.goals = patch.profile.goals;
      }

      const update: Record<string, unknown> = { profile };
      if (patch.email !== undefined) update.email = patch.email;

      const updated = await repo.updatePerson(id, update);
      if (!updated) return fail(reply, 404, "person not found");
      return updated;
    });
  };
}
