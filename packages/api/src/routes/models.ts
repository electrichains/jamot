import { z } from "zod";
import { Id } from "@jamot/contracts";
import type { JamotRepository } from "../repository.js";
import {
  resolveModelConfig,
  writeModelConfig,
  clearModelConfig,
  type ModelProvider,
} from "@jamot/core/llm";
import type { FastifyInstance } from "fastify";
import {
  requireAuth,
  actorRoleInSpace,
  ROLE_WEIGHT,
  loadUser,
  isSuperAdminUser,
  deny,
} from "../rbac.js";
import { fail, parse } from "../util.js";
import type { RoutesOptions } from "./types.js";

const PROVIDERS: ModelProvider[] = ["openai", "anthropic"];

const UpsertBody = z.object({
  provider: z.enum(["openai", "anthropic"]),
  organizationId: z.string().trim().min(1).nullable().optional(),
  baseUrl: z.string().trim().min(1).nullable().optional(),
  model: z.string().trim().min(1).nullable().optional(),
  apiKey: z.string().trim().min(1).optional(),
});

interface MaskedConfig {
  configured: boolean;
  baseUrl?: string | null;
  model?: string | null;
  apiKey?: string;
}

async function resolveMasked(
  repository: JamotRepository,
  store: RoutesOptions["secretStore"],
  provider: ModelProvider,
  organizationId?: string | null,
  actorId?: string | null,
  includeSecret = false,
): Promise<MaskedConfig> {
  const cfg = await resolveModelConfig({ repository, store, provider, organizationId, actorId });
  if (!cfg) return { configured: false };
  const masked: MaskedConfig = {
    configured: true,
    baseUrl: cfg.baseUrl ?? null,
    model: cfg.model ?? null,
  };
  if (includeSecret) masked.apiKey = cfg.apiKey;
  return masked;
}

async function requireOrgAdminScope(
  repository: JamotRepository,
  request: { session: { actorId?: string } },
  reply: Parameters<typeof deny>[0],
  organizationId: string,
  orgSpaceId: string,
): Promise<boolean> {
  const actorId = request.session.actorId;
  if (!actorId) {
    deny(reply, "Unauthenticated", 401);
    return false;
  }
  const user = await loadUser(repository, actorId);
  if (isSuperAdminUser(user)) return true;
  const role = await actorRoleInSpace(repository, actorId as Id, orgSpaceId as Id);
  if (!role || ROLE_WEIGHT[role] < ROLE_WEIGHT.admin) {
    deny(reply, "Requires organization admin role or higher", 403);
    return false;
  }
  return true;
}

export default async function modelsRoutes(
  app: FastifyInstance,
  opts: RoutesOptions,
): Promise<void> {
  const { repository: rawRepository, secretStore } = opts;
  const repository = rawRepository as unknown as JamotRepository;

  app.get(
    "/models",
    { preHandler: requireAuth },
    async (request) => {
      const actorId = request.session.actorId!;
      const query = request.query as { organizationId?: string; includeSecret?: string };
      const organizationId = query.organizationId ?? null;
      const includeSecret = query.includeSecret === "true";

      const user: Record<ModelProvider, MaskedConfig> = {
        openai: await resolveMasked(repository, secretStore, "openai", null, actorId, includeSecret),
        anthropic: await resolveMasked(repository, secretStore, "anthropic", null, actorId, includeSecret),
      };

      let organization: Record<ModelProvider, MaskedConfig> | null = null;
      if (organizationId) {
        const org = await repository.getOrganization(organizationId as Id);
        if (org) {
          const user2 = await loadUser(repository, actorId);
          const canReadOrgSecret =
            isSuperAdminUser(user2) ||
            (await actorRoleInSpace(repository, actorId as Id, org.spaceId as Id)) !== null;
          organization = {
            openai: await resolveMasked(
              repository,
              secretStore,
              "openai",
              organizationId,
              null,
              includeSecret && canReadOrgSecret,
            ),
            anthropic: await resolveMasked(
              repository,
              secretStore,
              "anthropic",
              organizationId,
              null,
              includeSecret && canReadOrgSecret,
            ),
          };
        }
      }

      return { user, organization };
    },
  );

  app.put(
    "/models",
    { preHandler: requireAuth },
    async (request, reply) => {
      const body = parse(UpsertBody, request.body, reply);
      if (!body) return;
      const actorId = request.session.actorId!;

      let scope: "user" | "organization";
      let scopeId: string;

      if (body.organizationId) {
        const org = await repository.getOrganization(body.organizationId as Id);
        if (!org) return fail(reply, 404, "organization not found");
        const ok = await requireOrgAdminScope(
          repository,
          request as never,
          reply,
          body.organizationId,
          org.spaceId,
        );
        if (!ok) return;
        scope = "organization";
        scopeId = body.organizationId;
      } else {
        scope = "user";
        scopeId = actorId;
      }

      let apiKey = body.apiKey;
      if (!apiKey) {
        const existing = await resolveModelConfig({
          repository,
          store: secretStore,
          provider: body.provider,
          organizationId: scope === "organization" ? scopeId : null,
          actorId: scope === "user" ? scopeId : null,
        });
        if (!existing) {
          return fail(reply, 400, "apiKey is required to configure this provider.");
        }
        apiKey = existing.apiKey;
      }

      await writeModelConfig({
        repository,
        store: secretStore,
        provider: body.provider,
        scope,
        scopeId,
        apiKey,
        baseUrl: body.baseUrl ?? undefined,
        model: body.model ?? undefined,
      });

      return { status: "ok", provider: body.provider, scope };
    },
  );

  app.delete(
    "/models",
    { preHandler: requireAuth },
    async (request, reply) => {
      const query = request.query as { provider?: string; organizationId?: string };
      const provider = query.provider as ModelProvider | undefined;
      if (!provider || !PROVIDERS.includes(provider)) {
        return fail(reply, 400, "provider is required (openai|anthropic)");
      }
      const actorId = request.session.actorId!;

      let scope: "user" | "organization";
      let scopeId: string;

      if (query.organizationId) {
        const org = await repository.getOrganization(query.organizationId as Id);
        if (!org) return fail(reply, 404, "organization not found");
        const ok = await requireOrgAdminScope(
          repository,
          request as never,
          reply,
          query.organizationId,
          org.spaceId,
        );
        if (!ok) return;
        scope = "organization";
        scopeId = query.organizationId;
      } else {
        scope = "user";
        scopeId = actorId;
      }

      await clearModelConfig({ repository, provider, scope, scopeId });
      return { status: "ok", provider, scope };
    },
  );
}
