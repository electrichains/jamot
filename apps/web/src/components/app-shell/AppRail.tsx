"use client";

import { useEffect, useMemo, useState } from "react";
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
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bot,
  Briefcase,
  Building2,
  CalendarDays,
  Check,
  Landmark,
  LayoutGrid,
  ListTodo,
  Maximize2,
  Megaphone,
  MessageCircle,
  Plus,
  Puzzle,
  Radar,
  Server,
  Trash2,
  Truck,
  Users,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { useAppShell, type SectionId } from "./app-shell-context";

interface RailItem {
  id: SectionId;
  label: string;
  icon: LucideIcon;
}

const SECTION_ITEMS: RailItem[] = [
  { id: "tasks", label: "Tasks", icon: ListTodo },
  { id: "people", label: "People", icon: Users },
  { id: "agents", label: "Agents", icon: Bot },
  { id: "organization", label: "Organization", icon: Building2 },
  { id: "dashboard", label: "Dashboard", icon: LayoutGrid },
  { id: "whatsapp", label: "WhatsApp", icon: MessageCircle },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
  { id: "suppliers", label: "Suppliers", icon: Truck },
  { id: "crm", label: "CRM", icon: Briefcase },
  { id: "leads", label: "Leads", icon: Radar },
  { id: "outreach", label: "Outreach", icon: Megaphone },
  { id: "finance", label: "Finance", icon: Landmark },
];

const DEFAULT_ORDER: SectionId[] = SECTION_ITEMS.map((item) => item.id);

interface RailPrefs {
  order: SectionId[];
  hidden: SectionId[];
}

interface McpRailItem {
  id: string;
  label: string;
  url: string;
}

const RAIL_KEY = "jamot:rail";
const MCP_KEY = "jamot:rail:mcp";

const isSectionId = (id: string): id is SectionId =>
  SECTION_ITEMS.some((item) => item.id === id);

function loadPrefs(): RailPrefs {
  try {
    const raw = window.localStorage.getItem(RAIL_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as RailPrefs;
      if (Array.isArray(parsed.order) && Array.isArray(parsed.hidden)) {
        // Merge with defaults so sections shipped after the user saved their
        // rail still appear (appended at the end), and stale ids are dropped.
        const saved = parsed.order.filter(isSectionId);
        const missing = DEFAULT_ORDER.filter((id) => !saved.includes(id));
        return {
          order: [...saved, ...missing],
          hidden: parsed.hidden.filter(isSectionId),
        };
      }
    }
  } catch {
    // ignore malformed prefs
  }
  return { order: DEFAULT_ORDER, hidden: [] };
}

function loadMcpItems(): McpRailItem[] {
  try {
    const raw = window.localStorage.getItem(MCP_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as McpRailItem[];
      if (Array.isArray(parsed)) {
        return parsed.filter((item) => item && item.id && item.label);
      }
    }
  } catch {
    // ignore malformed prefs
  }
  return [];
}

interface AppRailProps {
  expanded?: boolean;
  onRestoreChat?: () => void;
  onSelectSection?: (id: SectionId) => void;
}

