"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Loader2, Paperclip, RotateCcw, Search, Send } from "lucide-react";
import QRCode from "qrcode";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { listOrgSpaces } from "@/lib/org-spaces";
import {
  createAccount,
  deleteAccount,
  getMessages,
  getState,
  listAccounts,
  listChats,
  listContacts,
  markRead,
  resetPairing,
  searchMessages,
  sendMedia,
  sendText,
} from "./wa-api";
import type { WaAccount, WaChat, WaContact, WaConnection, WaMessage, WaState } from "./wa-data";

function mediaLabel(msg: WaMessage): string {
  if (msg.text) return msg.text;
  if (msg.mediaType) return `[${msg.mediaType}]`;
  return "";
}

function timeAgo(ts: number): string {
  if (!ts) return "";
  const diff = (Date.now() / 1000 - ts) * 1000;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      resolve(result.replace(/^data:[^;]+;base64,/, ""));
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function mediaTypeFor(mime: string): "image" | "video" | "audio" | null {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  return null;
}

function QrPanel({
  qr,
  connection,
  onReset,
}: {
  qr?: string;
  connection: WaConnection;
  onReset: () => void;
}) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!qr) return;
    let cancelled = false;
    void QRCode.toDataURL(qr, { margin: 1, width: 220 })
      .then((url) => {
        if (!cancelled) setDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [qr]);

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
      <h3 className="font-display text-base font-semibold">Pair WhatsApp</h3>
      <p className="max-w-sm text-sm text-muted-foreground">
        {connection === "close"
          ? "The previous session ended. Reset pairing to link a new device."
          : "Scan the code with WhatsApp on your phone, under Settings → Linked devices, to connect this workspace."}
      </p>
      {connection === "close" ? (
        <Button onClick={onReset}>
          <RotateCcw className="size-4" />
          Reset pairing
        </Button>
      ) : dataUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={dataUrl}
          alt="WhatsApp pairing QR code"
          className="rounded-lg border border-border bg-white p-2"
        />
      ) : failed ? (
        <p className="text-sm text-destructive">Could not render QR code.</p>
      ) : (
        <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
          {connection === "open" ? "Linked devices ready" : "Waiting for code…"}
        </div>
      )}
    </div>
  );
}

