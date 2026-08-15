import Fastify from "fastify";
import cookie from "@fastify/cookie";
import session from "@fastify/session";
import helmet from "@fastify/helmet";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import type { JamotRepository } from "./repository.js";
import { sessionOptions } from "./auth.js";
import { healthRoutes } from "./routes/health.js";
import { actorsRoutes } from "./routes/actors.js";
import { peopleRoutes } from "./routes/people.js";
import { organizationsRoutes } from "./routes/organizations.js";
import { spacesRoutes } from "./routes/spaces.js";
import { rolesRoutes } from "./routes/roles.js";
import { tasksRoutes } from "./routes/tasks.js";
import { authRoutes } from "./routes/auth.js";

export interface BuildAppOptions {
  repository: JamotRepository;
  secret: string;
  logger?: boolean;
}

export async function buildApp(opts: BuildAppOptions) {
  const app = Fastify({ logger: opts.logger ?? false });

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

  await app.register(healthRoutes);
  await app.register(actorsRoutes(opts.repository), { prefix: "/api" });
  await app.register(peopleRoutes(opts.repository), { prefix: "/api" });
  await app.register(organizationsRoutes(opts.repository), { prefix: "/api" });
  await app.register(spacesRoutes(opts.repository), { prefix: "/api" });
  await app.register(rolesRoutes(opts.repository), { prefix: "/api" });
  await app.register(tasksRoutes(opts.repository), { prefix: "/api" });
  await app.register(authRoutes(opts.repository), { prefix: "/api" });

  return app;
}
