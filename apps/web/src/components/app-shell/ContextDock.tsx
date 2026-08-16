"use client";

import {
  Briefcase,
  CalendarDays,
  ChevronRight,
  Landmark,
  MessageCircle,
  Package,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DockProvider, useDock } from "@/components/dock/dock-context";
import { renderDockItems } from "@/components/dock/dock-panels";

export interface ContextDockProps {
  onCollapse?: () => void;
}

const APP_ICONS: { id: string; label: string; icon: LucideIcon }[] = [
  { id: "whatsapp", label: "WhatsApp", icon: MessageCircle },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
  { id: "inventory", label: "Inventory", icon: Package },
  { id: "crm", label: "CRM", icon: Briefcase },
  { id: "finance", label: "Finance", icon: Landmark },
];

export function ContextDock(props: ContextDockProps) {
  return (
    <DockProvider>
      <ContextDockBody {...props} />
    </DockProvider>
  );
}

function ContextDockBody({ onCollapse }: ContextDockProps) {
  const { context, items } = useDock();

  return (
    <aside className="flex h-full border-l border-border bg-sidebar text-sidebar-foreground">
      <div className="flex w-12 shrink-0 flex-col items-center gap-1 border-r border-border py-2">
        {APP_ICONS.map((app) => {
          const Icon = app.icon;
          return (
            <Button
              key={app.id}
              variant="ghost"
              size="icon"
              className="size-9"
              aria-label={app.label}
              title={app.label}
            >
              <Icon className="size-4 text-muted-foreground" />
            </Button>
          );
        })}
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-12 shrink-0 items-center justify-between border-b border-border px-2">
          <span className="text-sm font-medium">
            Context
            {context.id ? (
              <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                · {context.kind}
              </span>
            ) : (
              <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                · space
              </span>
            )}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            aria-label="Collapse context dock"
            onClick={onCollapse}
          >
            <ChevronRight className="size-4" />
          </Button>
        </header>

        <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
          {renderDockItems(items)}
        </div>
      </div>
    </aside>
  );
}
