import { z } from "zod";
import type { FastifyInstance } from "fastify";
import {
  Id,
  OrgMemberRoleKind,
  OrganizationMember,
  UpdateOrganizationApps,
} from "@jamot/contracts";
import type { OrganizationMember as OrganizationMemberType } from "@jamot/contracts";
import type { MemoryProvider } from "@jamot/core/memory";
import type { AppManifest, AppRegistry } from "@jamot/core/apps";
import type { JamotRepository, RoleKind } from "../repository.js";
import {
  ROLE_WEIGHT,
  actorRoleInSpace,
  createRbac,
  isSuperAdminUser,
  loadUser,
  requireAuth,
} from "../rbac.js";
import { fail, parse } from "../util.js";

const CreateOrganizationBody = z.object({
  name: z.string().min(1),
  dream: z.string().optional(),
});

const CreateWorkspaceBody = z.object({
  name: z.string().min(1),
});

const UpdateOrganizationBody = z.object({
  dream: z.string().min(1),
});

const AddMemberBody = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "member"]),
});

const UpdateMemberRoleBody = z.object({
  role: z.enum(["admin", "member"]),
});

function toHumanKind(kind: string): z.infer<typeof OrgMemberRoleKind> | null {
  return kind === "owner" || kind === "admin" || kind === "member" ? kind : null;
}

export interface OrganizationsRoutesOptions {
  memoryProvider: MemoryProvider;
  apps: AppRegistry;
}

type OrgListItem = {
  organization: NonNullable<Awaited<ReturnType<JamotRepository["getOrganization"]>>>;
  space: NonNullable<Awaited<ReturnType<JamotRepository["getSpace"]>>>;
  role: RoleKind | null;
  workspaces: Awaited<ReturnType<JamotRepository["listWorkspaces"]>>;
};

type AppsPayload = {
  organizationId: string;
  enabledAppIds: string[];
  apps: Array<AppManifest & { enabled: boolean }>;
};

