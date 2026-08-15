"use client";

import { useState } from "react";
import { Check, MessageSquare, Pencil, X } from "lucide-react";

import { cn } from "@/lib/utils";

export interface ChatHistoryItem {
  id: string;
  title: string;
  date: Date;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(value: Date): Date {
  const copy = new Date(value);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function daysAgo(days: number): Date {
  return new Date(startOfDay(new Date()).getTime() - days * DAY_MS);
}

function buildMockConversations(): ChatHistoryItem[] {
  return [
    { id: "c1", title: "Customer complaint — Maria", date: daysAgo(0) },
    { id: "c2", title: "Draft a reply to the printer vendor", date: daysAgo(0) },
    { id: "c3", title: "Friday sales review", date: daysAgo(1) },
    { id: "c4", title: "Event planning", date: daysAgo(3) },
    { id: "c5", title: "Quarterly OKR check-in", date: daysAgo(5) },
    { id: "c6", title: "Onboard new designer", date: daysAgo(9) },
    { id: "c7", title: "Website copy pass", date: daysAgo(21) },
  ];
}

type GroupKey = "Today" | "Yesterday" | "Previous 7 days" | "Older";

const GROUP_ORDER: GroupKey[] = ["Today", "Yesterday", "Previous 7 days", "Older"];

function groupFor(date: Date, today: Date): GroupKey {
  const diffDays = Math.round(
    (startOfDay(today).getTime() - startOfDay(date).getTime()) / DAY_MS,
  );
  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return "Previous 7 days";
  return "Older";
}

export function ChatHistory() {
  const [items, setItems] = useState<ChatHistoryItem[]>(buildMockConversations);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const today = startOfDay(new Date());

  const groups = GROUP_ORDER.map((key) => ({
    key,
    items: items.filter((item) => groupFor(item.date, today) === key),
  })).filter((group) => group.items.length > 0);

  const beginEdit = (item: ChatHistoryItem) => {
    setEditingId(item.id);
    setDraft(item.title);
  };

  const commitEdit = (id: string) => {
    const next = draft.trim();
    if (next) {
      setItems((current) =>
        current.map((item) => (item.id === id ? { ...item, title: next } : item)),
      );
    }
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft("");
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-10 shrink-0 items-center px-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Chats
      </div>
      <div className="flex-1 overflow-y-auto px-2 pb-3">
        {groups.map((group) => (
          <section key={group.key} className="mb-3">
            <h3 className="px-2 pb-1 pt-2 text-xs font-medium text-muted-foreground">
              {group.key}
            </h3>
            <ul className="flex flex-col gap-0.5">
              {group.items.map((item) => (
                <li key={item.id}>
                  {editingId === item.id ? (
                    <div className="flex items-center gap-1 rounded-lg bg-muted px-2 py-1.5">
                      <MessageSquare className="size-4 shrink-0 text-muted-foreground" />
                      <input
                        autoFocus
                        value={draft}
                        onChange={(event) => setDraft(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") commitEdit(item.id);
                          if (event.key === "Escape") cancelEdit();
                        }}
                        onBlur={() => commitEdit(item.id)}
                        className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                      />
                      <button
                        type="button"
                        aria-label="Save title"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => commitEdit(item.id)}
                        className="rounded p-0.5 text-muted-foreground hover:text-foreground"
                      >
                        <Check className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        aria-label="Cancel rename"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={cancelEdit}
                        className="rounded p-0.5 text-muted-foreground hover:text-foreground"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="group flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                      <MessageSquare className="size-4 shrink-0" />
                      <button
                        type="button"
                        onClick={() => beginEdit(item)}
                        className="min-w-0 flex-1 truncate text-left"
                        title={item.title}
                      >
                        {item.title}
                      </button>
                      <button
                        type="button"
                        aria-label="Rename"
                        onClick={() => beginEdit(item)}
                        className={cn(
                          "rounded p-0.5 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100",
                        )}
                      >
                        <Pencil className="size-3.5" />
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
