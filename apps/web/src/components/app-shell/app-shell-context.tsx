"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export interface Space {
  id: string;
  name: string;
  accent: string;
  accentForeground: string;
}

export const SPACES: Space[] = [
  {
    id: "personal",
    name: "Personal Space",
    accent: "#7c3aed",
    accentForeground: "#ffffff",
  },
  {
    id: "restaurant",
    name: "Restaurant Co.",
    accent: "#f59e0b",
    accentForeground: "#1c1917",
  },
  {
    id: "construction",
    name: "Construction Co.",
    accent: "#3b82f6",
    accentForeground: "#ffffff",
  },
  {
    id: "event",
    name: "Event Venture",
    accent: "#10b981",
    accentForeground: "#022c22",
  },
];

export type AppId = "whatsapp" | "calendar" | "inventory" | "crm" | "finance";

export const APP_TITLES: Record<AppId, string> = {
  whatsapp: "WhatsApp",
  calendar: "Calendar",
  inventory: "Inventory",
  crm: "CRM",
  finance: "Finance",
};

interface AppShellState {
  leftSize: number;
  rightSize: number;
  space: Space;
  activeApp: AppId | null;
  setLeftSize: (size: number) => void;
  setRightSize: (size: number) => void;
  setSpace: (id: string) => void;
  setActiveApp: (id: AppId | null) => void;
}

const AppShellContext = createContext<AppShellState | null>(null);

export const DEFAULT_LEFT_SIZE = 240;
export const DEFAULT_RIGHT_SIZE = 320;

export function AppShellProvider({ children }: { children: ReactNode }) {
  const [leftSize, setLeftSize] = useState(DEFAULT_LEFT_SIZE);
  const [rightSize, setRightSize] = useState(DEFAULT_RIGHT_SIZE);
  const [spaceId, setSpaceId] = useState("personal");
  const [activeApp, setActiveApp] = useState<AppId | null>(null);

  const value = useMemo<AppShellState>(() => {
    const space = SPACES.find((candidate) => candidate.id === spaceId) ?? SPACES[0];
    return {
      leftSize,
      rightSize,
      space,
      activeApp,
      setLeftSize,
      setRightSize,
      setSpace: setSpaceId,
      setActiveApp,
    };
  }, [leftSize, rightSize, spaceId, activeApp]);

  return <AppShellContext.Provider value={value}>{children}</AppShellContext.Provider>;
}

export function useAppShell(): AppShellState {
  const context = useContext(AppShellContext);
  if (!context) {
    throw new Error("useAppShell must be used within an AppShellProvider");
  }
  return context;
}
