import { buildApp } from "./app.js";
import { createMemoryRepository } from "./repository.js";
import { createPgRepository } from "./pgRepository.js";

const port = Number(process.env.PORT ?? 4000);
const host = process.env.API_HOST ?? "0.0.0.0";
const secret = process.env.SESSION_SECRET ?? "jamot-dev-secret-change-me";
const repository = process.env.DATABASE_URL ? createPgRepository() : createMemoryRepository();

const app = await buildApp({ repository, secret, logger: true });

try {
  await app.listen({ host, port });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
