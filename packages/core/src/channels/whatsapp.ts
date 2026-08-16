import { rmSync } from "node:fs";
import makeWASocket, {
  Browsers,
  DisconnectReason,
  isJidGroup,
  useMultiFileAuthState,
} from "@whiskeysockets/baileys";
import type { WAMessage, WASocket } from "@whiskeysockets/baileys";
import type { ChannelAdapter, InboundMessage } from "./channel.js";

export type WaConnection = "connecting" | "open" | "close";

export interface WaState {
  connection: WaConnection;
  qr?: string;
}

export interface WaChat {
  jid: string;
  name: string;
  lastMessage: string;
  timestamp: number;
  unread: number;
  isGroup: boolean;
}

export interface WaContact {
  jid: string;
  name: string;
}

export interface WaMessage {
  id: string;
  jid: string;
  fromMe: boolean;
  text: string;
  timestamp: number;
  mediaType: string | null;
}

export interface WaMediaInput {
  jid: string;
  type: "image" | "video" | "audio";
  data: string; // base64 (without data URL prefix) or data URL
  caption?: string;
  filename?: string;
  mimetype?: string;
}

export interface WhatsAppAdapterOpts {
  id?: string;
  sessionDir: string;
  creds?: { type: "baileys"; [k: string]: unknown };
  syncFullHistory?: boolean;
}

export interface WhatsAppAdapter extends ChannelAdapter {
  kind: "whatsapp";
  getState(): WaState;
  resetSession(): Promise<void>;
  listChats(): WaChat[];
  listContacts(query?: string): WaContact[];
  getMessages(
    jid: string,
    opts?: { before?: number; limit?: number },
  ): WaMessage[];
  searchMessages(query: string): WaMessage[];
  sendText(jid: string, text: string): Promise<void>;
  sendMedia(input: WaMediaInput): Promise<void>;
  markRead(jid: string): Promise<void>;
}

function toJid(recipient: string): string {
  if (recipient.includes("@")) return recipient;
  return `${recipient}@s.whatsapp.net`;
}

function messageText(
  msg: WAMessage,
): { text: string; mediaType: string | null } {
  const m = msg.message;
  if (!m) return { text: "", mediaType: null };
  if (m.conversation) return { text: m.conversation, mediaType: null };
  if (m.extendedTextMessage?.text)
    return { text: m.extendedTextMessage.text, mediaType: null };
  if (m.imageMessage)
    return { text: m.imageMessage.caption ?? "", mediaType: "image" };
  if (m.videoMessage)
    return { text: m.videoMessage.caption ?? "", mediaType: "video" };
  if (m.audioMessage) return { text: "", mediaType: "audio" };
  if (m.stickerMessage) return { text: "", mediaType: "sticker" };
  if (m.documentMessage)
    return { text: m.documentMessage.fileName ?? "", mediaType: "document" };
  if (m.contactMessage)
    return { text: m.contactMessage.displayName ?? "", mediaType: "contact" };
  if (m.locationMessage) return { text: "Location", mediaType: "location" };
  return { text: "", mediaType: null };
}

function messageSender(msg: WAMessage): string {
  const key = msg.key;
  const remote = key.remoteJid ?? "";
  if (remote.endsWith("@g.us") && key.participant) return key.participant;
  return remote;
}

