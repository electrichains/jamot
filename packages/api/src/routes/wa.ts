import { z } from "zod";
import type { FastifyInstance } from "fastify";
import { Id } from "@jamot/contracts";
import { requireAuth, createRbac } from "../rbac.js";
import { fail, parse } from "../util.js";
import type { JamotRepository, WaAccountRecord } from "../repository.js";

const CreateAccountBody = z.object({
  spaceId: z.string().min(1),
  label: z.string().min(1).max(120),
});

const SendBody = z.object({
  jid: z.string().min(1),
  text: z.string().min(1),
});

const ReadBody = z.object({
  jid: z.string().min(1),
});

const MediaBody = z.object({
  jid: z.string().min(1),
  type: z.enum(["image", "video", "audio"]),
  data: z.string().min(1),
  caption: z.string().optional(),
  filename: z.string().optional(),
  mimetype: z.string().optional(),
});

const ImportBody = z.object({
  files: z.record(z.string(), z.string()),
});

export interface WaRouteOptions {
  repository: JamotRepository;
  workerUrl?: string;
}

async function forward(
  workerBase: string,
  path: string,
  init?: RequestInit,
): Promise<{ body: unknown; status: number }> {
  const res = await fetch(`${workerBase}${path}`, init);
  const text = await res.text();
  let body: unknown = { raw: text };
  try {
    body = JSON.parse(text) as unknown;
  } catch {
    // keep raw fallback
  }
  return { body, status: res.status };
}

type FailReply = Parameters<typeof fail>[0];

