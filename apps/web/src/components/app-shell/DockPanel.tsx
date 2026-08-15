"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface DockPanelProps {
  title: string;
  icon?: LucideIcon;
  children?: ReactNode;
  className?: string;
}

export function DockPanel({ title, icon: Icon, children, className }: DockPanelProps) {
  return (
    <section className={cn("rounded-lg border border-border bg-card p-3", className)}>
      <header className="mb-2 flex items-center gap-2">
        {Icon ? <Icon className="size-4 text-muted-foreground" /> : null}
        <h3 className="text-xs font-medium text-muted-foreground">{title}</h3>
      </header>
      <div className="flex min-h-12 items-center justify-center rounded-md border border-dashed border-border text-xs text-muted-foreground/70">
        {children ?? "Nothing here yet"}
      </div>
    </section>
  );
}
