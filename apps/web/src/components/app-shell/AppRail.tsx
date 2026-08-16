"use client";

import { useRouter } from "next/navigation";
import {
  Bot,
  Briefcase,
  Building2,
  CalendarDays,
  Landmark,
  LayoutGrid,
  ListTodo,
  MessageCircle,
  Package,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

interface RailItem {
  id: string;
  label: string;
  icon: LucideIcon;
  href?: string;
}

const NAV_ITEMS: RailItem[] = [
  { id: "tasks", label: "Tasks", icon: ListTodo, href: "/tasks" },
  { id: "people", label: "People", icon: Users, href: "/people" },
  { id: "agents", label: "Agents", icon: Bot, href: "/agents" },
  { id: "organization", label: "Organization", icon: Building2, href: "/organization" },
  { id: "canvas", label: "Canvas", icon: LayoutGrid, href: "/canvas" },
];

const APP_ITEMS: RailItem[] = [
  { id: "whatsapp", label: "WhatsApp", icon: MessageCircle, href: "/whatsapp" },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
  { id: "inventory", label: "Inventory", icon: Package },
  { id: "crm", label: "CRM", icon: Briefcase },
  { id: "finance", label: "Finance", icon: Landmark },
];

export function AppRail() {
  const router = useRouter();

  const renderItem = (item: RailItem) => {
    const Icon = item.icon;
    return (
      <Button
        key={item.id}
        variant="ghost"
        size="icon"
        className="size-9"
        aria-label={item.label}
        title={item.label}
        onClick={() => item.href && router.push(item.href)}
      >
        <Icon className="size-4 text-muted-foreground" />
      </Button>
    );
  };

  return (
    <div className="flex h-full w-full flex-col items-center gap-1 border-l border-border bg-sidebar py-2 text-sidebar-foreground">
      {NAV_ITEMS.map(renderItem)}
      <div className="my-1 h-px w-6 bg-border" />
      {APP_ITEMS.map(renderItem)}
    </div>
  );
}
