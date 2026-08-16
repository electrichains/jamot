"use client";

import { ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DockProvider, useDock } from "@/components/dock/dock-context";
import { renderDockItems } from "@/components/dock/dock-panels";

export interface ContextDockProps {
  onCollapse?: () => void;
}

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
    <aside className="flex h-full flex-col border-l border-border bg-sidebar text-sidebar-foreground">
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
    </aside>
  );
}
