"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  getOrganizations,
  type OrganizationListItem,
  type OrgRole,
} from "@/lib/api-client";

export interface Space {
  id: string;
  name: string;
  accent: string;
  accentForeground: string;
  kind?: "personal" | "organization";
  organizationId?: string;
  spaceId?: string;
  role?: OrgRole;
}

export const PERSONAL_SPACE: Space = {
  id: "personal",
  name: "Personal Space",
  accent: "#7c3aed",
  accentForeground: "#ffffff",
  kind: "personal",
};

export const SPACES: Space[] = [PERSONAL_SPACE];

const ORG_ACCENTS: { accent: string; accentForeground: string }[] = [
  { accent: "#0ea5e9", accentForeground: "#ffffff" },
  { accent: "#10b981", accentForeground: "#022c22" },
  { accent: "#f59e0b", accentForeground: "#1c1917" },
  { accent: "#ec4899", accentForeground: "#ffffff" },
  { accent: "#8b5cf6", accentForeground: "#ffffff" },
  { accent: "#f43f5e", accentForeground: "#ffffff" },
  { accent: "#14b8a6", accentForeground: "#042f2e" },
  { accent: "#6366f1", accentForeground: "#ffffff" },
];

export type SectionId =
  | "tasks"
  | "people"
  | "agents"
  | "organization"
  | "canvas"
  | "whatsapp"
  | "calendar"
  | "inventory"
  | "crm"
  | "finance";

export const SECTION_TITLES: Record<SectionId, string> = {
  tasks: "Tasks",
  people: "People",
  agents: "Agents",
  organization: "Organization",
  canvas: "Canvas",
  whatsapp: "WhatsApp",
  calendar: "Calendar",
  inventory: "Inventory",
  crm: "CRM",
  finance: "Finance",
};

export type OrganizationsLoader = () => Promise<OrganizationListItem[]>;

interface AppShellState {
  leftSize: number;
  rightSize: number;
  space: Space;
  spaces: Space[];
  activeSection: SectionId | null;
  organizations: OrganizationListItem[];
  organizationsLoading: boolean;
  reloadOrganizations: () => Promise<void>;
  setLeftSize: (size: number) => void;
  setRightSize: (size: number) => void;
  setSpace: (id: string) => void;
  setActiveSection: (id: SectionId | null) => void;
}

const AppShellContext = createContext<AppShellState | null>(null);

export const DEFAULT_LEFT_SIZE = 240;
export const DEFAULT_RIGHT_SIZE = 320;
export const DEFAULT_SECTION_WIDTH = 640;

function spaceFromOrganization(item: OrganizationListItem, index: number): Space {
  const palette = ORG_ACCENTS[index % ORG_ACCENTS.length];
  return {
    id: item.organization.id,
    name: item.space.name || "Organization",
    accent: palette.accent,
    accentForeground: palette.accentForeground,
    kind: "organization",
    organizationId: item.organization.id,
    spaceId: item.space.id,
    role: item.role,
  };
}

export function AppShellProvider({
  children,
  loadOrganizations = getOrganizations,
}: {
  children: ReactNode;
  loadOrganizations?: OrganizationsLoader;
}) {
  const [leftSize, setLeftSize] = useState(DEFAULT_LEFT_SIZE);
  const [rightSize, setRightSize] = useState(DEFAULT_RIGHT_SIZE);
  const [spaceId, setSpaceId] = useState("personal");
  const [activeSection, setActiveSection] = useState<SectionId | null>(null);
  const [organizations, setOrganizations] = useState<OrganizationListItem[]>([]);
  const [organizationsLoading, setOrganizationsLoading] = useState(true);

  const spaces = useMemo<Space[]>(
    () => [
      PERSONAL_SPACE,
      ...organizations.map((item, index) => spaceFromOrganization(item, index)),
    ],
    [organizations],
  );

  const reloadOrganizations = useCallback(async () => {
    try {
      const items = await loadOrganizations();
      setOrganizations(items);
    } catch {
      setOrganizations([]);
    } finally {
      setOrganizationsLoading(false);
    }
  }, [loadOrganizations]);

  useEffect(() => {
    let cancelled = false;
    loadOrganizations()
      .then((items) => {
        if (!cancelled) setOrganizations(items);
      })
      .catch(() => {
        if (!cancelled) setOrganizations([]);
      })
      .finally(() => {
        if (!cancelled) setOrganizationsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [loadOrganizations]);

  const setSpace = useCallback(
    (id: string) => {
      setSpaceId((current) => {
        if (!id) return current;
        if (spaces.some((candidate) => candidate.id === id)) return id;
        return current === "personal" || spaces.some((c) => c.id === current)
          ? current
          : "personal";
      });
    },
    [spaces],
  );

  const value = useMemo<AppShellState>(() => {
    const space =
      spaces.find((candidate) => candidate.id === spaceId) ?? PERSONAL_SPACE;
    return {
      leftSize,
      rightSize,
      space,
      spaces,
      activeSection,
      organizations,
      organizationsLoading,
      reloadOrganizations,
      setLeftSize,
      setRightSize,
      setSpace,
      setActiveSection,
    };
  }, [
    leftSize,
    rightSize,
    spaceId,
    spaces,
    activeSection,
    organizations,
    organizationsLoading,
    reloadOrganizations,
    setSpace,
  ]);

  return <AppShellContext.Provider value={value}>{children}</AppShellContext.Provider>;
}

export function useAppShell(): AppShellState {
  const context = useContext(AppShellContext);
  if (!context) {
    throw new Error("useAppShell must be used within an AppShellProvider");
  }
  return context;
}