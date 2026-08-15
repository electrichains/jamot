import type { FastifyReply, FastifyRequest } from "fastify";
import type { Id } from "@jamot/contracts";
import type { JamotRepository, RoleKind } from "./repository.js";

export const ROLE_WEIGHT: Record<RoleKind, number> = {
  owner: 5,
  admin: 4,
  member: 3,
  agent: 2,
  external: 1,
};

export function deny(
  reply: FastifyReply,
  message = "Forbidden",
  code: number = 403,
): FastifyReply {
  return reply.code(code).send({ error: message });
}

export async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<FastifyReply | void> {
  if (!request.session.actorId) {
    return reply.code(401).send({ error: "Unauthenticated" });
  }
}

export async function actorRoleInSpace(
  repo: JamotRepository,
  actorId: Id,
  spaceId: Id,
): Promise<RoleKind | null> {
  const space = await repo.getSpace(spaceId);
  if (space && space.ownerActorId === actorId) return "owner";
  const roles = await repo.listRolesForActor(actorId);
  const inSpace = roles.filter((r) => r.spaceId === spaceId);
  if (inSpace.length === 0) return null;
  return inSpace.reduce<RoleKind>(
    (max, r) => (ROLE_WEIGHT[r.kind] > ROLE_WEIGHT[max] ? r.kind : max),
    inSpace[0]!.kind,
  );
}

function resolveSpaceId(request: FastifyRequest, source: string): string | undefined {
  const params = request.params as Record<string, unknown> | undefined;
  const query = request.query as Record<string, unknown> | undefined;
  const body = request.body as Record<string, unknown> | null | undefined;
  if (params && typeof params[source] === "string") return params[source];
  if (query && typeof query[source] === "string") return query[source];
  if (body && typeof body[source] === "string") return body[source];
  return undefined;
}

export function createRbac(repo: JamotRepository) {
  const requireRole = (minRole: RoleKind, spaceSource = "spaceId") =>
    async (request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply | void> => {
      const actorId = request.session.actorId;
      if (!actorId) return deny(reply, "Unauthenticated", 401);
      const spaceId = resolveSpaceId(request, spaceSource);
      if (!spaceId) return deny(reply, "spaceId is required", 400);
      const role = await actorRoleInSpace(repo, actorId, spaceId as Id);
      if (!role || ROLE_WEIGHT[role] < ROLE_WEIGHT[minRole]) {
        return deny(reply, `Requires role ${minRole} or higher`, 403);
      }
    };

  const requireSpaceAccess = (spaceSource = "spaceId") =>
    async (request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply | void> => {
      const actorId = request.session.actorId;
      if (!actorId) return deny(reply, "Unauthenticated", 401);
      const spaceId = resolveSpaceId(request, spaceSource);
      if (!spaceId) return deny(reply, "spaceId is required", 400);
      const role = await actorRoleInSpace(repo, actorId, spaceId as Id);
      if (!role) return deny(reply, "No access to this space", 403);
    };

  return { requireRole, requireSpaceAccess };
}
