"use client";

import { PanelRightClose, PanelRightOpen } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { ChatWorkspace } from "@/components/chat/ChatWorkspace";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { NotificationsProvider } from "@/components/notifications/notifications-context";

export interface MainWorkspaceProps {
  onToggleDock?: () => void;
  dockOpen?: boolean;
}

export function MainWorkspace({ onToggleDock, dockOpen = true }: MainWorkspaceProps) {
  return (
    <NotificationsProvider>
      <div className="flex h-full flex-col">
        <header className="flex h-12 shrink-0 items-center justify-between border-b border-border px-3">
          <div className="flex items-center gap-2">
            <span className="font-display text-sm font-semibold">Jamot</span>
            <Badge variant="outline">preview</Badge>
          </div>
          <div className="flex items-center gap-1">
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

        <main className="flex min-h-0 flex-1 flex-col">
          <ChatWorkspace />
        </main>
      </div>
    </NotificationsProvider>
  );
}
