import { pathToFileURL } from "node:url";
import {
  createChannelRegistry,
  createChannelService,
} from "@jamot/core/channels";
import type { ChannelAdapter, InboundMessage } from "@jamot/core/channels";
import { createDb, createEventBus } from "@jamot/core";
import { createMemoryRepository } from "@jamot/core/repository/memory";
import { createPgRepository } from "@jamot/core/repository/pg";
import makeWASocket, {
  Browsers,
  DisconnectReason,
  useMultiFileAuthState,
} from "@whiskeysockets/baileys";
import type { WAMessage, WASocket } from "@whiskeysockets/baileys";
import { createClient, EventType, MsgType, RoomEvent } from "matrix-js-sdk";
import type { MatrixClient } from "matrix-js-sdk";

export interface WhatsAppAdapterOpts {
  id?: string;
  sessionDir: string;
  creds?: { type: "baileys"; [k: string]: unknown };
}

function waText(msg: WAMessage): string | undefined {
  const body = msg.message;
  if (!body) return undefined;
  if (body.conversation) return body.conversation;
  if (body.extendedTextMessage?.text) return body.extendedTextMessage.text;
  if (body.imageMessage?.caption) return body.imageMessage.caption;
  if (body.videoMessage?.caption) return body.videoMessage.caption;
  return undefined;
}

function waSender(msg: WAMessage): string {
  const key = msg.key;
  const remote = key.remoteJid ?? "";
  if (remote.endsWith("@g.us") && key.participant) return key.participant;
  return remote;
}

export function createWhatsAppAdapter(
  opts: WhatsAppAdapterOpts,
): ChannelAdapter {
  const id = opts.id ?? "whatsapp";
  const handlers = new Set<(msg: InboundMessage) => void>();
  let sock: WASocket | undefined;

  return {
    id,
    kind: "whatsapp",

    async connect() {
      const start = async () => {
        const { state, saveCreds } = await useMultiFileAuthState(
          opts.sessionDir,
        );
        sock = makeWASocket({
          auth: state,
          browser: Browsers.macOS("Desktop"),
          printQRInTerminal: false,
        });

        sock.ev.on("creds.update", saveCreds);

        sock.ev.on("connection.update", (update) => {
          if (update.qr) {
            console.log(`[whatsapp] scan to pair:\n${update.qr}`);
          }
          if (update.connection === "close") {
            const statusCode = (
              update.lastDisconnect?.error as
                | { output?: { statusCode?: number } }
                | undefined
            )?.output?.statusCode;
            if (statusCode !== DisconnectReason.loggedOut) {
              void start();
            }
          }
        });

        sock.ev.on("messages.upsert", ({ messages }) => {
          for (const message of messages) {
            if (message.key.fromMe) continue;
            const text = waText(message);
            if (!text) continue;
            const sender = waSender(message)
              .replace(/@s\.whatsapp\.net$/, "")
              .replace(/@g\.us$/, "");
            const ts =
              typeof message.messageTimestamp === "number"
                ? message.messageTimestamp
                : Math.floor(Date.now() / 1000);
            for (const handler of handlers) {
              handler({
                channelId: id,
                kind: "whatsapp",
                sender,
                text,
                timestamp: new Date(ts * 1000).toISOString(),
                raw: message,
              });
            }
          }
        });
      };

      await start();
    },

    async disconnect() {
      if (sock) {
        await sock.end(undefined);
        sock = undefined;
      }
    },

    async send(recipient, text) {
      if (!sock) throw new Error("whatsapp adapter not connected");
      await sock.sendMessage(`${recipient}@s.whatsapp.net`, { text });
    },

    onMessage(handler) {
      handlers.add(handler);
    },
  };
}

export interface MatrixAdapterOpts {
  id?: string;
  homeserver: string;
  userId: string;
  accessToken: string;
}

export function createMatrixAdapter(opts: MatrixAdapterOpts): ChannelAdapter {
  const id = opts.id ?? "matrix";
  const handlers = new Set<(msg: InboundMessage) => void>();
  let client: MatrixClient | undefined;

  return {
    id,
    kind: "matrix",

    async connect() {
      client = createClient({
        baseUrl: opts.homeserver,
        userId: opts.userId,
        accessToken: opts.accessToken,
      });

      client.on(RoomEvent.Timeline, (event, room) => {
        if (event.getType() !== EventType.RoomMessage) return;
        const content = event.getContent();
        if (content.msgtype !== MsgType.Text) return;
        const text = content.body as string | undefined;
        if (!text) return;
        const sender = event.getSender();
        if (!sender) return;
        for (const handler of handlers) {
          handler({
            channelId: id,
            kind: "matrix",
            sender,
            text,
            timestamp: new Date(event.getTs()).toISOString(),
            room: event.getRoomId() ?? room?.roomId,
            raw: content,
          });
        }
      });

      await client.startClient();
    },

    async disconnect() {
      if (client) {
        client.stopClient();
        client = undefined;
      }
    },

    async send(recipient, text) {
      if (!client) throw new Error("matrix adapter not connected");
      await client.sendMessage(recipient, { msgtype: MsgType.Text, body: text });
    },

    onMessage(handler) {
      handlers.add(handler);
    },
  };
}

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
