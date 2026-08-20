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
  resolveOrganizationBySubdomain,
  type OrganizationListItem,
  type OrgRole,
} from "@/lib/api-client";

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN;

function currentSubdomain(): string | null {
  if (!ROOT_DOMAIN || typeof window === "undefined") return null;
  const host = window.location.hostname;
  const suffix = `.${ROOT_DOMAIN}`;
  if (!host.endsWith(suffix)) return null;
  const sub = host.slice(0, -suffix.length);
  if (!sub || ["www", "app", "api", "mvp", "mail"].includes(sub)) return null;
  return sub;
}

export interface Space {
  id: string;
  name: string;
  accent: string;
  accentForeground: string;
  kind?: "personal" | "organization";
  organizationId?: string;
  workspaceId?: string;
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
  | "suppliers"
  | "crm"
  | "leads"
  | "outreach"
  | "finance";

export const SECTION_TITLES: Record<SectionId, string> = {
  tasks: "Tasks",
  people: "People",
  agents: "Agents",
  organization: "Organization",
  canvas: "Canvas",
  whatsapp: "WhatsApp",
  calendar: "Calendar",
  suppliers: "Suppliers",
  inventory: "Inventory",
  crm: "CRM",
  leads: "Leads",
  outreach: "Outreach",
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

const SPACE_KEY = "jamot:space";

function spaceFromOrganization(item: OrganizationListItem, index: number): Space[] {
  const palette = ORG_ACCENTS[index % ORG_ACCENTS.length];
  const orgSpaces: Space[] = (item.workspaces ?? []).map((workspace) => ({
    id: workspace.spaceId,
    name: workspace.name || item.space.name || "Organization",
    accent: palette.accent,
    accentForeground: palette.accentForeground,
    kind: "organization",
    organizationId: item.organization.id,
    workspaceId: workspace.id,
    spaceId: workspace.spaceId,
    role: item.role,
  }));
  // Fallback: if an org somehow has no workspace row yet, expose its primary space.
  if (orgSpaces.length === 0) {
    orgSpaces.push({
      id: item.space.id,
      name: item.space.name || "Organization",
      accent: palette.accent,
      accentForeground: palette.accentForeground,
      kind: "organization",
      organizationId: item.organization.id,
      spaceId: item.space.id,
      role: item.role,
    });
  }
  return orgSpaces;
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
  const [activeSection, setActiveSection] = useState<SectionId | null>(null);
  const [organizations, setOrganizations] = useState<OrganizationListItem[]>([]);
  const [organizationsLoading, setOrganizationsLoading] = useState(true);

  const spaces = useMemo<Space[]>(() => {
    const orgSpaces = organizations.flatMap((item, index) =>
      spaceFromOrganization(item, index),
    );
    return [PERSONAL_SPACE, ...orgSpaces];
  }, [organizations]);

  const [spaceId, setSpaceId] = useState<string>(() => {
    try {
      const saved = window.localStorage.getItem(SPACE_KEY);
      return saved || "personal";
    } catch {
      return "personal";
    }
  });

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
        if (spaces.some((candidate) => candidate.id === id)) {
          try {
            window.localStorage.setItem(SPACE_KEY, id);
          } catch {
            // ignore storage errors
          }
          return id;
        }
        return current === "personal" || spaces.some((c) => c.id === current)
          ? current
          : "personal";
      });
    },
    [spaces],
  );

  // Subdomain auto-activation: visiting <org>.jamot.pro activates that org's
  // default workspace once the org list is ready.
  useEffect(() => {
    const sub = currentSubdomain();
    if (!sub || organizationsLoading) return;
    let cancelled = false;
    void (async () => {
      try {
        const resolved = await resolveOrganizationBySubdomain(sub);
        if (cancelled) return;
        const defaultWorkspace =
          resolved.workspaces.find((w) => w.spaceId === resolved.organization.spaceId) ??
          resolved.workspaces[0];
        if (defaultWorkspace) setSpace(defaultWorkspace.spaceId);
      } catch {
        // no access / not found — behave like root
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationsLoading]);

  // Real-time (instant) refresh: whenever the active space changes, reload the
  // org list so names, logos and workspaces reflect the current tenant.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional refresh on tenant switch
    void reloadOrganizations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spaceId]);

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

/** Like useAppShell, but returns null when rendered outside AppShellProvider.
 * Use for components that can appear on auth/login surfaces (e.g. brand logos). */
export function useOptionalAppShell(): AppShellState | null {
  return useContext(AppShellContext);
}