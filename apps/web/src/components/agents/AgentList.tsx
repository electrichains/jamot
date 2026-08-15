"use client";

import { Bot } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AUTONOMY_LABEL, type AgentProfile } from "./agents-data";

const AVAILABILITY: Record<
  AgentProfile["availability"],
  { label: string; dot: string }
> = {
  available: { label: "Available", dot: "bg-emerald-500" },
  busy: { label: "Busy", dot: "bg-amber-500" },
  offline: { label: "Offline", dot: "bg-zinc-400" },
};

export function AgentList({
  agents,
  selectedId,
  onSelect,
}: {
  agents: AgentProfile[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <nav className="flex w-72 shrink-0 flex-col gap-2 overflow-y-auto border-r border-border bg-sidebar p-3">
      {agents.map((agent) => {
        const availability = AVAILABILITY[agent.availability];
        const isSelected = agent.id === selectedId;
        return (
          <button
            key={agent.id}
            type="button"
            onClick={() => onSelect(agent.id)}
            className={cn(
              "flex flex-col gap-2.5 rounded-lg border p-3 text-left transition-colors",
              isSelected
                ? "border-space-accent bg-card"
                : "border-border bg-card/60 hover:bg-card",
            )}
          >
            <div className="flex items-center gap-2.5">
              <Avatar name={agent.name} size="md" />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium">{agent.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {agent.role}
                </span>
              </span>
              <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-space-accent/15 text-space-accent">
                <Bot className="size-3.5" />
              </span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span
                  className={cn("size-2 rounded-full", availability.dot)}
                  aria-hidden
                />
                {availability.label}
              </span>
              <Badge variant="accent" className="px-1.5 text-[10px]">
                {AUTONOMY_LABEL[agent.autonomy]}
              </Badge>
            </div>
          </button>
        );
      })}
    </nav>
  );
}
