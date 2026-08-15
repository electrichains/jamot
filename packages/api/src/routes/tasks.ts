import { z } from "zod";
import type { FastifyInstance } from "fastify";
import { Id } from "@jamot/contracts";
import type { JamotRepository } from "../repository.js";
import { createRbac, requireAuth } from "../rbac.js";
import { fail, parse } from "../util.js";

const CreateTaskBody = z.object({
  spaceId: Id,
  title: z.string().min(1),
  description: z.string().optional(),
  projectId: Id.nullable().optional(),
  assigneeActorIds: z.array(Id).optional(),
  targetType: z
    .enum(["human", "agent", "human_agent", "organization", "external"])
    .optional(),
});

const UpdateTaskStatusBody = z.object({
  status: z.enum(["created", "assigned", "started", "completed", "cancelled"]),
});

export function tasksRoutes(repo: JamotRepository) {
  const { requireSpaceAccess } = createRbac(repo);

  return async function (app: FastifyInstance): Promise<void> {
    app.post("/tasks", { preHandler: requireSpaceAccess("spaceId") }, async (request, reply) => {
      const body = parse(CreateTaskBody, request.body, reply);
      if (!body) return;

      const task = await repo.createTask({
        spaceId: body.spaceId,
        title: body.title,
        description: body.description,
        projectId: body.projectId ?? null,
        assigneeActorIds: body.assigneeActorIds ?? [],
        targetType: body.targetType,
      });

      reply.code(201);
      return task;
    });

    app.get("/tasks", { preHandler: requireAuth }, async (request, reply) => {
      const query = request.query as { spaceId?: string };
      if (query.spaceId) {
        const spaceId = parse(Id, query.spaceId, reply);
        if (!spaceId) return;
        return { items: await repo.listTasks({ spaceId }) };
      }
      return { items: await repo.listTasks() };
    });

    app.get("/tasks/:id", { preHandler: requireAuth }, async (request, reply) => {
      const params = request.params as { id?: string };
      const id = parse(Id, params.id, reply);
      if (!id) return;
      const task = await repo.getTask(id);
      if (!task) return fail(reply, 404, "task not found");
      return task;
    });

    app.patch("/tasks/:id/status", { preHandler: requireAuth }, async (request, reply) => {
      const params = request.params as { id?: string };
      const id = parse(Id, params.id, reply);
      if (!id) return;
      const body = parse(UpdateTaskStatusBody, request.body, reply);
      if (!body) return;

      const task = await repo.getTask(id);
      if (!task) return fail(reply, 404, "task not found");

      const actorId = request.session.actorId!;
      const roles = await repo.listRolesForActor(actorId);
      const space = await repo.getSpace(task.spaceId);
      const ownsSpace = space && space.ownerActorId === actorId;
      const hasRole = roles.some((r) => r.spaceId === task.spaceId);
      if (!ownsSpace && !hasRole) return fail(reply, 403, "no access to task space");

      const updated = await repo.updateTaskStatus(id, body.status);
      if (!updated) return fail(reply, 404, "task not found");
      return updated;
    });
  };
}