export function AppRail({
  expanded = false,
  onRestoreChat,
  onSelectSection,
}: AppRailProps) {
  const {
    activeSection,
    setActiveSection,
    availableApps,
    railAppIds,
    openApp,
    toggleRailApp,
  } = useAppShell();
  const [prefs, setPrefs] = useState<RailPrefs>(() => loadPrefs());
  const [mcpItems, setMcpItems] = useState<McpRailItem[]>(() => loadMcpItems());
  const [open, setOpen] = useState(false);
  const [mcpName, setMcpName] = useState("");
  const [mcpUrl, setMcpUrl] = useState("");

  useEffect(() => {
    try {
      window.localStorage.setItem(RAIL_KEY, JSON.stringify(prefs));
    } catch {
      // ignore
    }
  }, [prefs]);

  useEffect(() => {
    try {
      window.localStorage.setItem(MCP_KEY, JSON.stringify(mcpItems));
    } catch {
      // ignore
    }
  }, [mcpItems]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const visibleItems = useMemo<RailItem[]>(
    () =>
      prefs.order
        .filter((id) => !prefs.hidden.includes(id))
        .map((id) => SECTION_ITEMS.find((item) => item.id === id))
        .filter((item): item is RailItem => Boolean(item)),
    [prefs],
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = prefs.order.indexOf(active.id as SectionId);
    const to = prefs.order.indexOf(over.id as SectionId);
    if (from === -1 || to === -1) return;
    setPrefs((prev) => ({ ...prev, order: arrayMove(prev.order, from, to) }));
  };

  const toggleApp = (id: SectionId) => {
    setPrefs((prev) => {
      const hidden = prev.hidden.includes(id)
        ? prev.hidden.filter((candidate) => candidate !== id)
        : [...prev.hidden, id];
      return { ...prev, hidden };
    });
  };

  const addMcp = () => {
    const label = mcpName.trim();
    const url = mcpUrl.trim();
    if (!label || !url) return;
    const item: McpRailItem = { id: `mcp-${Date.now()}`, label, url };
    setMcpItems((prev) => [...prev, item]);
    setMcpName("");
    setMcpUrl("");
  };

  const removeMcp = (id: string) => {
    setMcpItems((prev) => prev.filter((item) => item.id !== id));
  };

  const selectSection = (id: SectionId) => {
    if (onSelectSection) onSelectSection(id);
    else setActiveSection(id);
  };

  const renderItem = (item: RailItem) => {
    const active = activeSection === item.id;
    return (
      <SortableRailItem
        key={item.id}
        item={item}
        active={active}
        expanded={expanded}
        onClick={() =>
          onSelectSection
            ? onSelectSection(item.id)
            : setActiveSection(active ? null : item.id)
        }
      />
    );
  };

  return (
    <div
      className={cn(
        "relative flex h-full flex-col border-l border-border/40 bg-sidebar/80 py-2 text-sidebar-foreground backdrop-blur-md transition-[width] duration-200",
        expanded
          ? "w-full items-stretch gap-0.5"
          : open
            ? "w-80 items-center gap-1"
            : "w-14 items-center gap-1",
      )}
    >
      {expanded ? (
        <div className="mb-1 flex shrink-0 items-center justify-between border-b border-border px-3 pb-2">
          <span className="font-display text-sm font-semibold tracking-tight">
            Apps
          </span>
          {onRestoreChat ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 px-2 text-xs"
              aria-label="Restore full layout"
              title="Restore full layout"
              onClick={onRestoreChat}
            >
              <Maximize2 className="size-3.5" />
              Expand
            </Button>
          ) : null}
        </div>
      ) : null}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={prefs.order}
          strategy={verticalListSortingStrategy}
        >
          <div
            className={cn(
              "flex flex-col gap-1",
              expanded ? "w-full px-2" : "items-center",
            )}
          >
            {visibleItems.map(renderItem)}
          </div>
        </SortableContext>
      </DndContext>

      <div className={cn("my-1 h-px bg-border/40", expanded ? "mx-3" : "w-6")} />

      {mcpItems.map((item) => (
        <Button
          key={item.id}
          variant="ghost"
          className={cn(
            expanded ? "h-9 w-full justify-start gap-2 px-3 text-sm" : "size-9 rounded-lg",
            activeSection === "agents" && "bg-muted text-foreground",
          )}
          aria-label={`${item.label} (MCP)`}
          title={`${item.label} — MCP server`}
          onClick={() => selectSection("agents")}
        >
          <Server className="size-4 shrink-0 text-muted-foreground" />
          {expanded ? (
            <span className="min-w-0 flex-1 truncate text-left">{item.label}</span>
          ) : null}
        </Button>
      ))}

      <div className="mt-auto" />

      <Button
        variant="ghost"
        className={cn(
          "shrink-0",
          expanded ? "h-9 w-full justify-start gap-2 px-3 text-sm" : "size-9 rounded-lg",
        )}
        aria-label="Add or manage apps"
        title="Add apps"
        onClick={() => setOpen((value) => !value)}
      >
        <Plus className="size-4 shrink-0" />
        {expanded ? <span>Add apps</span> : null}
      </Button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -4 }}
            transition={{ duration: 0.15 }}
            className="glass-card glass-border mt-2 min-h-0 w-full flex-1 overflow-y-auto rounded-xl p-2 shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-border/40 pb-1.5">
              <h3 className="text-sm font-semibold">Add apps</h3>
              <Button
                variant="ghost"
                size="icon"
                className="size-6"
                aria-label="Close"
                onClick={() => setOpen(false)}
              >
                <X className="size-4" />
              </Button>
            </div>

            <p className="px-0.5 pb-1 pt-2 text-xs font-medium text-muted-foreground">
              Apps
            </p>
            <div className="flex flex-col gap-0.5">
              {SECTION_ITEMS.map((item) => {
                const enabled = !prefs.hidden.includes(item.id);
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleApp(item.id)}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted"
                  >
                    <Icon className="size-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                    <span
                      className={cn(
                        "flex size-4 shrink-0 items-center justify-center rounded border",
                        enabled
                          ? "border-space-accent bg-space-accent text-space-accent-foreground"
                          : "border-border",
                      )}
                    >
                      {enabled ? <Check className="size-3" /> : null}
                    </span>
                  </button>
                );
              })}
            </div>

            <p className="px-0.5 pb-1 pt-3 text-xs font-medium text-muted-foreground">
              Launch apps
            </p>
            <div className="flex flex-col gap-0.5">
              {availableApps.length === 0 ? (
                <p className="px-0.5 text-xs text-muted-foreground">
                  No apps available.
                </p>
              ) : (
                availableApps.map((app) => {
                  const enabled = railAppIds.includes(app.id);
                  return (
                    <div
                      key={app.id}
                      className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm"
                    >
                      <Puzzle className="size-4 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 flex-1 truncate">{app.name}</span>
                      <button
                        type="button"
                        onClick={() => {
                          openApp(app.id);
                          setOpen(false);
                        }}
                        className="rounded-md bg-space-accent/15 px-2 py-0.5 text-[11px] font-medium text-foreground transition-colors hover:bg-space-accent/25"
                      >
                        Open
                      </button>
                      <span
                        role="switch"
                        aria-checked={enabled}
                        aria-label={`Pin ${app.name} to rail`}
                        onClick={() => toggleRailApp(app.id)}
                        className={cn(
                          "relative h-4 w-7 shrink-0 cursor-pointer rounded-full transition-colors",
                          enabled ? "bg-space-accent" : "bg-muted",
                        )}
                      >
                        <span
                          className={cn(
                            "absolute top-0.5 size-3 rounded-full bg-white shadow transition-transform",
                            enabled ? "translate-x-[14px]" : "translate-x-0.5",
                          )}
                        />
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            <p className="px-0.5 pb-1 pt-3 text-xs font-medium text-muted-foreground">
              MCP servers
            </p>
            <div className="flex flex-col gap-0.5">
              {mcpItems.length === 0 ? (
                <p className="px-0.5 text-xs text-muted-foreground">
                  No MCP servers added yet.
                </p>
              ) : (
                mcpItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2 rounded-md px-2 py-1 text-sm"
                  >
                    <Server className="size-3.5 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1 truncate" title={item.url}>
                      {item.label}
                    </span>
                    <button
                      type="button"
                      aria-label={`Remove ${item.label}`}
                      onClick={() => removeMcp(item.id)}
                      className="text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                ))
              )}
              <div className="mt-1 flex flex-col gap-1">
                <Input
                  placeholder="Name"
                  value={mcpName}
                  onChange={(event) => setMcpName(event.target.value)}
                  className="h-8 text-xs"
                />
                <div className="flex gap-1">
                  <Input
                    placeholder="https://…/mcp"
                    value={mcpUrl}
                    onChange={(event) => setMcpUrl(event.target.value)}
                    className="h-8 flex-1 text-xs"
                  />
                  <Button variant="secondary" size="sm" onClick={addMcp}>
                    Add
                  </Button>
                </div>
              </div>
            </div>

            <p className="px-0.5 pt-2 text-[11px] leading-tight text-muted-foreground">
              Added MCP servers appear in the rail and open the Agents section.
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function SortableRailItem({
  item,
  active,
  expanded,
  onClick,
}: {
  item: RailItem;
  active: boolean;
  expanded: boolean;
  onClick: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });
  const Icon = item.icon;

  return (
    <Button
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      variant="ghost"
      className={cn(
        expanded ? "h-9 w-full justify-start gap-2 px-3 text-sm" : "size-9 rounded-lg",
        active && "bg-muted text-foreground",
        isDragging && "opacity-60",
      )}
      aria-label={item.label}
      aria-pressed={active}
      title={`${item.label} — drag to reorder`}
      onClick={onClick}
    >
      <Icon
        className={cn("size-4 shrink-0", active ? "text-foreground" : "text-muted-foreground")}
      />
      {expanded ? (
        <span className="min-w-0 flex-1 truncate text-left">{item.label}</span>
      ) : null}
    </Button>
  );
}
