import Fastify from "fastify";
import cookie from "@fastify/cookie";
import session from "@fastify/session";
import helmet from "@fastify/helmet";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import { createHash } from "node:crypto";
import type { JamotRepository } from "./repository.js";
import { sessionOptions } from "./auth.js";
import { createSecretStore } from "@jamot/core/secrets/secret-store";
import { createCredentialResolver } from "@jamot/core/secrets/credential-resolution";
import { createLLMProvider } from "@jamot/core/llm";
import type { LLMProvider } from "@jamot/core/llm";
import { healthRoutes } from "./routes/health.js";
import { actorsRoutes } from "./routes/actors.js";
import { peopleRoutes } from "./routes/people.js";
import { organizationsRoutes } from "./routes/organizations.js";
import { spacesRoutes } from "./routes/spaces.js";
import { rolesRoutes } from "./routes/roles.js";
import { tasksRoutes } from "./routes/tasks.js";
import { authRoutes } from "./routes/auth.js";
import connectorsRoutes from "./routes/connectors.js";
import capabilitiesRoutes from "./routes/capabilities.js";
import skillsRoutes from "./routes/skills.js";
import vaultRoutes from "./routes/vault.js";
import assignmentsRoutes from "./routes/assignments.js";
import agentsRoutes from "./routes/agents.js";
import channelsRoutes from "./routes/channels.js";
import memoryRoutes from "./routes/memory.js";
import knowledgeRoutes from "./routes/knowledge.js";
import type { MemoryProvider } from "@jamot/core/memory";
import type { KnowledgeStore } from "@jamot/core/knowledge";
import { createInMemoryMemoryProvider } from "@jamot/core/memory";
import { createInMemoryKnowledgeStore } from "@jamot/core/knowledge";

export interface SecretStoreLike {
  encrypt(plaintext: string): string;
  decrypt(ciphertext: string): string;
}

export interface BuildAppOptions {
  repository: JamotRepository;
  secret: string;
  logger?: boolean;
  secretStore?: SecretStoreLike;
  llm?: LLMProvider;
  memoryProvider?: MemoryProvider;
  knowledgeStore?: KnowledgeStore;
}

const deriveKey = (secret: string): string =>
  createHash("sha256").update(secret).digest("base64");

export async function buildApp(opts: BuildAppOptions) {
  const app = Fastify({ logger: opts.logger ?? false });

  const secretStore = opts.secretStore ?? createSecretStore({ encryptionKey: deriveKey(opts.secret) });
  const credentialResolver = createCredentialResolver({ repo: opts.repository, store: secretStore });
  const llm = opts.llm ?? createLLMProvider("mock");
  const memoryProvider = opts.memoryProvider ?? createInMemoryMemoryProvider();
  const knowledgeStore = opts.knowledgeStore ?? createInMemoryKnowledgeStore();

  app.decorateRequest("actor", null);
  app.decorateRequest("person", null);

  await app.register(cookie);
  await app.register(session, sessionOptions(opts.secret));
  await app.register(helmet, { global: true });
  await app.register(cors, { origin: true });
  await app.register(rateLimit, { max: 1000, timeWindow: "1 minute" });

  app.addHook("onRequest", async (request) => {
    const actorId = request.session?.actorId;
    if (actorId) {
      request.actor = await opts.repository.getActor(actorId);
      const personId = request.session?.personId;
      if (personId) request.person = await opts.repository.getPerson(personId);
    }
  });

  const routeOpts = {
    repository: opts.repository,
    secretStore,
    credentialResolver: credentialResolver.resolveCredential,
  };

  await app.register(healthRoutes);
  await app.register(actorsRoutes(opts.repository), { prefix: "/api" });
  await app.register(peopleRoutes(opts.repository), { prefix: "/api" });
  await app.register(organizationsRoutes(opts.repository), { prefix: "/api" });
  await app.register(spacesRoutes(opts.repository), { prefix: "/api" });
  await app.register(rolesRoutes(opts.repository), { prefix: "/api" });
  await app.register(tasksRoutes(opts.repository), { prefix: "/api" });
  await app.register(authRoutes(opts.repository), { prefix: "/api" });
  await app.register(connectorsRoutes, { prefix: "/api", ...routeOpts });
  await app.register(capabilitiesRoutes, { prefix: "/api", ...routeOpts });
  await app.register(skillsRoutes, { prefix: "/api", ...routeOpts });
  await app.register(vaultRoutes, { prefix: "/api", ...routeOpts });
  await app.register(assignmentsRoutes, { prefix: "/api", repository: opts.repository, llm });
  await app.register(agentsRoutes, { prefix: "/api", repository: opts.repository });
  await app.register(channelsRoutes, { prefix: "/api", repository: opts.repository });
  await app.register(memoryRoutes, { prefix: "/api", memoryProvider });
  await app.register(knowledgeRoutes, { prefix: "/api", knowledgeStore });

  return app;
}
