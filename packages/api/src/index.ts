import { buildApp } from "./app.js";
import { createMemoryRepository } from "./repository.js";
import { createPgRepositoryFromDb } from "./pgRepository.js";
import { createDb } from "@jamot/core";
import type { Db } from "@jamot/core";
import { createPostgresMemoryProvider } from "@jamot/core/memory";
import { createPostgresKnowledgeStore } from "@jamot/core/knowledge";
import type { MemoryProvider } from "@jamot/core/memory";
import type { KnowledgeStore } from "@jamot/core/knowledge";

const port = Number(process.env.PORT ?? 4000);
const host = process.env.API_HOST ?? "0.0.0.0";
const secret = process.env.SESSION_SECRET ?? "jamot-dev-secret-change-me";

let repository: ReturnType<typeof createMemoryRepository> | ReturnType<typeof createPgRepositoryFromDb>;
let memoryProvider: MemoryProvider | undefined;
let knowledgeStore: KnowledgeStore | undefined;

if (process.env.DATABASE_URL) {
  const db: Db = createDb(process.env.DATABASE_URL);
  repository = createPgRepositoryFromDb(db);
  memoryProvider = createPostgresMemoryProvider(db);
  knowledgeStore = createPostgresKnowledgeStore(db);
} else {
  repository = createMemoryRepository();
}

const app = await buildApp({ repository, secret, logger: true, memoryProvider, knowledgeStore });

try {
  await app.listen({ host, port });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
