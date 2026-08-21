"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export function AppRailItem({
  id,
  name,
  icon: Icon,
  isActive,
  onClick,
}: {
  id: string;
  name: string;
  icon: LucideIcon;
  isActive: boolean;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li className="list-none">
      <button
        type="button"
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        onClick={onClick}
        aria-label={name}
        title={name}
        className={cn(
          "flex size-10 items-center justify-center rounded-xl border border-transparent text-sidebar-foreground/80 transition-colors hover:bg-space-accent/15 hover:text-foreground",
          isActive && "border-space-accent/40 bg-space-accent/15 text-foreground",
          isDragging && "opacity-50",
        )}
      >
        <Icon className="size-5" />
      </button>
    </li>
  );
}
