"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

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
  markRead: (id: string) => void;
  markAllRead: () => void;
}

const NotificationsContext = createContext<NotificationsState | null>(null);

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

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<NotificationItem[]>(SEED);

  const markRead = useCallback((id: string) => {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, read: true } : item)),
    );
  }, []);

  const markAllRead = useCallback(() => {
    setItems((current) =>
      current.map((item) => ({ ...item, read: true })),
    );
  }, []);

  const value = useMemo<NotificationsState>(() => {
    const unread = items.filter((item) => !item.read).length;
    return { items, unread, markRead, markAllRead };
  }, [items, markRead, markAllRead]);

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