export function WhatsAppApp({ compact = false }: { compact?: boolean }) {
  const [accounts, setAccounts] = useState<WaAccount[]>([]);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [accountBusy, setAccountBusy] = useState(false);
  const [state, setState] = useState<WaState | null>(null);
  const [chats, setChats] = useState<WaChat[]>([]);
  const [contacts, setContacts] = useState<WaContact[]>([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [messages, setMessages] = useState<WaMessage[]>([]);
  const [results, setResults] = useState<WaMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [workerError, setWorkerError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const connected = state?.connection === "open";

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const orgs = await listOrgSpaces();
        const firstOrg = orgs[0];
        if (!firstOrg) return;
        const items = await listAccounts(firstOrg.spaceId);
        if (cancelled) return;
        setAccounts(items);
        setAccountId(items[0]?.id ?? null);
      } catch {
        if (cancelled) return;
        setAccounts([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!accountId) return;
    let cancelled = false;
    const tick = async () => {
      try {
        const [nextState, nextChats] = await Promise.all([
          getState(accountId),
          listChats(accountId),
        ]);
        if (cancelled) return;
        setState(nextState);
        setChats(nextChats);
        setWorkerError(null);
      } catch (err) {
        if (cancelled) return;
        const message =
          err instanceof Error
            ? err.message
            : "WhatsApp worker unreachable";
        setWorkerError(message);
      }
    };
    void tick();
    const timer = setInterval(() => void tick(), 2000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [accountId]);

  useEffect(() => {
    if (!selected || !accountId) return;
    let cancelled = false;
    const load = async () => {
      try {
        const msgs = await getMessages(accountId, selected);
        if (!cancelled) setMessages(msgs);
      } catch {
        // ignored while polling
      }
    };
    void load();
    const timer = setInterval(() => void load(), 2000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [selected, accountId]);

  useEffect(() => {
    const q = query.trim();
    if (!q || !accountId) return;
    let cancelled = false;
    void listContacts(accountId, q)
      .then((list) => {
        if (!cancelled) setContacts(list);
      })
      .catch(() => {});
    void searchMessages(accountId, q)
      .then((found) => {
        if (!cancelled) setResults(found);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [query, accountId]);

  const nameFor = (jid: string): string =>
    chats.find((c) => c.jid === jid)?.name ??
    jid.replace(/@s\.whatsapp\.net$/, "").replace(/@g\.us$/, "");

  const openChat = (jid: string) => {
    setSelected(jid);
    setQuery("");
    if (accountId) void markRead(accountId, jid).catch(() => {});
  };

  const handleReset = async () => {
    if (!accountId) return;
    setWorkerError(null);
    try {
      await resetPairing(accountId);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Reset failed";
      setWorkerError(message);
    }
    void (async () => {
      try {
        const [nextState, nextChats] = await Promise.all([
          getState(accountId),
          listChats(accountId),
        ]);
        setState(nextState);
        setChats(nextChats);
        setWorkerError(null);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "WhatsApp worker unreachable";
        setWorkerError(message);
      }
    })();
  };

  const handleAddAccount = async () => {
    setAccountBusy(true);
    setWorkerError(null);
    try {
      const orgs = await listOrgSpaces();
      const firstOrg = orgs[0];
      if (!firstOrg) throw new Error("No organization found");
      const account = await createAccount(firstOrg.spaceId, "WhatsApp");
      const items = await listAccounts(firstOrg.spaceId);
      setAccounts(items);
      setAccountId(account.id);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not add account";
      setWorkerError(message);
    } finally {
      setAccountBusy(false);
    }
  };

  const handleDeleteAccount = async (id: string) => {
    setWorkerError(null);
    try {
      await deleteAccount(id);
      setAccounts((prev) => prev.filter((a) => a.id !== id));
      if (accountId === id) setAccountId(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not remove account";
      setWorkerError(message);
    }
  };

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || !selected || !accountId) return;
    setSending(true);
    try {
      await sendText(accountId, selected, text);
      setDraft("");
      const msgs = await getMessages(accountId, selected);
      setMessages(msgs);
    } catch {
      // keep draft on failure
    } finally {
      setSending(false);
    }
  };

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selected || !accountId) return;
    const type = mediaTypeFor(file.type);
    if (!type) return;
    try {
      const data = await fileToBase64(file);
      await sendMedia(accountId, { jid: selected, type, data });
      const msgs = await getMessages(accountId, selected);
      setMessages(msgs);
    } catch {
      // fall through
    }
    event.target.value = "";
  };

  const searching = query.trim().length > 0;
  const showResults = searching && (contacts.length > 0 || results.length > 0);

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-12 shrink-0 items-center justify-between gap-2 border-b border-border px-4">
        <div className="flex min-w-0 items-center gap-2">
          {accounts.length > 0 ? (
            <select
              value={accountId ?? ""}
              onChange={(e) => {
                setAccountId(e.target.value || null);
                setSelected(null);
              }}
              className="max-w-[180px] truncate rounded-md border border-border bg-background px-2 py-1 text-sm"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label}
                </option>
              ))}
            </select>
          ) : null}
          {accounts.length > 0 && accountId ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 shrink-0 text-xs text-muted-foreground"
              onClick={() => {
                if (accountId) void handleDeleteAccount(accountId);
              }}
              title="Remove this account"
            >
              Remove
            </Button>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {connected ? "Connected" : state?.connection ?? "…"}
          </span>
          {accounts.length === 0 ? (
            <Button
              size="sm"
              className="h-7 text-xs"
              disabled={accountBusy}
              onClick={() => void handleAddAccount()}
            >
              {accountBusy ? <Loader2 className="size-3.5 animate-spin" /> : null}
              Add channel
            </Button>
          ) : null}
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        {!compact || (connected && !selected) ? (
          <aside
            className={cn(
              "flex flex-col",
              compact ? "min-h-0 flex-1" : "w-72 shrink-0 border-r border-border",
            )}
          >
          <div className="shrink-0 border-b border-border p-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search contacts or messages…"
                className="pl-8"
              />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {searching ? (
              <div className="flex flex-col gap-1">
                {showResults ? null : (
                  <p className="px-2 py-4 text-center text-xs text-muted-foreground">
                    No matches.
                  </p>
                )}
                {contacts.map((contact) => (
                  <button
                    key={contact.jid}
                    type="button"
                    onClick={() => openChat(contact.jid)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-muted"
                  >
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                      {contact.name.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {contact.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {contact.jid}
                      </p>
                    </div>
                  </button>
                ))}
                {showResults ? (
                  <div className="mt-2 border-t border-border pt-2">
                    {results.map((msg) => (
                      <button
                        key={msg.id}
                        type="button"
                        onClick={() => openChat(msg.jid)}
                        className="block w-full truncate rounded-lg px-3 py-1.5 text-left text-sm hover:bg-muted"
                      >
                        <span className="text-muted-foreground">
                          {nameFor(msg.jid)}:{" "}
                        </span>
                        {mediaLabel(msg)}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {chats.length === 0 ? (
                  <p className="px-2 py-4 text-center text-xs text-muted-foreground">
                    {connected
                      ? "No chats synced yet."
                      : "Not connected to WhatsApp."}
                  </p>
                ) : null}
                {chats.map((chat) => (
                  <button
                    key={chat.jid}
                    type="button"
                    onClick={() => openChat(chat.jid)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-muted ${
                      selected === chat.jid ? "bg-muted/70" : ""
                    }`}
                  >
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                      {chat.name.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium">
                          {chat.name}
                        </p>
                        <span className="shrink-0 text-[10px] text-muted-foreground">
                          {timeAgo(chat.timestamp * 1000)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-xs text-muted-foreground">
                          {chat.lastMessage || (chat.isGroup ? "Group" : "Chat")}
                        </p>
                        {chat.unread > 0 ? (
                          <span className="shrink-0 rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
                            {chat.unread}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          </aside>
        ) : null}

        {!compact || !connected || selected ? (
          <main className="flex min-w-0 flex-1 flex-col">
          {workerError ? (
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
              <span className="min-w-0 truncate">
                {workerError === "whatsapp worker unreachable" ||
                workerError === "whatsapp worker not configured"
                  ? "WhatsApp worker is unreachable — is the channel worker running?"
                  : workerError}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0 text-destructive"
                onClick={() => void handleReset()}
              >
                <RotateCcw className="size-3.5" />
                Retry
              </Button>
            </div>
          ) : null}
          {!accountId ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center text-sm text-muted-foreground">
              <p>No WhatsApp channel selected for this organization.</p>
              <Button size="sm" disabled={accountBusy} onClick={() => void handleAddAccount()}>
                {accountBusy ? <Loader2 className="size-3.5 animate-spin" /> : null}
                Add a channel
              </Button>
            </div>
          ) : !connected ? (
            <QrPanel
              key={state?.qr ?? state?.connection ?? "none"}
              qr={state?.qr}
              connection={state?.connection ?? "connecting"}
              onReset={() => void handleReset()}
            />
          ) : !selected ? (
            <div className="flex h-full items-center justify-center p-6 text-center text-sm text-muted-foreground">
              Select a chat to start messaging.
            </div>
          ) : (
            <>
              <div className="shrink-0 border-b border-border px-4 py-3">
                {compact ? (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="-ml-2 size-7"
                      aria-label="Back to chats"
                      onClick={() => setSelected(null)}
                    >
                      <ArrowLeft className="size-4" />
                    </Button>
                    <p className="truncate text-sm font-semibold">
                      {nameFor(selected)}
                    </p>
                  </div>
                ) : (
                  <p className="truncate text-sm font-semibold">
                    {nameFor(selected)}
                  </p>
                )}
              </div>
              <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex w-fit max-w-[70%] flex-col gap-0.5 rounded-xl px-3 py-1.5 text-sm ${
                      msg.fromMe
                        ? "self-end bg-primary text-primary-foreground"
                        : "self-start bg-muted"
                    }`}
                  >
                    <span>{mediaLabel(msg)}</span>
                    <span
                      className={`text-[10px] ${
                        msg.fromMe
                          ? "text-primary-foreground/70"
                          : "text-muted-foreground"
                      }`}
                    >
                      {new Date(msg.timestamp * 1000).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex shrink-0 items-center gap-2 border-t border-border p-3">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*,video/*,audio/*"
                  className="hidden"
                  onChange={(e) => void handleFile(e)}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-9 shrink-0"
                  aria-label="Attach media"
                  onClick={() => fileRef.current?.click()}
                >
                  <Paperclip className="size-4" />
                </Button>
                <Input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) void handleSend();
                  }}
                  placeholder="Type a message…"
                />
                <Button
                  size="icon"
                  className="size-9 shrink-0"
                  aria-label="Send message"
                  disabled={sending || !draft.trim()}
                  onClick={() => void handleSend()}
                >
                  <Send className="size-4" />
                </Button>
              </div>
            </>
          )}
          </main>
        ) : null}
      </div>
    </div>
  );
}