"use client";

import { useState } from "react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAppShell } from "./app-shell-context";
import { AppRailItem } from "./app-rail-item";
import { appIcon } from "./app-icons";

export function AppRail({
  configOpen,
  onToggleConfig,
}: {
  configOpen: boolean;
  onToggleConfig: () => void;
}) {
  const { railApps, reorderRail, openApp } = useAppShell();
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = railApps.findIndex((app) => app.id === active.id);
    const to = railApps.findIndex((app) => app.id === over.id);
    if (from === -1 || to === -1) return;
    reorderRail(from, to);
  };

  return (
    <nav
      className="flex h-full w-14 shrink-0 flex-col items-center gap-1 border-l border-border/40 bg-sidebar/80 py-2 text-sidebar-foreground backdrop-blur-md"
      aria-label="App rail"
    >
      <div className="flex min-h-0 w-full flex-1 flex-col items-center overflow-y-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={(event) => setActiveId(String(event.active.id))}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={railApps.map((app) => app.id)}
            strategy={verticalListSortingStrategy}
          >
            <ul className="flex flex-col items-center gap-1">
              {railApps.map((app) => (
                <AppRailItem
                  key={app.id}
                  id={app.id}
                  name={app.name}
                  icon={appIcon(app.id)}
                  isActive={activeId === app.id}
                  onClick={() => openApp(app.id)}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      </div>

      <Button
        variant={configOpen ? "secondary" : "ghost"}
        size="icon"
        className="size-10 rounded-xl"
        aria-label="Configure apps"
        aria-pressed={configOpen}
        onClick={onToggleConfig}
      >
        <Plus className="size-5" />
      </Button>
    </nav>
  );
}