export function organizationsRoutes(
  repo: JamotRepository,
  opts: OrganizationsRoutesOptions,
) {
  const writeOrgMemory = (
    organizationId: string,
    content: Record<string, unknown>,
  ): Promise<unknown> => {
    const ts = new Date().toISOString();
    return opts.memoryProvider.store({
      scope: "organization",
      ownerId: organizationId,
      content,
      provenance: {
        source: "system",
        confidence: 1,
        createdAt: ts,
        updatedAt: ts,
      },
    });
  };

  const appsPayload = (organizationId: string, enabledAppIds: string[]): AppsPayload => {
    const valid = enabledAppIds.filter((appId) => opts.apps.get(appId) !== null);
    return {
      organizationId,
      enabledAppIds: valid,
      apps: opts.apps.list().map((m) => ({ ...m, enabled: valid.includes(m.id) })),
    };
  };

  const buildMember = (
    person: NonNullable<Awaited<ReturnType<JamotRepository["getPerson"]>>>,
    actor: NonNullable<Awaited<ReturnType<JamotRepository["getActor"]>>>,
    kind: z.infer<typeof OrgMemberRoleKind>,
    title: string | null,
    membershipSince: string,
  ): OrganizationMemberType => ({
    personId: person.id,
    actorId: actor.id,
    email: person.email,
    displayName: actor.displayName,
    kind,
    title,
    membershipSince,
  });

  return async function (app: FastifyInstance): Promise<void> {
    const rbac = createRbac(repo);

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
      await repo.createWorkspace({
        organizationId: organization.id,
        spaceId: space.id,
        name: body.name,
      });
      await repo.createRole({ actorId, spaceId: space.id, kind: "owner" });

      const personId = request.session.personId;
      if (personId) {
        const person = await repo.getPerson(personId);
        if (person) {
          const membershipSpaceIds = [
            ...new Set([...(person.membershipSpaceIds ?? []), space.id]),
          ];
          await repo.updatePerson(person.id, { membershipSpaceIds });
        }
      }

      await writeOrgMemory(organization.id, {
        type: "organization.created",
        name: body.name,
        byActorId: actorId,
      });

      reply.code(201);
      return { organization, space };
    });

    app.get("/organizations", { preHandler: requireAuth }, async (request) => {
      const actorId = request.session.actorId!;
      const user = await loadUser(repo, actorId);
      const orgs = await repo.listOrganizations();

      const items: OrgListItem[] = [];

      for (const organization of orgs) {
        const space = await repo.getSpace(organization.spaceId);
        if (!space) continue;
        const workspaces = await repo.listWorkspaces(organization.id);
        if (isSuperAdminUser(user)) {
          const role = await actorRoleInSpace(
            repo,
            actorId as Id,
            organization.spaceId as Id,
          );
          items.push({ organization, space, role, workspaces });
          continue;
        }
        const role = await actorRoleInSpace(
          repo,
          actorId as Id,
          organization.spaceId as Id,
        );
        if (!role) continue;
        items.push({ organization, space, role, workspaces });
      }

      items.sort((a, b) => {
        const wa = a.role ? ROLE_WEIGHT[a.role] : 0;
        const wb = b.role ? ROLE_WEIGHT[b.role] : 0;
        if (wa !== wb) return wb - wa;
        return a.space.name.localeCompare(b.space.name);
      });

      return { items };
    });

    app.get(
      "/organizations/:id",
      { preHandler: rbac.requireOrgAccess("id") },
      async (request, reply) => {
        const params = request.params as { id?: string };
        const id = parse(Id, params.id, reply);
        if (!id) return;
        const organization = await repo.getOrganization(id);
        if (!organization) return fail(reply, 404, "organization not found");
        return organization;
      },
    );

    app.get(
      "/organizations/:id/workspaces",
      { preHandler: rbac.requireOrgAccess("id") },
      async (request, reply) => {
        const params = request.params as { id?: string };
        const id = parse(Id, params.id, reply);
        if (!id) return;
        const organization = await repo.getOrganization(id);
        if (!organization) return fail(reply, 404, "organization not found");
        return { items: await repo.listWorkspaces(id) };
      },
    );

    app.post(
      "/organizations/:id/workspaces",
      { preHandler: rbac.requireOrgAdmin("id") },
      async (request, reply) => {
        const params = request.params as { id?: string };
        const id = parse(Id, params.id, reply);
        if (!id) return;
        const organization = await repo.getOrganization(id);
        if (!organization) return fail(reply, 404, "organization not found");
        const body = parse(CreateWorkspaceBody, request.body, reply);
        if (!body) return;

        const actorId = request.session.actorId!;
        const space = await repo.createSpace({
          kind: "organization",
          ownerActorId: actorId,
          name: body.name,
        });
        const workspace = await repo.createWorkspace({
          organizationId: id,
          spaceId: space.id,
          name: body.name,
        });
        await repo.createRole({ actorId, spaceId: space.id, kind: "owner" });

        await writeOrgMemory(id, {
          type: "workspace.created",
          name: body.name,
          byActorId: actorId,
        });

        reply.code(201);
        return workspace;
      },
    );

    app.delete(
      "/organizations/:id/workspaces/:workspaceId",
      { preHandler: rbac.requireOrgAdmin("id") },
      async (request, reply) => {
        const params = request.params as { id?: string; workspaceId?: string };
        const id = parse(Id, params.id, reply);
        if (!id) return;
        const workspaceId = parse(Id, params.workspaceId, reply);
        if (!workspaceId) return;
        const organization = await repo.getOrganization(id);
        if (!organization) return fail(reply, 404, "organization not found");
        const workspace = await repo.getWorkspace(workspaceId);
        if (!workspace || workspace.organizationId !== id) {
          return fail(reply, 404, "workspace not found");
        }
        if (workspace.spaceId === organization.spaceId) {
          return fail(reply, 400, "cannot delete the organization's default workspace");
        }
        await repo.deleteWorkspace(workspaceId);
        return { ok: true };
      },
    );

    app.patch(
      "/organizations/:id",
      { preHandler: rbac.requireOrgAdmin("id") },
      async (request, reply) => {
        const params = request.params as { id?: string };
        const id = parse(Id, params.id, reply);
        if (!id) return;
        const organization = await repo.getOrganization(id);
        if (!organization) return fail(reply, 404, "organization not found");
        const body = parse(UpdateOrganizationBody, request.body, reply);
        if (!body) return;

        const updated = await repo.updateOrganization(id, { dream: body.dream });
        if (!updated) return fail(reply, 404, "organization not found");

        await writeOrgMemory(updated.id, {
          type: "organization.dream.updated",
          byActorId: request.session.actorId,
        });

        return { organization: updated };
      },
    );

    app.get(
      "/organizations/:id/members",
      { preHandler: rbac.requireOrgAccess("id") },
      async (request, reply) => {
        const params = request.params as { id?: string };
        const id = parse(Id, params.id, reply);
        if (!id) return;
        const organization = await repo.getOrganization(id);
        if (!organization) return fail(reply, 404, "organization not found");

        const [people, actors, roles] = await Promise.all([
          repo.listPeople(),
          repo.listActors(),
          repo.listRolesForSpace(organization.spaceId),
        ]);
        const personByActor = new Map(people.map((p) => [p.actorId, p]));
        const actorById = new Map(actors.map((a) => [a.id, a]));

        const items: OrganizationMemberType[] = [];
        for (const role of roles) {
          const kind = toHumanKind(role.kind);
          if (!kind) continue;
          const person = personByActor.get(role.actorId);
          const actor = actorById.get(role.actorId);
          if (!person || !actor) continue;
          items.push(
            buildMember(person, actor, kind, role.title, role.createdAt),
          );
        }

        items.sort(
          (a, b) =>
            ROLE_WEIGHT[b.kind] - ROLE_WEIGHT[a.kind] ||
            a.displayName.localeCompare(b.displayName),
        );

        return { items };
      },
    );

    app.post(
      "/organizations/:id/members",
      { preHandler: rbac.requireOrgAdmin("id") },
      async (request, reply) => {
        const params = request.params as { id?: string };
        const id = parse(Id, params.id, reply);
        if (!id) return;
        const organization = await repo.getOrganization(id);
        if (!organization) return fail(reply, 404, "organization not found");
        const body = parse(AddMemberBody, request.body, reply);
        if (!body) return;

        const byActorId = request.session.actorId!;
        const email = body.email.toLowerCase();

        let user = await repo.findUserByEmail(email);
        if (!user) {
          const displayName = email.split("@")[0] ?? email;
          const actor = await repo.createActor({ type: "human", displayName });
          const space = await repo.createSpace({
            kind: "personal",
            ownerActorId: actor.id,
            name: displayName,
          });
          const actorWithSpace = await repo.updateActor(actor.id, {
            personalSpaceId: space.id,
          });
          const person = await repo.createPerson({
            actorId: actor.id,
            email,
            membershipSpaceIds: [],
          });
          user = {
            person,
            actor: actorWithSpace ?? actor,
            passwordHash: null,
            isSuperAdmin: false,
          };
          await repo.createUser(user);
        }

        const existingRoles = await repo.listRolesForActor(user.actor.id);
        const existing = existingRoles.find(
          (r) => r.spaceId === organization.spaceId,
        );
        if (existing) return fail(reply, 409, "membership already exists");

        const role = await repo.createRole({
          actorId: user.actor.id,
          spaceId: organization.spaceId,
          kind: body.role,
        });

        const person = user.person;
        const membershipSpaceIds = [
          ...new Set([...(person.membershipSpaceIds ?? []), organization.spaceId]),
        ];
        await repo.updatePerson(person.id, { membershipSpaceIds });

        await writeOrgMemory(organization.id, {
          type: "member.added",
          email,
          role: body.role,
          byActorId,
        });

        const member = OrganizationMember.parse(
          buildMember(person, user.actor, body.role, role.title, role.createdAt),
        );

        reply.code(201);
        return member;
      },
    );

    app.patch(
      "/organizations/:id/members/:personId",
      { preHandler: rbac.requireOrgAdmin("id") },
      async (request, reply) => {
        const params = request.params as { id?: string; personId?: string };
        const id = parse(Id, params.id, reply);
        if (!id) return;
        const personId = parse(Id, params.personId, reply);
        if (!personId) return;
        const organization = await repo.getOrganization(id);
        if (!organization) return fail(reply, 404, "organization not found");
        const body = parse(UpdateMemberRoleBody, request.body, reply);
        if (!body) return;

        const person = await repo.getPerson(personId);
        if (!person) return fail(reply, 404, "person not found");
        const actor = await repo.getActor(person.actorId);
        if (!actor) return fail(reply, 404, "person has no actor");

        const roles = await repo.listRolesForActor(actor.id);
        const role = roles.find((r) => r.spaceId === organization.spaceId);
        if (!role) return fail(reply, 404, "membership not found");
        if (role.kind === "owner") return fail(reply, 403, "cannot change the owner role");

        if (role.kind === body.role) {
          return buildMember(person, actor, body.role, role.title, role.createdAt);
        }

        const updated = await repo.updateRole(role.id, { kind: body.role });
        if (!updated) return fail(reply, 404, "role not found");

        await writeOrgMemory(organization.id, {
          type: "member.role.updated",
          personId,
          role: body.role,
          byActorId: request.session.actorId,
        });

        return buildMember(person, actor, body.role, updated.title, updated.createdAt);
      },
    );

    app.delete(
      "/organizations/:id/members/:personId",
      { preHandler: rbac.requireOrgAdmin("id") },
      async (request, reply) => {
        const params = request.params as { id?: string; personId?: string };
        const id = parse(Id, params.id, reply);
        if (!id) return;
        const personId = parse(Id, params.personId, reply);
        if (!personId) return;
        const organization = await repo.getOrganization(id);
        if (!organization) return fail(reply, 404, "organization not found");

        const person = await repo.getPerson(personId);
        if (!person) return fail(reply, 404, "person not found");

        const roles = await repo.listRolesForActor(person.actorId);
        const role = roles.find((r) => r.spaceId === organization.spaceId);
        if (!role) return fail(reply, 404, "membership not found");
        if (role.kind === "owner") return fail(reply, 403, "cannot remove the owner");

        await repo.deleteRole(role.id);

        const membershipSpaceIds = (person.membershipSpaceIds ?? []).filter(
          (sid) => sid !== organization.spaceId,
        );
        await repo.updatePerson(person.id, { membershipSpaceIds });

        await writeOrgMemory(organization.id, {
          type: "member.removed",
          personId,
          email: person.email ?? undefined,
        });

        reply.code(204).send();
      },
    );

    app.get(
      "/organizations/:id/apps",
      { preHandler: rbac.requireOrgAccess("id") },
      async (request, reply) => {
        const params = request.params as { id?: string };
        const id = parse(Id, params.id, reply);
        if (!id) return;
        const organization = await repo.getOrganization(id);
        if (!organization) return fail(reply, 404, "organization not found");
        return appsPayload(organization.id, organization.enabledAppIds);
      },
    );

    app.put(
      "/organizations/:id/apps",
      { preHandler: rbac.requireOrgAdmin("id") },
      async (request, reply) => {
        const params = request.params as { id?: string };
        const id = parse(Id, params.id, reply);
        if (!id) return;
        const organization = await repo.getOrganization(id);
        if (!organization) return fail(reply, 404, "organization not found");
        const body = parse(UpdateOrganizationApps, request.body, reply);
        if (!body) return;

        const invalid = body.enabledAppIds.filter((appId) => !opts.apps.get(appId));
        if (invalid.length > 0) {
          return fail(reply, 400, `unknown app ids: ${invalid.join(", ")}`);
        }

        await repo.updateOrganization(id, { enabledAppIds: body.enabledAppIds });

        await writeOrgMemory(organization.id, {
          type: "apps.updated",
          enabledAppIds: body.enabledAppIds,
          byActorId: request.session.actorId,
        });

        const updated = await repo.getOrganization(id);
        if (!updated) return fail(reply, 404, "organization not found");
        return appsPayload(updated.id, updated.enabledAppIds);
      },
    );
  };
}
