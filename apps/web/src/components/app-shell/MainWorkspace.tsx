"use client";

import {
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ChatWorkspace } from "@/components/chat/ChatWorkspace";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { NotificationsProvider } from "@/components/notifications/notifications-context";

export interface MainWorkspaceProps {
  onToggleLeft?: () => void;
  leftOpen?: boolean;
  onToggleDock?: () => void;
  dockOpen?: boolean;
}

export function MainWorkspace({
  onToggleLeft,
  leftOpen = true,
  onToggleDock,
  dockOpen = true,
}: MainWorkspaceProps) {
  return (
    <NotificationsProvider>
      <div className="flex h-full flex-col">
        <header className="flex h-12 shrink-0 items-center justify-between border-b border-border px-3">
          <div className="flex items-center gap-1">
            {onToggleLeft ? (
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                aria-label="Toggle left sidebar"
                onClick={onToggleLeft}
              >
                {leftOpen ? <PanelLeftClose /> : <PanelLeftOpen />}
              </Button>
            ) : null}
          </div>
          <div className="flex items-center gap-1">
            <NotificationBell />
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
