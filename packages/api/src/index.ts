import { buildApp } from "./app.js";
import { createMemoryRepository } from "./repository.js";
import { createPgRepositoryFromDb } from "./pgRepository.js";
import { superAdminEmails } from "./auth.js";
import { createDb } from "@jamot/core";
import type { Db } from "@jamot/core";
import { createEventBus } from "@jamot/core";
import {
  createWhatsAppManager,
  createWhatsAppControlServer,
  type InboundMessage,
} from "@jamot/core/channels";
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
let db: Db | undefined;
let memoryProvider: MemoryProvider | undefined;
let knowledgeStore: KnowledgeStore | undefined;
let reputation: ReputationService | undefined;
let treasury: TreasuryService | undefined;
let llm: LLMProvider | undefined;

if (process.env.DATABASE_URL) {
  db = createDb(process.env.DATABASE_URL);
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

try {
  for (const email of superAdminEmails()) {
    const user = await repository.findUserByEmail(email);
    if (user) await repository.setSuperAdmin(user.person.id, true);
  }
} catch (err) {
  console.warn("super admin reconciliation failed", err);
}

// WhatsApp channel manager — runs Baileys in-process (leadpilot-style) so it
// connects from the API service's own egress rather than a separate pserv.
let whatsAppManager: ReturnType<typeof createWhatsAppManager> | undefined;
const whatsappSessionDir = process.env.WHATSAPP_SESSION_DIR;
if (whatsappSessionDir) {
  const eventBus = createEventBus(db);
  const onMessage = (msg: InboundMessage) => {
    console.log(`[channel:whatsapp] ${msg.sender}: ${msg.text}`);
    void eventBus
      .publish({
        type: "message.received",
        idempotencyKey: `${msg.kind}:${msg.sender}:${msg.timestamp}`,
        payload: {
          channelId: msg.channelId,
          kind: msg.kind,
          sender: msg.sender,
          text: msg.text,
          timestamp: msg.timestamp,
          room: msg.room,
        },
      })
      .catch((err) => {
        console.error("[channel] publish failed", err);
      });
  };
  whatsAppManager = createWhatsAppManager({
    sessionBaseDir: whatsappSessionDir,
    onMessage,
    proxyUrl: process.env.WHATSAPP_PROXY_URL,
  });

  const waControlPort = Number(process.env.WA_CONTROL_PORT ?? 3001);
  const controlServer = createWhatsAppControlServer(whatsAppManager, {
    port: waControlPort,
  });
  await controlServer.start();
  console.log(
    `[channel] whatsapp manager started in-process (session=${whatsappSessionDir}, controlPort=${controlServer.port})`,
  );
  process.on("exit", () => {
    void controlServer.close().catch(() => {});
  });
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
  whatsAppManager,
});

try {
  await app.listen({ host, port });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
