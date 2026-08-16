import { pathToFileURL } from "node:url";
import {
  createChannelRegistry,
  createChannelService,
  createMatrixAdapter,
  createWhatsAppAdapter,
  createWhatsAppControlServer,
} from "@jamot/core/channels";
import type { InboundMessage } from "@jamot/core/channels";
import { createDb, createEventBus } from "@jamot/core";
import { createMemoryRepository } from "@jamot/core/repository/memory";
import { createPgRepository } from "@jamot/core/repository/pg";

export function startChannelWorker(): Promise<void> {
  const registry = createChannelRegistry();

  const databaseUrl = process.env.DATABASE_URL;
  const db = databaseUrl ? createDb(databaseUrl) : undefined;
  const repo = db ? createPgRepository(db) : createMemoryRepository();
  const eventBus = createEventBus(db);

  const service = createChannelService({
    repo,
    eventBus,
    registry,
  });
  const onMessage = (msg: InboundMessage) => {
    console.log(`[channel:${msg.kind}] ${msg.sender}: ${msg.text}`);
    void service.onInbound(msg);
  };

  const whatsappSessionDir =
    process.env.WHATSAPP_SESSION_DIR ?? "./.data/whatsapp";
  const matrixHomeserver = process.env.MATRIX_HOMESERVER_URL;
  const matrixUser = process.env.MATRIX_BOT_USER;
  const matrixToken =
    process.env.MATRIX_ACCESS_TOKEN ?? process.env.MATRIX_BOT_PASSWORD;

  const promises: Promise<void>[] = [];

  if (whatsappSessionDir) {
    const adapter = createWhatsAppAdapter({
      sessionDir: whatsappSessionDir,
    });
    adapter.onMessage(onMessage);
    registry.register(adapter);
    promises.push(adapter.connect());

    const controlPort = Number(process.env.WA_CONTROL_PORT ?? 3001);
    const server = createWhatsAppControlServer(adapter, { port: controlPort });
    promises.push(server.start());
  }

  if (matrixHomeserver && matrixUser && matrixToken) {
    const adapter = createMatrixAdapter({
      homeserver: matrixHomeserver,
      userId: matrixUser,
      accessToken: matrixToken,
    });
    adapter.onMessage(onMessage);
    registry.register(adapter);
    promises.push(adapter.connect());
  }

  if (promises.length === 0) {
    return Promise.resolve();
  }

  return Promise.all(promises).then(() => undefined);
}

const isMain =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  void startChannelWorker();
}