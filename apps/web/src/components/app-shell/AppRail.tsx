"use client";

import {
  Bot,
  Briefcase,
  Building2,
  CalendarDays,
  Landmark,
  LayoutGrid,
  ListTodo,
  MessageCircle,
  Truck,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { useAppShell, type SectionId } from "./app-shell-context";

interface RailItem {
  id: SectionId;
  label: string;
  icon: LucideIcon;
}

const SECTION_ITEMS: RailItem[] = [
  { id: "tasks", label: "Tasks", icon: ListTodo },
  { id: "people", label: "People", icon: Users },
  { id: "agents", label: "Agents", icon: Bot },
  { id: "organization", label: "Organization", icon: Building2 },
  { id: "canvas", label: "Canvas", icon: LayoutGrid },
  { id: "whatsapp", label: "WhatsApp", icon: MessageCircle },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
  { id: "suppliers", label: "Suppliers", icon: Truck },
  { id: "crm", label: "CRM", icon: Briefcase },
  { id: "finance", label: "Finance", icon: Landmark },
];

const PRIMARY_IDS: SectionId[] = [
  "tasks",
  "people",
  "agents",
  "organization",
  "canvas",
];

export function AppRail() {
  const { activeSection, setActiveSection } = useAppShell();

  const renderItem = (item: RailItem) => {
    const Icon = item.icon;
    const active = activeSection === item.id;
    return (
      <Button
        key={item.id}
        variant="ghost"
        size="icon"
        className={cn("size-9", active && "bg-muted text-foreground")}
        aria-label={item.label}
        aria-pressed={active}
        title={item.label}
        onClick={() => setActiveSection(active ? null : item.id)}
      >
        <Icon
          className={cn("size-4", active ? "text-foreground" : "text-muted-foreground")}
        />
      </Button>
    );
  };

  return (
    <div className="flex h-full w-full flex-col items-center gap-1 border-l border-border bg-sidebar py-2 text-sidebar-foreground">
      {SECTION_ITEMS.filter((item) => PRIMARY_IDS.includes(item.id)).map(renderItem)}
      <div className="my-1 h-px w-6 bg-border" />
      {SECTION_ITEMS.filter((item) => !PRIMARY_IDS.includes(item.id)).map(renderItem)}
    </div>
  );
}