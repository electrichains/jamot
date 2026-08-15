"use client";

import { useState } from "react";
import { PanelRightClose, PanelRightOpen, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { ChatWorkspace } from "@/components/chat/ChatWorkspace";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { NotificationsProvider } from "@/components/notifications/notifications-context";
import { A2UIDemo } from "@/components/a2ui/A2UIDemo";

export interface MainWorkspaceProps {
  onToggleDock?: () => void;
  dockOpen?: boolean;
}

export function MainWorkspace({ onToggleDock, dockOpen = true }: MainWorkspaceProps) {
  const [showDemo, setShowDemo] = useState(false);

  return (
    <NotificationsProvider>
      <div className="flex h-full flex-col">
        <header className="flex h-12 shrink-0 items-center justify-between border-b border-border px-3">
          <div className="flex items-center gap-2">
            <span className="font-display text-sm font-semibold">Jamot</span>
            <Badge variant="outline">preview</Badge>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              aria-label="Toggle agent-rendered UI demo"
              title="Agent-rendered UI demo"
              onClick={() => setShowDemo((v) => !v)}
            >
              <Sparkles />
            </Button>
            <NotificationBell />
            <ThemeToggle />
            {onToggleDock ? (
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                aria-label="Toggle context dock"
                onClick={onToggleDock}
              >
                {dockOpen ? <PanelRightClose /> : <PanelRightOpen />}
              </Button>
            ) : null}
          </div>
        </header>

        {showDemo ? (
          <section className="shrink-0 border-b border-border bg-muted/30 p-4">
            <A2UIDemo />
          </section>
        ) : null}

        <main className="flex min-h-0 flex-1 flex-col">
          <ChatWorkspace />
        </main>
      </div>
    </NotificationsProvider>
  );
}
