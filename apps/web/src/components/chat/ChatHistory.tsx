"use client";

import { useState } from "react";
import {
  Check,
  ChevronRight,
  FolderKanban,
  MessageSquare,
  Pencil,
  Sparkles,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";

export interface ChatHistoryItem {
  id: string;
  title: string;
  date: Date;
}

interface Project {
  id: string;
  title: string;
  /** Auto-derived project memory (summaries/facts from its conversations). */
  memory: string[];
  chats: ChatHistoryItem[];
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

const PROJECTS: Project[] = [
  {
    id: "p1",
    title: "Restaurant Opening",
    memory: [
      "Budget approved: $50k",
      "3 suppliers shortlisted",
      "Target open date: Sep 5",
    ],
    chats: [
      { id: "c1", title: "Customer complaint — Maria", date: daysAgo(0) },
      { id: "c2", title: "Friday sales review", date: daysAgo(1) },
      { id: "c3", title: "Supplier discussion", date: daysAgo(2) },
    ],
  },
  {
    id: "p2",
    title: "Q4 Sales",
    memory: ["Target: +15% QoQ", "4 leads in negotiation"],
    chats: [
      { id: "c4", title: "Quarterly OKR check-in", date: daysAgo(5) },
      { id: "c5", title: "Draft a reply to the printer vendor", date: daysAgo(0) },
    ],
  },
];

const LOOSE_CHATS: ChatHistoryItem[] = [
  { id: "l1", title: "Event planning", date: daysAgo(3) },
  { id: "l2", title: "Onboard new designer", date: daysAgo(9) },
  { id: "l3", title: "Website copy pass", date: daysAgo(21) },
];

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

interface ChatRowProps {
  item: ChatHistoryItem;
  editing: boolean;
  draft: string;
  onDraftChange: (value: string) => void;
  onBeginEdit: () => void;
  onCommit: () => void;
  onCancel: () => void;
}

function ChatRow({
  item,
  editing,
  draft,
  onDraftChange,
  onBeginEdit,
  onCommit,
  onCancel,
}: ChatRowProps) {
  if (editing) {
    return (
      <div className="flex items-center gap-1 rounded-xl bg-muted/80 px-2 py-1">
        <MessageSquare className="size-3.5 shrink-0 text-muted-foreground" />
        <input
          autoFocus
          value={draft}
          onChange={(event) => onDraftChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") onCommit();
            if (event.key === "Escape") onCancel();
          }}
          onBlur={onCommit}
          className="min-w-0 flex-1 bg-transparent text-xs outline-none"
        />
        <button
          type="button"
          aria-label="Save title"
          onMouseDown={(event) => event.preventDefault()}
          onClick={onCommit}
          className="rounded-md p-0.5 text-muted-foreground hover:text-foreground"
        >
          <Check className="size-3" />
        </button>
        <button
          type="button"
          aria-label="Cancel rename"
          onMouseDown={(event) => event.preventDefault()}
          onClick={onCancel}
          className="rounded-md p-0.5 text-muted-foreground hover:text-foreground"
        >
          <X className="size-3" />
        </button>
      </div>
    );
  }

  return (
    <div className="group flex items-center gap-2 rounded-xl px-2 py-1 text-[13px] text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground">
      <MessageSquare className="size-3.5 shrink-0 opacity-60 group-hover:opacity-100" />
      <button
        type="button"
        onClick={onBeginEdit}
        className="min-w-0 flex-1 truncate text-left"
        title={item.title}
      >
        {item.title}
      </button>
      <button
        type="button"
        aria-label="Rename"
        onClick={onBeginEdit}
        className={cn(
          "rounded-md p-0.5 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100",
        )}
      >
        <Pencil className="size-3" />
      </button>
    </div>
  );
}

export function ChatHistory({ searchQuery = "" }: { searchQuery?: string }) {
  const [projects, setProjects] = useState<Project[]>(PROJECTS);
  const [looseChats, setLooseChats] = useState<ChatHistoryItem[]>(LOOSE_CHATS);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ p1: true });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const today = startOfDay(new Date());

  const query = searchQuery.trim().toLowerCase();

  const filteredProjects = projects
    .map((p) => ({
      ...p,
      chats: p.chats.filter(
        (c) => !query || c.title.toLowerCase().includes(query) || p.title.toLowerCase().includes(query),
      ),
    }))
    .filter((p) => !query || p.chats.length > 0 || p.title.toLowerCase().includes(query));

  const filteredLoose = looseChats.filter(
    (c) => !query || c.title.toLowerCase().includes(query),
  );

  const groups = GROUP_ORDER.map((key) => ({
    key,
    items: filteredLoose.filter((item) => groupFor(item.date, today) === key),
  })).filter((group) => group.items.length > 0);

  const beginEdit = (id: string, title: string) => {
    setEditingId(id);
    setDraft(title);
  };

  const commitEdit = () => {
    const next = draft.trim();
    if (next && editingId) {
      setProjects((current) =>
        current.map((project) => ({
          ...project,
          chats: project.chats.map((chat) =>
            chat.id === editingId ? { ...chat, title: next } : chat,
          ),
        })),
      );
      setLooseChats((current) =>
        current.map((chat) => (chat.id === editingId ? { ...chat, title: next } : chat)),
      );
    }
    setEditingId(null);
    setDraft("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft("");
  };

  const toggleProject = (id: string) => {
    setExpanded((current) => ({ ...current, [id]: !current[id] }));
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto px-2 py-2">
        {filteredProjects.length > 0 ? (
          <section className="mb-3">
            <h3 className="px-2 pb-1 text-[11px] font-medium tracking-wide uppercase text-muted-foreground/70">
              Projects
            </h3>
            <ul className="flex flex-col gap-0.5">
              {filteredProjects.map((project) => {
                const open = expanded[project.id];
                return (
                  <li key={project.id}>
                    <button
                      type="button"
                      onClick={() => toggleProject(project.id)}
                      className="flex w-full items-center gap-2 rounded-xl px-2 py-1 text-[13px] font-medium text-foreground transition-colors hover:bg-muted/70"
                    >
                      <ChevronRight
                        className={cn(
                          "size-3 shrink-0 text-muted-foreground transition-transform duration-200",
                          open && "rotate-90",
                        )}
                      />
                      <FolderKanban className="size-3.5 shrink-0 text-space-accent/80" />
                      <span className="min-w-0 flex-1 truncate text-left">
                        {project.title}
                      </span>
                      <span className="shrink-0 text-[11px] text-muted-foreground">
                        {project.chats.length}
                      </span>
                    </button>

                    {open ? (
                      <div className="ml-3.5 flex flex-col gap-0.5 border-l border-border/40 pl-2.5 pb-1">
                        {project.memory.length > 0 ? (
                          <div className="my-1 flex flex-col gap-0.5 rounded-xl border-l-2 border-space-accent/40 bg-gradient-to-r from-space-accent/8 to-transparent px-2 py-1.5">
                            <span className="flex items-center gap-1 text-[10px] font-medium tracking-wide uppercase text-space-accent">
                              <Sparkles className="size-2.5" />
                              Memory
                            </span>
                            {project.memory.map((entry) => (
                              <span
                                key={entry}
                                className="text-[11px] leading-snug text-muted-foreground"
                              >
                                {entry}
                              </span>
                            ))}
                          </div>
                        ) : null}
                        {project.chats.map((chat) => (
                          <ChatRow
                            key={chat.id}
                            item={chat}
                            editing={editingId === chat.id}
                            draft={draft}
                            onDraftChange={setDraft}
                            onBeginEdit={() => beginEdit(chat.id, chat.title)}
                            onCommit={commitEdit}
                            onCancel={cancelEdit}
                          />
                        ))}
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}

        {groups.map((group) => (
          <section key={group.key} className="mb-3">
            <h3 className="px-2 pb-1 text-[11px] font-medium tracking-wide uppercase text-muted-foreground/70">
              {group.key}
            </h3>
            <ul className="flex flex-col gap-0.5">
              {group.items.map((item) => (
                <li key={item.id}>
                  <ChatRow
                    item={item}
                    editing={editingId === item.id}
                    draft={draft}
                    onDraftChange={setDraft}
                    onBeginEdit={() => beginEdit(item.id, item.title)}
                    onCommit={commitEdit}
                    onCancel={cancelEdit}
                  />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