export default async function waRoutes(
  app: FastifyInstance,
  opts: WaRouteOptions,
): Promise<void> {
  const workerBase = opts.workerUrl ?? process.env.WA_WORKER_URL ?? "";
  const { repository } = opts;
  const rbac = createRbac(repository);

  const proxy = async (
    path: string,
    reply: FailReply,
    init?: RequestInit,
  ): Promise<unknown | undefined> => {
    if (!workerBase) {
      fail(reply, 503, "whatsapp worker not configured");
      return undefined;
    }
    try {
      const { body, status } = await forward(workerBase, path, init);
      if (status >= 400) {
        const message =
          typeof body === "object" && body !== null && "error" in body
            ? String((body as { error: unknown }).error)
            : "whatsapp worker error";
        fail(reply, status < 500 ? status : 502, message);
        return undefined;
      }
      return body;
    } catch {
      fail(reply, 502, "whatsapp worker unreachable");
      return undefined;
    }
  };

  const jsonInit = (body: unknown): RequestInit => ({
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const secretInit = (body?: unknown): RequestInit => {
    const secret = process.env.WA_CONTROL_SECRET ?? "";
    return {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(secret ? { "x-control-secret": secret } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    };
  };

  const accountPath = (path: string): string =>
    `/accounts/${path}`;

  const loadAccount = async (
    id: string,
    reply: FailReply,
  ): Promise<WaAccountRecord | undefined> => {
    const account = await repository.getWaAccount(id);
    if (!account) {
      fail(reply, 404, "wa account not found");
      return undefined;
    }
    return account;
  };

  const resolveSpaceFromQuery = rbac.requireSpaceAccess("spaceId");

  const fetchStateBestEffort = async (id: string) => {
    if (!workerBase) return undefined;
    try {
      const { body, status } = await forward(
        workerBase,
        accountPath(`${encodeURIComponent(id)}/state`),
      );
      if (status !== 200 || typeof body !== "object" || body === null) {
        return undefined;
      }
      return body as { connection?: string; qr?: string; phone?: string };
    } catch {
      return undefined;
    }
  };

  app.post(
    "/wa/accounts",
    { preHandler: [requireAuth, resolveSpaceFromQuery] },
    async (request, reply) => {
      const body = parse(CreateAccountBody, request.body, reply);
      if (!body) return;
      const account = await repository.createWaAccount(
        body.spaceId,
        body.label,
      );
      reply.code(201);
      return account;
    },
  );

  app.get(
    "/wa/accounts",
    { preHandler: [requireAuth, resolveSpaceFromQuery] },
    async (request, reply) => {
      const query = request.query as { spaceId?: string };
      if (!query.spaceId) return fail(reply, 400, "spaceId is required");
      const accounts = await repository.listWaAccounts(query.spaceId);
      const withState = await Promise.all(
        accounts.map(async (account) => {
          const state = await fetchStateBestEffort(account.id);
          if (!state) return { ...account, connection: null, qr: null };
          return { ...account, ...state };
        }),
      );
      return { items: withState };
    },
  );

  app.get(
    "/wa/accounts/:id/state",
    { preHandler: requireAuth },
    async (request, reply) => {
      const params = request.params as { id?: string };
      const id = parse(Id, params.id, reply);
      if (!id) return;
      const account = await loadAccount(id, reply);
      if (!account) return;
      return proxy(accountPath(`${encodeURIComponent(id)}/state`), reply);
    },
  );

  app.post(
    "/wa/accounts/:id/reset",
    { preHandler: requireAuth },
    async (request, reply) => {
      const params = request.params as { id?: string };
      const id = parse(Id, params.id, reply);
      if (!id) return;
      const account = await loadAccount(id, reply);
      if (!account) return;
      await repository.updateWaAccount(id, { status: "pairing" });
      return proxy(accountPath(`${encodeURIComponent(id)}/reset`), reply, {
        method: "POST",
      });
    },
  );

  app.post(
    "/wa/accounts/:id/logout",
    { preHandler: requireAuth },
    async (request, reply) => {
      const params = request.params as { id?: string };
      const id = parse(Id, params.id, reply);
      if (!id) return;
      const account = await loadAccount(id, reply);
      if (!account) return;
      await repository.updateWaAccount(id, {
        status: "offline",
        phone: null,
      });
      return proxy(accountPath(`${encodeURIComponent(id)}/logout`), reply, {
        method: "POST",
      });
    },
  );

  app.delete(
    "/wa/accounts/:id",
    { preHandler: requireAuth },
    async (request, reply) => {
      const params = request.params as { id?: string };
      const id = parse(Id, params.id, reply);
      if (!id) return;
      const account = await loadAccount(id, reply);
      if (!account) return;
      if (workerBase) {
        await forward(
          workerBase,
          accountPath(`${encodeURIComponent(id)}/logout`),
          { method: "POST" },
        ).catch(() => {});
      }
      await repository.deleteWaAccount(id);
      return { ok: true };
    },
  );

  app.post(
    "/wa/accounts/:id/session",
    { preHandler: requireAuth, bodyLimit: 64 * 1024 * 1024 },
    async (request, reply) => {
      const params = request.params as { id?: string };
      const id = parse(Id, params.id, reply);
      if (!id) return;
      const account = await loadAccount(id, reply);
      if (!account) return;
      const body = parse(ImportBody, request.body, reply);
      if (!body) return;
      return proxy(
        accountPath(`${encodeURIComponent(id)}/session`),
        reply,
        secretInit(body),
      );
    },
  );

  app.post(
    "/wa/accounts/:id/send",
    { preHandler: requireAuth },
    async (request, reply) => {
      const params = request.params as { id?: string };
      const id = parse(Id, params.id, reply);
      if (!id) return;
      const account = await loadAccount(id, reply);
      if (!account) return;
      const body = parse(SendBody, request.body, reply);
      if (!body) return;
      return proxy(accountPath(`${encodeURIComponent(id)}/send`), reply, jsonInit(body));
    },
  );

  app.post(
    "/wa/accounts/:id/media",
    { preHandler: requireAuth, bodyLimit: 15728640 },
    async (request, reply) => {
      const params = request.params as { id?: string };
      const id = parse(Id, params.id, reply);
      if (!id) return;
      const account = await loadAccount(id, reply);
      if (!account) return;
      const body = parse(MediaBody, request.body, reply);
      if (!body) return;
      return proxy(accountPath(`${encodeURIComponent(id)}/media`), reply, jsonInit(body));
    },
  );

  app.post(
    "/wa/accounts/:id/read",
    { preHandler: requireAuth },
    async (request, reply) => {
      const params = request.params as { id?: string };
      const id = parse(Id, params.id, reply);
      if (!id) return;
      const account = await loadAccount(id, reply);
      if (!account) return;
      const body = parse(ReadBody, request.body, reply);
      if (!body) return;
      return proxy(accountPath(`${encodeURIComponent(id)}/read`), reply, jsonInit(body));
    },
  );

  app.get(
    "/wa/accounts/:id/chats",
    { preHandler: requireAuth },
    async (request, reply) => {
      const params = request.params as { id?: string };
      const id = parse(Id, params.id, reply);
      if (!id) return;
      const account = await loadAccount(id, reply);
      if (!account) return;
      return proxy(accountPath(`${encodeURIComponent(id)}/chats`), reply);
    },
  );

  app.get(
    "/wa/accounts/:id/contacts",
    { preHandler: requireAuth },
    async (request, reply) => {
      const params = request.params as { id?: string };
      const id = parse(Id, params.id, reply);
      if (!id) return;
      const account = await loadAccount(id, reply);
      if (!account) return;
      const query = request.query as { q?: string };
      const q = query.q ? `?q=${encodeURIComponent(query.q)}` : "";
      return proxy(
        accountPath(`${encodeURIComponent(id)}/contacts${q}`),
        reply,
      );
    },
  );

  app.get(
    "/wa/accounts/:id/messages",
    { preHandler: requireAuth },
    async (request, reply) => {
      const params = request.params as { id?: string };
      const id = parse(Id, params.id, reply);
      if (!id) return;
      const account = await loadAccount(id, reply);
      if (!account) return;
      const query = request.query as { jid?: string; before?: string; limit?: string };
      if (!query.jid) return fail(reply, 400, "jid is required");
      const paramsArg = new URLSearchParams({ jid: query.jid });
      if (query.before) paramsArg.set("before", query.before);
      if (query.limit) paramsArg.set("limit", query.limit);
      return proxy(
        accountPath(`${encodeURIComponent(id)}/messages?${paramsArg.toString()}`),
        reply,
      );
    },
  );

  app.get(
    "/wa/accounts/:id/search",
    { preHandler: requireAuth },
    async (request, reply) => {
      const params = request.params as { id?: string };
      const id = parse(Id, params.id, reply);
      if (!id) return;
      const account = await loadAccount(id, reply);
      if (!account) return;
      const query = request.query as { q?: string };
      const q = query.q ?? "";
      return proxy(
        accountPath(`${encodeURIComponent(id)}/search?q=${encodeURIComponent(q)}`),
        reply,
      );
    },
  );

  app.get("/wa/net-meta", { preHandler: requireAuth }, async (_req, reply) => {
    return proxy("/net/meta", reply);
  });
}