import { API_URL } from "@/components/auth/auth-context";
import type { WaChat, WaContact, WaMessage, WaState } from "./wa-data";

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `request failed (${res.status})`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export function getState(): Promise<WaState> {
  return api<WaState>("/api/wa/state");
}

export async function listChats(): Promise<WaChat[]> {
  const data = await api<{ items: WaChat[] }>("/api/wa/chats");
  return data.items;
}

export async function listContacts(query?: string): Promise<WaContact[]> {
  const q = query?.trim() ? `?q=${encodeURIComponent(query.trim())}` : "";
  const data = await api<{ items: WaContact[] }>(`/api/wa/contacts${q}`);
  return data.items;
}

export async function getMessages(jid: string): Promise<WaMessage[]> {
  const data = await api<{ items: WaMessage[] }>(
    `/api/wa/messages?jid=${encodeURIComponent(jid)}`,
  );
  return data.items;
}

export async function searchMessages(query: string): Promise<WaMessage[]> {
  const data = await api<{ items: WaMessage[] }>(
    `/api/wa/search?q=${encodeURIComponent(query)}`,
  );
  return data.items;
}

export function sendText(jid: string, text: string): Promise<unknown> {
  return api("/api/wa/send", {
    method: "POST",
    body: JSON.stringify({ jid, text }),
  });
}

export function sendMedia(input: {
  jid: string;
  type: "image" | "video" | "audio";
  data: string;
  caption?: string;
}): Promise<unknown> {
  return api("/api/wa/media", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function markRead(jid: string): Promise<unknown> {
  return api("/api/wa/read", {
    method: "POST",
    body: JSON.stringify({ jid }),
  });
}