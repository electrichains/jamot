"use client";

import { AppWindow, Bot, ChevronRight, SquareCheck, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DockPanel } from "./DockPanel";

export interface ContextDockProps {
  onCollapse?: () => void;
  onResize?: (px: number) => void;
}

const PANELS: { title: string; icon: LucideIcon }[] = [
  { title: "People", icon: Users },
  { title: "Agents", icon: Bot },
  { title: "Tasks", icon: SquareCheck },
  { title: "Apps", icon: AppWindow },
];

export function ContextDock({ onCollapse, onResize }: ContextDockProps) {
  return (
    <aside className="flex h-full flex-col border-l border-border bg-sidebar text-sidebar-foreground">
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-border px-2">
        <span className="text-sm font-medium">Context</span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-1.5 text-xs text-muted-foreground"
            onClick={() => onResize?.(500)}
          >
            500
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-1.5 text-xs text-muted-foreground"
            onClick={() => onResize?.(700)}
          >
            700
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            aria-label="Collapse context dock"
            onClick={onCollapse}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
        {PANELS.map((panel) => {
          const Icon = panel.icon;
          return <DockPanel key={panel.title} title={panel.title} icon={Icon} />;
        })}
      </div>
    </aside>
  );
}
