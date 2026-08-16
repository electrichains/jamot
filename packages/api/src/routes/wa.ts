import { z } from "zod";
import type { FastifyInstance } from "fastify";
import { requireAuth } from "../rbac.js";
import { fail, parse } from "../util.js";

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

export interface WaRouteOptions {
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

export default async function waRoutes(
  app: FastifyInstance,
  opts: WaRouteOptions = {},
): Promise<void> {
  const workerBase = opts.workerUrl ?? process.env.WA_WORKER_URL ?? "";

  const proxy = async (
    path: string,
    reply: Parameters<typeof fail>[0],
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

  app.get("/wa/state", { preHandler: requireAuth }, async (_req, reply) => {
    return proxy("/state", reply);
  });

  app.post("/wa/reset", { preHandler: requireAuth }, async (_req, reply) => {
    return proxy("/reset", reply, { method: "POST" });
  });

  app.get("/wa/chats", { preHandler: requireAuth }, async (_req, reply) => {
    return proxy("/chats", reply);
  });

  app.get("/wa/contacts", { preHandler: requireAuth }, async (request, reply) => {
    const query = request.query as { q?: string };
    const q = query.q ? `q=${encodeURIComponent(query.q)}` : "";
    return proxy(`/contacts${q ? `?${q}` : ""}`, reply);
  });

  app.get("/wa/messages", { preHandler: requireAuth }, async (request, reply) => {
    const query = request.query as { jid?: string; before?: string; limit?: string };
    if (!query.jid) return fail(reply, 400, "jid is required");
    const params = new URLSearchParams({ jid: query.jid });
    if (query.before) params.set("before", query.before);
    if (query.limit) params.set("limit", query.limit);
    return proxy(`/messages?${params.toString()}`, reply);
  });

  app.get("/wa/search", { preHandler: requireAuth }, async (request, reply) => {
    const query = request.query as { q?: string };
    const q = query.q ?? "";
    return proxy(`/search?q=${encodeURIComponent(q)}`, reply);
  });

  app.post("/wa/send", { preHandler: requireAuth }, async (request, reply) => {
    const body = parse(SendBody, request.body, reply);
    if (!body) return;
    return proxy("/send", reply, jsonInit(body));
  });

  app.post(
    "/wa/media",
    { preHandler: requireAuth, bodyLimit: 15728640 },
    async (request, reply) => {
      const body = parse(MediaBody, request.body, reply);
      if (!body) return;
      return proxy("/media", reply, jsonInit(body));
    },
  );

  app.post("/wa/read", { preHandler: requireAuth }, async (request, reply) => {
    const body = parse(ReadBody, request.body, reply);
    if (!body) return;
    return proxy("/read", reply, jsonInit(body));
  });
}