"use client";

import { useState, type ReactNode } from "react";
import {
  CalendarDays,
  ExternalLink,
  MessageCircle,
  Package,
  Pin,
  PinOff,
  Sparkles,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DockPanel } from "@/components/app-shell/DockPanel";
import type { DockItem, DockItemType } from "./dock-context";

/* ------------------------------- Mock data ------------------------------- */

interface Person {
  id: string;
  name: string;
  role: string;
}

const PEOPLE: Person[] = [
  { id: "p1", name: "Maria Lopez", role: "Operations" },
  { id: "p2", name: "Jonas Weber", role: "Finance" },
  { id: "p3", name: "Priya Nair", role: "Design" },
];

interface Agent {
  id: string;
  name: string;
  status: "idle" | "busy" | "off";
}

const AGENTS: Agent[] = [
  { id: "a1", name: "Scheduler", status: "idle" },
  { id: "a2", name: "Inbox triage", status: "busy" },
  { id: "a3", name: "Inventory watcher", status: "off" },
];

interface Task {
  id: string;
  title: string;
  done: boolean;
}

const TASKS: Task[] = [
  { id: "t1", title: "Confirm Q3 supplier list", done: false },
  { id: "t2", title: "Draft event invite", done: false },
  { id: "t3", title: "Review onboarding doc", done: true },
];

interface AppCard {
  id: string;
  name: string;
  icon: LucideIcon;
  count: number;
}

const APPS: AppCard[] = [
  { id: "whatsapp", name: "WhatsApp", icon: MessageCircle, count: 4 },
  { id: "calendar", name: "Calendar", icon: CalendarDays, count: 9 },
  { id: "inventory", name: "Inventory", icon: Package, count: 12 },
];

const ACTIVITY: { id: string; text: string; time: string }[] = [
  { id: "e1", text: "Maria moved “Q3 supplier list” to Done", time: "2m" },
  { id: "e2", text: "Scheduler booked a standup", time: "1h" },
  { id: "e3", text: "WhatsApp connected by Jonas", time: "3h" },
];

const APPROVALS: { id: string; text: string; by: string }[] = [
  { id: "ap1", text: "Send newsletter draft", by: "Inbox triage" },
  { id: "ap2", text: "Invite 3 contractors", by: "Scheduler" },
];

const MEMORY: { id: string; text: string }[] = [
  { id: "m1", text: "Prefers brief updates before 10am" },
  { id: "m2", text: "Q3 supplier list confirmed 12 Aug" },
  { id: "m3", text: "Allergies: none recorded" },
];

const RESERVATIONS: { id: string; title: string; when: string }[] = [
  { id: "r1", title: "Standup", when: "Today 09:00" },
  { id: "r2", title: "Design review", when: "Today 14:30" },
];

const FILES: { id: string; name: string; size: string }[] = [
  { id: "f1", name: "onboarding.md", size: "4 KB" },
  { id: "f2", name: "suppliers.xlsx", size: "82 KB" },
  { id: "f3", name: "invite.png", size: "1.2 MB" },
];

const TIMELINE: { id: string; label: string; date: string }[] = [
  { id: "tl1", label: "Kickoff", date: "Aug 1" },
  { id: "tl2", label: "Supplier locked", date: "Aug 18" },
  { id: "tl3", label: "Go live", date: "Sep 5" },
];

const SKILLS: { id: string; name: string }[] = [
  { id: "s1", name: "Summarize email" },
  { id: "s2", name: "Book calendar" },
  { id: "s3", name: "Draft replies" },
];

const TOOLS: { id: string; name: string }[] = [
  { id: "tool1", name: "search-memory" },
  { id: "tool2", name: "send-whatsapp" },
  { id: "tool3", name: "read-calendar" },
];

/* ----------------------------- Panel content ----------------------------- */