export function createWhatsAppAdapter(
  opts: WhatsAppAdapterOpts,
): WhatsAppAdapter {
  const id = opts.id ?? "whatsapp";
  const sessionDir = opts.sessionDir;
  const syncFullHistory = opts.syncFullHistory ?? true;
  const handlers = new Set<(msg: InboundMessage) => void>();
  let sock: WASocket | undefined;
  let connecting = false;

  const state: WaState = { connection: "connecting" };
  const chats = new Map<string, WaChat>();
  const contacts = new Map<string, string>(); // jid -> name
  const messages = new Map<string, WaMessage[]>(); // jid -> messages

  let reconnectDelayMs = 3000;
  let reconnectTimer: ReturnType<typeof setTimeout> | undefined;

  const scheduleReconnect = () => {
    if (reconnectTimer) clearTimeout(reconnectTimer);
    if (state.connection === "close") {
      reconnectTimer = setTimeout(() => void connect(), reconnectDelayMs);
    }
  };

  // Wipe the persisted auth state so the next connect starts a fresh pairing
  // loop. Called after a logout / bad session, where Baileys would otherwise
  // loop forever without ever emitting a new QR.
  const wipeSession = () => {
    try {
      rmSync(sessionDir, { recursive: true, force: true });
    } catch {
      // session dir may be locked or already gone
    }
    state.qr = undefined;
    state.connection = "connecting";
    reconnectDelayMs = 3000;
  };

  const nameFor = (jid: string): string => {
    const contact = contacts.get(jid);
    if (contact) return contact;
    const chat = chats.get(jid);
    if (chat?.name) return chat.name;
    return jid.replace(/@s\.whatsapp\.net$/, "").replace(/@g\.us$/, "");
  };

  const upsertMessage = (jid: string, msg: WAMessage) => {
    const { text, mediaType } = messageText(msg);
    if (!text && !mediaType) return;
    const list = messages.get(jid) ?? [];
    const existing = list.find((m) => m.id === msg.key.id);
    if (existing) return;
    const fromMe = msg.key.fromMe ?? false;
    const ts =
      typeof msg.messageTimestamp === "number"
        ? msg.messageTimestamp
        : Math.floor(Date.now() / 1000);
    list.push({
      id: msg.key.id ?? `m${Date.now()}`,
      jid,
      fromMe,
      text,
      timestamp: ts,
      mediaType,
    });
    list.sort((a, b) => a.timestamp - b.timestamp);
    messages.set(jid, list);

    const chat = chats.get(jid);
    if (chat) {
      chat.lastMessage = text || mediaType || "";
      chat.timestamp = ts;
      if (!fromMe) chat.unread += 1;
    }
  };

  const connect = async () => {
    if (connecting) return;
    connecting = true;
    try {
      reconnectDelayMs = 3000;
      const { state: authState, saveCreds } =
        await useMultiFileAuthState(sessionDir);

      const socket = makeWASocket({
        auth: authState,
        browser: Browsers.macOS("Desktop"),
        printQRInTerminal: false,
        syncFullHistory,
        markOnlineOnConnect: false,
      });
      sock = socket;

      socket.ev.on("creds.update", saveCreds);

      socket.ev.on("connection.update", (update) => {
        if (update.qr) {
          state.connection = "connecting";
          state.qr = update.qr;
          console.log(
            "[whatsapp] pairing QR generated",
            update.qr.slice(0, 16),
          );
        }
        if (update.connection === "open") {
          state.connection = "open";
          state.qr = undefined;
          reconnectDelayMs = 3000;
        }
        if (update.connection === "close") {
          state.connection = "close";
          state.qr = undefined;
          const statusCode = (
            update.lastDisconnect?.error as
              | { output?: { statusCode?: number } }
              | undefined
          )?.output?.statusCode;
          if (
            statusCode === DisconnectReason.loggedOut ||
            statusCode === DisconnectReason.badSession
          ) {
            console.log(
              `[whatsapp] session invalid (${statusCode}) — wiping, will re-pair`,
            );
            wipeSession();
            void connect();
            return;
          }
          reconnectDelayMs = Math.min(reconnectDelayMs * 2, 30_000);
          scheduleReconnect();
        }
      });

      socket.ev.on("contacts.upsert", (upserts) => {
        for (const c of upserts) {
          if (c.id && (c.name || c.notify)) {
            contacts.set(c.id, c.name ?? c.notify ?? "");
          }
        }
      });

      socket.ev.on("contacts.update", (updates) => {
        for (const c of updates) {
          if (c.id && (c.name || c.notify)) {
            contacts.set(c.id, c.name ?? c.notify ?? "");
          }
        }
      });

      socket.ev.on("chats.upsert", (upserts) => {
        for (const c of upserts) {
          const jid = c.id;
          if (!jid) continue;
          const existing = chats.get(jid);
          chats.set(jid, {
            jid,
            name: c.name ?? existing?.name ?? nameFor(jid),
            lastMessage: existing?.lastMessage ?? "",
            timestamp: Number(
              c.conversationTimestamp ?? c.lastMessageRecvTimestamp ?? 0,
            ),
            unread: Number(c.unreadCount ?? existing?.unread ?? 0),
            isGroup: isJidGroup(jid) ?? false,
          });
        }
      });

      socket.ev.on("chats.update", (updates) => {
        for (const c of updates) {
          const jid = c.id;
          if (!jid) continue;
          const existing = chats.get(jid);
          chats.set(jid, {
            jid,
            name: c.name ?? existing?.name ?? nameFor(jid),
            lastMessage: existing?.lastMessage ?? "",
            timestamp: Number(
              c.conversationTimestamp ?? existing?.timestamp ?? 0,
            ),
            unread: Number(c.unreadCount ?? existing?.unread ?? 0),
            isGroup: isJidGroup(jid) ?? false,
          });
        }
      });

      socket.ev.on("messaging-history.set", (history) => {
        for (const chat of history.chats) {
          const jid = chat.id;
          if (!jid) continue;
          chats.set(jid, {
            jid,
            name: chat.name ?? nameFor(jid),
            lastMessage: "",
            timestamp: Number(
              chat.conversationTimestamp ?? chat.lastMessageRecvTimestamp ?? 0,
            ),
            unread: Number(chat.unreadCount ?? 0),
            isGroup: isJidGroup(jid) ?? false,
          });
        }
        const perChat = new Map<string, WaMessage[]>();
        for (const msg of history.messages ?? []) {
          const jid = msg.key.remoteJid ?? "";
          if (!jid) continue;
          const { text, mediaType } = messageText(msg);
          if (!text && !mediaType) continue;
          const list = perChat.get(jid) ?? [];
          list.push({
            id: msg.key.id ?? `m${Date.now()}-${Math.random()}`,
            jid,
            fromMe: msg.key.fromMe ?? false,
            text,
            timestamp:
              typeof msg.messageTimestamp === "number"
                ? msg.messageTimestamp
                : 0,
            mediaType,
          });
          perChat.set(jid, list);
        }
        for (const [jid, incoming] of perChat) {
          const byId = new Map<string, WaMessage>();
          for (const m of messages.get(jid) ?? []) byId.set(m.id, m);
          for (const m of incoming) byId.set(m.id, m);
          const merged = [...byId.values()].sort(
            (a, b) => a.timestamp - b.timestamp,
          );
          messages.set(jid, merged);
          const chatEntry = chats.get(jid);
          if (chatEntry && merged.length > 0) {
            const last = merged[merged.length - 1];
            if (last) chatEntry.lastMessage = last.text || last.mediaType || "";
          }
        }
        for (const c of history.contacts ?? []) {
          if (c.id && (c.name || c.notify)) {
            contacts.set(c.id, c.name ?? c.notify ?? "");
          }
        }
      });

      socket.ev.on("messages.upsert", ({ messages: msgs }) => {
        for (const msg of msgs) {
          const jid = msg.key.fromMe
            ? (msg.key.remoteJid ?? "")
            : messageSender(msg);
          if (jid) upsertMessage(jid, msg);
          if (msg.key.fromMe) continue;
          const { text } = messageText(msg);
          if (!text) continue;
          const sender = messageSender(msg)
            .replace(/@s\.whatsapp\.net$/, "")
            .replace(/@g\.us$/, "");
          const ts =
            typeof msg.messageTimestamp === "number"
              ? msg.messageTimestamp
              : Math.floor(Date.now() / 1000);
          const inbound: InboundMessage = {
            channelId: id,
            kind: "whatsapp",
            sender,
            text,
            timestamp: new Date(ts * 1000).toISOString(),
            raw: msg,
          };
          for (const handler of handlers) handler(inbound);
        }
      });
    } finally {
      connecting = false;
    }
  };

  void connect();

  return {
    id,
    kind: "whatsapp",

    async connect() {
      void connect();
    },

    async disconnect() {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (sock) {
        await sock.end(undefined);
        sock = undefined;
      }
    },

    async resetSession() {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (sock) {
        await sock.end(undefined);
        sock = undefined;
      }
      wipeSession();
      void connect();
    },

    onMessage(handler) {
      handlers.add(handler);
    },

    async send(recipient, text) {
      await this.sendText(toJid(recipient), text);
    },

    getState() {
      return { ...state };
    },

    listChats() {
      return [...chats.values()]
        .filter((c) => c.timestamp > 0 || c.lastMessage)
        .sort((a, b) => b.timestamp - a.timestamp);
    },

    listContacts(query) {
      const q = query?.trim().toLowerCase();
      const seen = new Set<string>();
      const result: WaContact[] = [];
      for (const [jid, name] of contacts) {
        if (!jid.endsWith("@s.whatsapp.net")) continue;
        if (seen.has(jid)) continue;
        seen.add(jid);
        if (!q || name.toLowerCase().includes(q) || jid.includes(q)) {
          result.push({ jid, name });
        }
      }
      return result.sort((a, b) => a.name.localeCompare(b.name));
    },

    getMessages(jid, opts) {
      const list = messages.get(jid) ?? [];
      let filtered = list;
      if (opts?.before) {
        filtered = filtered.filter((m) => m.timestamp < opts.before!);
      }
      const limit = opts?.limit ?? 100;
      return filtered.slice(-limit);
    },

    searchMessages(query) {
      const q = query.trim().toLowerCase();
      if (!q) return [];
      const result: WaMessage[] = [];
      for (const list of messages.values()) {
        for (const m of list) {
          if (m.text.toLowerCase().includes(q)) result.push(m);
        }
      }
      return result
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 200);
    },

    async sendText(jid, text) {
      if (!sock) throw new Error("whatsapp not connected");
      const target = toJid(jid);
      await sock.sendMessage(target, { text });
      upsertMessage(target, {
        key: { remoteJid: target, fromMe: true, id: `s${Date.now()}` },
        messageTimestamp: Math.floor(Date.now() / 1000),
        message: { conversation: text },
      } as unknown as WAMessage);
    },

    async sendMedia(input) {
      if (!sock) throw new Error("whatsapp not connected");
      const base64 = input.data.replace(/^data:[^;]+;base64,/, "");
      const buffer = Buffer.from(base64, "base64");
      const payload = {
        [input.type]: buffer,
        caption: input.caption,
        ...(input.type === "audio"
          ? { mimetype: input.mimetype ?? "audio/mpeg", ptt: true }
          : { mimetype: input.mimetype ?? "application/octet-stream" }),
      };
      await sock.sendMessage(toJid(input.jid), payload as never);
    },

    async markRead(jid) {
      if (!sock) return;
      const target = toJid(jid);
      const list = messages.get(target) ?? [];
      const toRead = list
        .filter((m) => !m.fromMe)
        .map((m) => ({ remoteJid: target, id: m.id }));
      if (toRead.length > 0) await sock.readMessages(toRead);
      const chat = chats.get(target);
      if (chat) chat.unread = 0;
    },
  };
}
