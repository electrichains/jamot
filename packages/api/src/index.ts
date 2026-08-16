import { buildApp } from "./app.js";
import { createMemoryRepository } from "./repository.js";
import { createPgRepositoryFromDb } from "./pgRepository.js";
import { createDb } from "@jamot/core";
import type { Db } from "@jamot/core";
import { createPostgresMemoryProvider } from "@jamot/core/memory";
import { createPostgresKnowledgeStore } from "@jamot/core/knowledge";
import { createPostgresReputationService } from "@jamot/core/reputation";
import { createPostgresTreasuryService } from "@jamot/core/treasury";
import { createLLMProvider } from "@jamot/core/llm";
import type { MemoryProvider } from "@jamot/core/memory";
import type { KnowledgeStore } from "@jamot/core/knowledge";
import type { ReputationService } from "@jamot/core/reputation";
import type { TreasuryService } from "@jamot/core/treasury";
import type { LLMProvider } from "@jamot/core/llm";

const port = Number(process.env.PORT ?? 4000);
const host = process.env.API_HOST ?? "0.0.0.0";
const secret = process.env.SESSION_SECRET ?? "jamot-dev-secret-change-me";

let repository: ReturnType<typeof createMemoryRepository> | ReturnType<typeof createPgRepositoryFromDb>;
let memoryProvider: MemoryProvider | undefined;
let knowledgeStore: KnowledgeStore | undefined;
let reputation: ReputationService | undefined;
let treasury: TreasuryService | undefined;
let llm: LLMProvider | undefined;

if (process.env.DATABASE_URL) {
  const db: Db = createDb(process.env.DATABASE_URL);
  repository = createPgRepositoryFromDb(db);
  memoryProvider = createPostgresMemoryProvider(db);
  knowledgeStore = createPostgresKnowledgeStore(db);
  reputation = createPostgresReputationService(db);
  treasury = createPostgresTreasuryService(db);
} else {
  repository = createMemoryRepository();
}

if (process.env.OPENAI_API_KEY) {
  llm = createLLMProvider("openai");
}

const app = await buildApp({
  repository,
  secret,
  logger: true,
  memoryProvider,
  knowledgeStore,
  reputation,
  treasury,
  llm,
});

try {
  await app.listen({ host, port });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
