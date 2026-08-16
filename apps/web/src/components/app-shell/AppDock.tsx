"use client";

import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { WhatsAppApp } from "@/components/whatsapp/WhatsAppApp";

import { APP_TITLES, useAppShell } from "./app-shell-context";
import { ContextDock } from "./ContextDock";

export interface AppDockProps {
  onCollapse?: () => void;
}

function PlaceholderApp({ title }: { title: string }) {
  return (
    <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-muted-foreground">
      {title} will appear here in a later phase.
    </div>
  );
}

export function AppDock({ onCollapse }: AppDockProps) {
  const { activeApp, setActiveApp } = useAppShell();

  if (!activeApp) {
    return <ContextDock onCollapse={onCollapse} />;
  }

  return (
    <aside className="flex h-full flex-col border-l border-border bg-sidebar text-sidebar-foreground">
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-border px-2">
        <span className="text-sm font-medium">{APP_TITLES[activeApp]}</span>
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          aria-label="Close app"
          onClick={() => setActiveApp(null)}
        >
          <X className="size-4" />
        </Button>
      </header>
      <div className="flex min-h-0 flex-1 flex-col">
        {activeApp === "whatsapp" ? (
          <WhatsAppApp compact />
        ) : (
          <PlaceholderApp title={APP_TITLES[activeApp]} />
        )}
      </div>
    </aside>
  );
}