function PeoplePanel() {
  return (
    <ul className="flex flex-col gap-2">
      {PEOPLE.map((person) => (
        <li key={person.id} className="flex items-center gap-2">
          <Avatar name={person.name} size="sm" />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-medium">{person.name}</span>
            <span className="truncate text-xs text-muted-foreground">
              {person.role}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}

function AgentsPanel() {
  return (
    <ul className="flex flex-col gap-2">
      {AGENTS.map((agent) => (
        <li key={agent.id} className="flex items-center gap-2">
          <span
            className={cn(
              "size-2 shrink-0 rounded-full",
              agent.status === "idle" && "bg-emerald-500",
              agent.status === "busy" && "bg-amber-500",
              agent.status === "off" && "bg-border",
            )}
          />
          <span className="flex-1 truncate text-sm font-medium">{agent.name}</span>
          <Badge variant="secondary">{agent.status}</Badge>
        </li>
      ))}
    </ul>
  );
}

function TasksPanel() {
  return (
    <ul className="flex flex-col gap-1.5">
      {TASKS.map((task) => (
        <li key={task.id} className="flex items-center gap-2 text-sm">
          <span
            className={cn(
              "flex size-4 shrink-0 items-center justify-center rounded border text-[10px]",
              task.done
                ? "border-space-accent bg-space-accent text-space-accent-foreground"
                : "border-border",
            )}
          >
            {task.done ? "✓" : ""}
          </span>
          <span
            className={cn(
              "flex-1 truncate",
              task.done && "text-muted-foreground line-through",
            )}
          >
            {task.title}
          </span>
        </li>
      ))}
    </ul>
  );
}

function AppsPanel() {
  const [hidden, setHidden] = useState<Record<string, boolean>>({});
  const [pinned, setPinned] = useState<Record<string, boolean>>({
    calendar: true,
  });
  const [configuring, setConfiguring] = useState<string | null>(null);

  const visible = APPS.filter((app) => !hidden[app.id]);

  if (visible.length === 0) {
    return <p className="text-sm text-muted-foreground">No apps visible.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {visible.map((app) => {
        const Icon = app.icon;
        const isPinned = pinned[app.id];
        return (
          <div key={app.id}>
            <div className="flex items-center gap-2 rounded-md border border-border p-2">
              <Icon className="size-4 shrink-0 text-muted-foreground" />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="flex items-center gap-1.5 truncate text-sm font-medium">
                  {app.name}
                  {isPinned ? (
                    <Pin className="size-3 shrink-0 text-space-accent" />
                  ) : null}
                </span>
                <span className="text-xs text-muted-foreground">
                  {app.count} pending
                </span>
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => setConfiguring(configuring === app.id ? null : app.id)}
              >
                Configure
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                aria-label={isPinned ? "Unpin" : "Pin"}
                onClick={() =>
                  setPinned((prev) => ({ ...prev, [app.id]: !prev[app.id] }))
                }
              >
                {isPinned ? (
                  <PinOff className="size-3.5" />
                ) : (
                  <Pin className="size-3.5" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                aria-label={`Hide ${app.name}`}
                onClick={() => setHidden((prev) => ({ ...prev, [app.id]: true }))}
              >
                <span className="text-muted-foreground">Hide</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                aria-label={`Open ${app.name}`}
              >
                <ExternalLink className="size-3.5" />
              </Button>
            </div>
            {configuring === app.id ? (
              <div className="mt-1 rounded-md border border-dashed border-border p-2 text-xs text-muted-foreground">
                Configure {app.name} (placeholder)
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function ActivityPanel() {
  return (
    <ul className="flex flex-col gap-2">
      {ACTIVITY.map((event) => (
        <li key={event.id} className="flex items-start gap-2 text-sm">
          <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-space-accent" />
          <span className="flex-1">{event.text}</span>
          <span className="shrink-0 text-xs text-muted-foreground">
            {event.time}
          </span>
        </li>
      ))}
    </ul>
  );
}

function ApprovalsPanel() {
  const [resolved, setResolved] = useState<Record<string, string>>({});
  const pending = APPROVALS.filter((a) => !resolved[a.id]);
  if (pending.length === 0) {
    return <p className="text-sm text-muted-foreground">Nothing to approve.</p>;
  }
  return (
    <ul className="flex flex-col gap-2">
      {pending.map((approval) => (
        <li key={approval.id} className="rounded-md border border-border p-2">
          <p className="text-sm">{approval.text}</p>
          <p className="text-xs text-muted-foreground">by {approval.by}</p>
          <div className="mt-1.5 flex gap-1">
            <Button
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setResolved((prev) => ({ ...prev, [approval.id]: "ok" }))}
            >
              Approve
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setResolved((prev) => ({ ...prev, [approval.id]: "no" }))}
            >
              Deny
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}

function MemoryPanel() {
  return (
    <ul className="flex flex-col gap-1.5">
      {MEMORY.map((entry) => (
        <li key={entry.id} className="flex items-start gap-2 text-sm">
          <Sparkles className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
          <span className="flex-1">{entry.text}</span>
        </li>
      ))}
    </ul>
  );
}

function ProfilePanel() {
  return (
    <div className="flex items-center gap-3">
      <Avatar name="Maria Lopez" size="lg" />
      <div className="flex min-w-0 flex-col">
        <span className="text-sm font-medium">Maria Lopez</span>
        <span className="text-xs text-muted-foreground">Operations</span>
        <span className="text-xs text-muted-foreground">maria@example.com</span>
      </div>
    </div>
  );
}

function ReservationsPanel() {
  return (
    <ul className="flex flex-col gap-2">
      {RESERVATIONS.map((reservation) => (
        <li key={reservation.id} className="flex items-center justify-between text-sm">
          <span className="truncate font-medium">{reservation.title}</span>
          <span className="shrink-0 text-xs text-muted-foreground">
            {reservation.when}
          </span>
        </li>
      ))}
    </ul>
  );
}

function FilesPanel() {
  return (
    <ul className="flex flex-col gap-1.5">
      {FILES.map((file) => (
        <li key={file.id} className="flex items-center justify-between text-sm">
          <span className="truncate">{file.name}</span>
          <span className="shrink-0 text-xs text-muted-foreground">{file.size}</span>
        </li>
      ))}
    </ul>
  );
}

function TimelinePanel() {
  return (
    <ol className="flex flex-col gap-2">
      {TIMELINE.map((milestone) => (
        <li key={milestone.id} className="flex items-center gap-2 text-sm">
          <span className="size-1.5 shrink-0 rounded-full bg-space-accent" />
          <span className="flex-1 truncate">{milestone.label}</span>
          <span className="shrink-0 text-xs text-muted-foreground">
            {milestone.date}
          </span>
        </li>
      ))}
    </ol>
  );
}

function BudgetPanel() {
  return (
    <div className="flex flex-col gap-2 text-sm">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">Spent</span>
        <span className="font-medium">$18,400</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">Budget</span>
        <span className="font-medium">$50,000</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full w-[37%] rounded-full bg-space-accent" />
      </div>
    </div>
  );
}

function CurrentTaskPanel() {
  return (
    <div className="rounded-md border border-border p-2">
      <p className="text-sm font-medium">Confirm Q3 supplier list</p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Waiting on three vendor replies. Due today 17:00.
      </p>
    </div>
  );
}

function SkillsPanel() {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {SKILLS.map((skill) => (
        <li key={skill.id}>
          <Badge variant="secondary">{skill.name}</Badge>
        </li>
      ))}
    </ul>
  );
}

function ToolsPanel() {
  return (
    <ul className="flex flex-col gap-1.5">
      {TOOLS.map((tool) => (
        <li key={tool.id} className="flex items-center gap-2 text-sm">
          <Wrench className="size-3.5 text-muted-foreground" />
          <span className="font-mono text-xs">{tool.name}</span>
        </li>
      ))}
    </ul>
  );
}

function RelationshipPanel() {
  return (
    <div className="flex flex-col gap-1.5 text-sm">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">Works with</span>
        <span>3 teammates</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">Reports to</span>
        <span>Jonas Weber</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">Last touch</span>
        <span>2 days ago</span>
      </div>
    </div>
  );
}

/* ------------------------------ Panel router ----------------------------- */

const PANELS: Record<
  DockItemType,
  (item: DockItem) => ReactNode
> = {
  people: () => <PeoplePanel />,
  agents: () => <AgentsPanel />,
  tasks: () => <TasksPanel />,
  apps: () => <AppsPanel />,
  activity: () => <ActivityPanel />,
  approvals: () => <ApprovalsPanel />,
  memory: () => <MemoryPanel />,
  profile: () => <ProfilePanel />,
  reservations: () => <ReservationsPanel />,
  files: () => <FilesPanel />,
  timeline: () => <TimelinePanel />,
  budget: () => <BudgetPanel />,
  currentTask: () => <CurrentTaskPanel />,
  skills: () => <SkillsPanel />,
  tools: () => <ToolsPanel />,
  relationship: () => <RelationshipPanel />,
};

export function DockItemPanel({ item }: { item: DockItem }) {
  const render = PANELS[item.type];
  const Icon = item.icon;
  return (
    <DockPanel title={item.label} icon={Icon}>
      {render ? render(item) : null}
    </DockPanel>
  );
}

export function renderDockItems(items: DockItem[]) {
  return items.map((item) => <DockItemPanel key={item.id} item={item} />);
}
