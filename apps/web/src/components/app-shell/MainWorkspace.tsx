"use client";

import { PanelRightClose, PanelRightOpen, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export interface MainWorkspaceProps {
  onToggleDock?: () => void;
  dockOpen?: boolean;
}

export function MainWorkspace({ onToggleDock, dockOpen = true }: MainWorkspaceProps) {
  return (
    <div className="flex h-full flex-col">
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-border px-3">
        <div className="flex items-center gap-2">
          <span className="font-display text-sm font-semibold">Jamot</span>
          <Badge variant="outline">preview</Badge>
        </div>
        <div className="flex items-center gap-1">
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

      <main className="flex flex-1 flex-col items-center justify-center gap-5 px-6 text-center">
        <div className="flex size-12 items-center justify-center rounded-xl bg-space-accent/10 text-space-accent">
          <Sparkles className="size-6" />
        </div>
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Ask Jamot anything…
        </h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Your calm cockpit for people, projects, and context, all in one place.
        </p>
        <div className="w-full max-w-xl rounded-xl border border-border bg-card p-2 shadow-sm">
          <div className="flex h-10 items-center px-3 text-sm text-muted-foreground">
            Message Jamot (coming soon)
          </div>
        </div>
      </main>
    </div>
  );
}
