"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  getApps,
  getOrganizationApps,
  getOrganizations,
  resolveOrganizationBySubdomain,
  setOrganizationApps,
  type AppManifest,
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

function arrayMove<T>(arr: T[], from: number, to: number): T[] {
  const copy = arr.slice();
  const [moved] = copy.splice(from, 1);
  copy.splice(to, 0, moved);
  return copy;
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
  accent: "#e11d48",
  accentForeground: "#ffffff",
  kind: "personal",
};

export const SPACES: Space[] = [PERSONAL_SPACE];

const ORG_ACCENTS: { accent: string; accentForeground: string }[] = [
  { accent: "#e11d48", accentForeground: "#ffffff" },
  { accent: "#0ea5e9", accentForeground: "#ffffff" },
  { accent: "#10b981", accentForeground: "#022c22" },
  { accent: "#f59e0b", accentForeground: "#1c1917" },
  { accent: "#8b5cf6", accentForeground: "#ffffff" },
  { accent: "#ec4899", accentForeground: "#ffffff" },
  { accent: "#14b8a6", accentForeground: "#042f2e" },
  { accent: "#f43f5e", accentForeground: "#ffffff" },
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
  // AppRail
  railAppIds: string[];
  railApps: AppManifest[];
  availableApps: AppManifest[];
  activeAppId: string | null;
  railLoaded: boolean;
  loadRail: (orgId?: string) => Promise<void>;
  openApp: (id: string) => void;
  closeApp: () => void;
  reorderRail: (from: number, to: number) => void;
  toggleRailApp: (id: string) => void;
}

const AppShellContext = createContext<AppShellState | null>(null);

export const DEFAULT_LEFT_SIZE = 200;
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
  const [activeSection, setActiveSectionState] = useState<SectionId | null>(null);
  const [organizations, setOrganizations] = useState<OrganizationListItem[]>([]);
  const [organizationsLoading, setOrganizationsLoading] = useState(true);

  const [railAppIds, setRailAppIds] = useState<string[]>([]);
  const [availableApps, setAvailableApps] = useState<AppManifest[]>([]);
  const [activeAppId, setActiveAppId] = useState<string | null>(null);
  const [railLoaded, setRailLoaded] = useState(false);

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

  const activeOrganizationId = useMemo(() => {
    const sp = spaces.find((candidate) => candidate.id === spaceId);
    return sp?.organizationId;
  }, [spaces, spaceId]);

  // --- AppRail state & actions (org-scoped, persisted via enabledAppIds) ---
  const orgIdRef = useRef<string | undefined>(undefined);

  const loadRail = useCallback(async (orgId?: string) => {
    const id = orgId ?? orgIdRef.current;
    try {
      if (id) {
        const alloc = await getOrganizationApps(id);
        setRailAppIds(alloc.enabledAppIds);
        setAvailableApps(alloc.apps);
      } else {
        const apps = await getApps();
        setAvailableApps(apps);
        setRailAppIds([]);
      }
    } catch {
      setAvailableApps([]);
      setRailAppIds([]);
    } finally {
      setRailLoaded(true);
    }
  }, []);

  const persistRail = useCallback(async (next: string[]) => {
    const id = orgIdRef.current;
    if (!id) return;
    try {
      await setOrganizationApps(id, next);
    } catch {
      // Keep optimistic local state on failure.
    }
  }, []);

  const reorderRail = useCallback(
    (from: number, to: number) => {
      setRailAppIds((prev) => {
        const next = arrayMove(prev, from, to);
        void persistRail(next);
        return next;
      });
    },
    [persistRail],
  );

  const toggleRailApp = useCallback(
    (id: string) => {
      setRailAppIds((prev) => {
        const next = prev.includes(id)
          ? prev.filter((x) => x !== id)
          : [...prev, id];
        void persistRail(next);
        return next;
      });
    },
    [persistRail],
  );

  const openApp = useCallback((id: string) => {
    setActiveAppId(id);
  }, []);

  const closeApp = useCallback(() => {
    setActiveAppId(null);
  }, []);

  // Opening any nav section dismisses the AppRail app panel (separate state).
  const setActiveSection = useCallback(
    (id: SectionId | null) => {
      setActiveAppId(null);
      setActiveSectionState(id);
    },
    [],
  );

  useEffect(() => {
    orgIdRef.current = activeOrganizationId;
    if (typeof document !== "undefined") {
      document.cookie = `jamot_active_org=${activeOrganizationId ?? ""}; path=/; max-age=31536000; SameSite=Lax`;
    }
    void loadRail(activeOrganizationId);
  }, [activeOrganizationId, loadRail]);

  const railApps = useMemo(
    () =>
      railAppIds
        .map((id) => availableApps.find((app) => app.id === id))
        .filter((app): app is AppManifest => Boolean(app)),
    [railAppIds, availableApps],
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
      railAppIds,
      railApps,
      availableApps,
      activeAppId,
      railLoaded,
      loadRail,
      openApp,
      closeApp,
      reorderRail,
      toggleRailApp,
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
    railAppIds,
    railApps,
    availableApps,
    activeAppId,
    railLoaded,
    loadRail,
    openApp,
    closeApp,
    reorderRail,
    toggleRailApp,
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