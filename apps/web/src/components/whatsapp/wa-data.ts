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