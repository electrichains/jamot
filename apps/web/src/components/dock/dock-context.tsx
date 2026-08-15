"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  AppWindow,
  Bot,
  CalendarRange,
  ChartGantt,
  Folder,
  Heart,
  MemoryStick,
  ShieldCheck,
  Sparkles,
  SquareCheck,
  Target,
  User,
  Users,
  Wallet,
  Wrench,
} from "lucide-react";

export type DockContextKind = "space" | "project" | "conversation" | "actor";

export type ActorKind = "human" | "agent";

export interface DockContext {
  kind: DockContextKind;
  id?: string;
  actorKind?: ActorKind;
}

export type DockItemType =
  | "people"
  | "agents"
  | "tasks"
  | "apps"
  | "activity"
  | "approvals"
  | "memory"
  | "profile"
  | "reservations"
  | "files"
  | "timeline"
  | "budget"
  | "currentTask"
  | "skills"
  | "tools"
  | "relationship";

export interface DockItem {
  id: string;
  type: DockItemType;
  label: string;
  icon?: LucideIcon;
}

const ICONS: Record<DockItemType, LucideIcon> = {
  people: Users,
  agents: Bot,
  tasks: SquareCheck,
  apps: AppWindow,
  activity: Activity,
  approvals: ShieldCheck,
  memory: MemoryStick,
  profile: User,
  reservations: CalendarRange,
  files: Folder,
  timeline: ChartGantt,
  budget: Wallet,
  currentTask: Target,
  skills: Sparkles,
  tools: Wrench,
  relationship: Heart,
};

const LABELS: Record<DockItemType, string> = {
  people: "People",
  agents: "Agents",
  tasks: "Tasks",
  apps: "Apps",
  activity: "Activity",
  approvals: "Approvals",
  memory: "Memory",
  profile: "Profile",
  reservations: "Reservations",
  files: "Files",
  timeline: "Timeline",
  budget: "Budget",
  currentTask: "Current task",
  skills: "Skills",
  tools: "Tools",
  relationship: "Relationship",
};

function item(type: DockItemType): DockItem {
  return { id: type, type, label: LABELS[type], icon: ICONS[type] };
}

/**
 * Deterministic, policy-controlled mapping from the current context to the
 * ordered list of panels that should be shown in the Context Dock.
 *
 * This mirrors the backend App Resolver: for a given context (space / project /
 * conversation / actor) the same panels are always produced in the same order.
 */
export function resolveDockItems(ctx: DockContext): DockItem[] {
  switch (ctx.kind) {
    case "actor":
      if (ctx.actorKind === "agent") {
        return [
          item("currentTask"),
          item("skills"),
          item("memory"),
          item("tools"),
          item("activity"),
          item("approvals"),
        ];
      }
      return [
        item("profile"),
        item("memory"),
        item("tasks"),
        item("files"),
        item("relationship"),
      ];
    case "project":
      return [
        item("people"),
        item("agents"),
        item("tasks"),
        item("timeline"),
        item("budget"),
        item("apps"),
      ];
    case "conversation":
      return [
        item("people"),
        item("agents"),
        item("tasks"),
        item("files"),
        item("activity"),
        item("memory"),
      ];
    case "space":
    default:
      return [
        item("people"),
        item("agents"),
        item("tasks"),
        item("apps"),
        item("activity"),
      ];
  }
}

const DEFAULT_CONTEXT: DockContext = { kind: "space" };

interface DockState {
  context: DockContext;
  setContext: (context: DockContext) => void;
  items: DockItem[];
}

const DockContextValue = createContext<DockState | null>(null);

export function DockProvider({ children }: { children: ReactNode }) {
  const [context, setContext] = useState<DockContext>(DEFAULT_CONTEXT);

  const value = useMemo<DockState>(
    () => ({
      context,
      setContext,
      items: resolveDockItems(context),
    }),
    [context],
  );

  return (
    <DockContextValue.Provider value={value}>
      {children}
    </DockContextValue.Provider>
  );
}

export function useDock(): DockState {
  const context = useContext(DockContextValue);
  if (!context) {
    throw new Error("useDock must be used within a DockProvider");
  }
  return context;
}
