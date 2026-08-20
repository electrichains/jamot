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

import { useAppShell } from "@/components/app-shell/app-shell-context";
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type ApiNotification,
} from "@/lib/api-client";

export type NotificationType =
  | "approval"
  | "completed"
  | "warning"
  | "opportunity"
  | "proposal";

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  summary: string;
  read: boolean;
}

interface NotificationsState {
  items: NotificationItem[];
  unread: number;
  loading: boolean;
  markRead: (id: string) => void;
  markAllRead: () => void;
}

const NotificationsContext = createContext<NotificationsState | null>(null);

const KNOWN_TYPES: NotificationType[] = [
  "approval",
  "completed",
  "warning",
  "opportunity",
  "proposal",
];

const POLL_INTERVAL_MS = 30_000;

const SEED: NotificationItem[] = [
  {
    id: "maria-approval",
    type: "approval",
    title: "Maria needs approval",
    summary: "Awaiting your sign-off on the updated expense policy.",
    read: false,
  },
  {
    id: "sales-finished",
    type: "completed",
    title: "Sales Agent finished task",
    summary: "The Q4 pipeline review is complete and ready to view.",
    read: false,
  },
  {
    id: "budget-warning",
    type: "warning",
    title: "Budget warning",
    summary: "Marketing spend has reached 90% of the monthly budget.",
    read: false,
  },
  {
    id: "opportunity-found",
    type: "opportunity",
    title: "New opportunity found",
    summary: "A high-fit lead was detected for the Restaurant Co. space.",
    read: false,
  },
  {
    id: "workflow-proposal",
    type: "proposal",
    title: "Agent proposes changing workflow",
    summary: "Suggests adding an approval step for vendor invoices.",
    read: false,
  },
];

function toItem(api: ApiNotification): NotificationItem {
  const type = KNOWN_TYPES.includes(api.type as NotificationType)
    ? (api.type as NotificationType)
    : "completed";
  return {
    id: api.id,
    type,
    title: api.title,
    summary: api.summary,
    read: api.read,
  };
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { space } = useAppShell();
  const spaceId =
    space.kind === "organization" ? (space.spaceId ?? null) : null;
  const [items, setItems] = useState<NotificationItem[]>(SEED);
  const [loading, setLoading] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    try {
      const apiItems = await listNotifications(spaceId ?? undefined);
      if (!mountedRef.current) return;
      setItems(apiItems.map(toItem));
    } catch {
      // Backend notifications are not reachable yet — keep the current items.
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [spaceId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- show loading while notifications refresh
    setLoading(true);
    void refresh();
    const timer = setInterval(() => void refresh(), POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [refresh]);

  const markRead = useCallback((id: string) => {
    setItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, read: true } : item,
      ),
    );
    void markNotificationRead(id).catch(() => {});
  }, []);

  const markAllRead = useCallback(() => {
    setItems((current) => current.map((item) => ({ ...item, read: true })));
    void markAllNotificationsRead().catch(() => {});
  }, []);

  const value = useMemo<NotificationsState>(() => {
    const unread = items.filter((item) => !item.read).length;
    return { items, unread, loading, markRead, markAllRead };
  }, [items, loading, markRead, markAllRead]);

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications(): NotificationsState {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationsProvider");
  }
  return context;
}