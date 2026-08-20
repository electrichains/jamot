import { pathToFileURL } from "node:url";
import {
  createChannelRegistry,
  createChannelService,
  createMatrixAdapter,
  createWhatsAppControlServer,
  createWhatsAppManager,
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
  const whatsappProxyUrl = process.env.WHATSAPP_PROXY_URL;
  const matrixHomeserver = process.env.MATRIX_HOMESERVER_URL;
  const matrixUser = process.env.MATRIX_BOT_USER;
  const matrixToken =
    process.env.MATRIX_ACCESS_TOKEN ?? process.env.MATRIX_BOT_PASSWORD;

  const promises: Promise<void>[] = [];
  let manager: ReturnType<typeof createWhatsAppManager> | undefined;

  if (whatsappSessionDir) {
    manager = createWhatsAppManager({
      sessionBaseDir: whatsappSessionDir,
      onMessage,
      proxyUrl: whatsappProxyUrl,
    });

    const controlPort = Number(
      process.env.PORT ?? process.env.WA_CONTROL_PORT ?? 3001,
    );
    console.log(
      `[channel] whatsapp control server: internal=${process.env.RENDER_INTERNAL_HOSTNAME ?? "n/a"} port=${controlPort}`,
    );
    const server = createWhatsAppControlServer(manager, { port: controlPort });
    promises.push(server.start());

    let shuttingDown = false;
    const shutdown = (signal: string) => {
      if (shuttingDown) return;
      shuttingDown = true;
      console.log(`[channel] ${signal} received — closing whatsapp sockets cleanly`);
      void (async () => {
        try {
          await manager?.close();
        } catch (err) {
          console.error("[channel] whatsapp close failed", err);
        }
        try {
          await server.close();
        } catch (err) {
          console.error("[channel] control server close failed", err);
        }
        process.exit(0);
      })();
    };
    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
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