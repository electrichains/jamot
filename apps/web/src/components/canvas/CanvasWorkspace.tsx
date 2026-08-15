"use client";

import { Fragment, useState, type DragEvent } from "react";
import { Group, Panel, Separator } from "react-resizable-panels";
import type { LucideIcon } from "lucide-react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  CanvasPane,
  CanvasTile,
  CanvasTileKind,
} from "./canvas-types";
import { Palette, TileIcon, resolveTile } from "./palette";
import {
  useCanvasLayout,
  type MoveDirection,
} from "./use-canvas-layout";

const MOCK_METRICS: Record<string, string> = {
  "app-whatsapp": "12 active chats",
  "app-calendar": "9 events today",
  "app-inventory": "48 SKUs tracked",
  "app-crm": "23 open deals",
  "mcp-finance": "3 tools · ledger, invoices, tax",
  "mcp-crm": "2 tools · contacts, pipeline",
  "harness-hermes": "running · 4 agents",
  "harness-openclaw": "idle · ready",
  "harness-openmanus": "running · 1 task",
  "channel-whatsapp": "12 active",
  "channel-matrix": "connected · 5 rooms",
  "channel-telegram": "connected · 3 chats",
  "channel-discord": "connected · 2 servers",
};

const FALLBACK_METRIC: Record<CanvasTileKind, string> = {
  app: "app ready",
  mcp: "tools connected",
  harness: "harness ready",
  channel: "channel connected",
};

interface MoveCapability {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
}

function computeMoves(
  pane: CanvasPane,
  columnPanes: CanvasPane[],
): MoveCapability {
  return {
    left: pane.position.column === 1,
    right: pane.position.column === 0,
    up: pane.position.order > 0,
    down: pane.position.order < columnPanes.length - 1,
  };
}

function metricFor(tile?: CanvasTile): string {
  if (!tile) return "—";
  return MOCK_METRICS[tile.id] ?? FALLBACK_METRIC[tile.kind];
}

function MoveButtons({
  canMove,
  onMove,
}: {
  canMove: MoveCapability;
  onMove: (direction: MoveDirection) => void;
}) {
  const buttons: {
    direction: MoveDirection;
    label: string;
    icon: LucideIcon;
    enabled: boolean;
  }[] = [
    { direction: "left", label: "Move left", icon: ChevronLeft, enabled: canMove.left },
    { direction: "right", label: "Move right", icon: ChevronRight, enabled: canMove.right },
    { direction: "up", label: "Move up", icon: ChevronUp, enabled: canMove.up },
    { direction: "down", label: "Move down", icon: ChevronDown, enabled: canMove.down },
  ];

  return (
    <div className="flex shrink-0 items-center">
      {buttons.map(({ direction, label, icon: Icon, enabled }) => (
        <Button
          key={direction}
          variant="ghost"
          size="icon"
          className="size-6"
          disabled={!enabled}
          aria-label={label}
          onClick={() => onMove(direction)}
        >
          <Icon className="size-3.5" />
        </Button>
      ))}
    </div>
  );
}

function PaneCard({
  tile,
  canMove,
  onMove,
  onRemove,
}: {
  tile?: CanvasTile;
  canMove: MoveCapability;
  onMove: (direction: MoveDirection) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card">
      <header className="flex h-9 shrink-0 items-center gap-1 border-b border-border px-2">
        {tile ? <TileIcon tile={tile} className="size-4 shrink-0 text-muted-foreground" /> : null}
        <span className="min-w-0 flex-1 truncate text-sm font-medium">
          {tile?.name ?? "Unknown"}
        </span>
        {tile ? (
          <Badge variant="secondary" className="hidden sm:inline-flex">
            {tile.kind}
          </Badge>
        ) : null}
        <MoveButtons canMove={canMove} onMove={onMove} />
        <Button
          variant="ghost"
          size="icon"
          className="size-7 shrink-0"
          aria-label={`Remove ${tile?.name ?? "pane"}`}
          onClick={onRemove}
        >
          <X className="size-3.5" />
        </Button>
      </header>

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-1.5 p-3 text-center">
        {tile ? <TileIcon tile={tile} className="size-6 text-muted-foreground" /> : null}
        <p className="text-sm font-medium">{tile?.name ?? "Unknown tile"}</p>
        <p className="text-xs text-muted-foreground">{metricFor(tile)}</p>
        {tile?.summary ? (
          <p className="text-xs text-muted-foreground/70">{tile.summary}</p>
        ) : null}
      </div>
    </div>
  );
}

function EmptyColumn() {
  return (
    <div className="h-full p-2">
      <div className="flex h-full w-full items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground/70">
        No panes — drop a tile here
      </div>
    </div>
  );
}

function PaneColumn({
  column,
  panes,
  onMove,
  onRemove,
  onColumnSizes,
}: {
  column: 0 | 1;
  panes: CanvasPane[];
  onMove: (paneId: string, direction: MoveDirection) => void;
  onRemove: (paneId: string) => void;
  onColumnSizes: (column: 0 | 1, sizes: Record<string, number>) => void;
}) {
  if (panes.length === 0) {
    return <EmptyColumn />;
  }

  if (panes.length === 1) {
    const pane = panes[0];
    return (
      <div className="h-full p-2">
        <PaneCard
          tile={resolveTile(pane.tileId)}
          canMove={computeMoves(pane, panes)}
          onMove={(direction) => onMove(pane.id, direction)}
          onRemove={() => onRemove(pane.id)}
        />
      </div>
    );
  }

  return (
    <Group
      orientation="vertical"
      className="h-full"
      onLayoutChanged={(sizes, meta) => {
        if (!meta.isUserInteraction) return;
        onColumnSizes(column, sizes);
      }}
    >
      {panes.map((pane, index) => (
        <Fragment key={pane.id}>
          {index > 0 ? (
            <Separator
              id={`sep-${pane.id}`}
              className="h-px bg-border transition-colors hover:bg-ring data-[separator=active]:bg-ring"
            />
          ) : null}
          <Panel
            id={pane.id}
            defaultSize={pane.size != null ? String(pane.size) : undefined}
            minSize={96}
            className="h-full"
          >
            <div className="h-full p-2">
              <PaneCard
                tile={resolveTile(pane.tileId)}
                canMove={computeMoves(pane, panes)}
                onMove={(direction) => onMove(pane.id, direction)}
                onRemove={() => onRemove(pane.id)}
              />
            </div>
          </Panel>
        </Fragment>
      ))}
    </Group>
  );
}

/**
 * The docking canvas: a palette on the left and a resizable two-column grid of
 * panes on the right. The layout is persisted to localStorage per user.
 */
export function CanvasWorkspace() {
  const { layout, addPane, removePane, movePane, applyColumnSizes } =
    useCanvasLayout();
  const [dragActive, setDragActive] = useState(false);

  const leftPanes = layout.panes.filter((pane) => pane.position.column === 0);
  const rightPanes = layout.panes.filter((pane) => pane.position.column === 1);

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    if (!event.dataTransfer.types.includes("application/x-jamot-tile")) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    setDragActive(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
    setDragActive(false);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    const tileId = event.dataTransfer.getData("application/x-jamot-tile");
    if (!tileId) return;
    const tile = resolveTile(tileId);
    if (tile) addPane(tile);
  };

  return (
    <div className="flex min-h-0 flex-1">
      <Palette onAdd={addPane} />

      <div
        className={cn(
          "relative min-w-0 flex-1 overflow-hidden",
          dragActive && "bg-muted/50",
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex h-full flex-col lg:flex-row">
          <div className="min-h-0 flex-1 overflow-hidden lg:border-r lg:border-border">
            <PaneColumn
              column={0}
              panes={leftPanes}
              onMove={movePane}
              onRemove={removePane}
              onColumnSizes={applyColumnSizes}
            />
          </div>
          <div className="min-h-0 flex-1 overflow-hidden">
            <PaneColumn
              column={1}
              panes={rightPanes}
              onMove={movePane}
              onRemove={removePane}
              onColumnSizes={applyColumnSizes}
            />
          </div>
        </div>

        {dragActive ? (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
            <div className="rounded-lg border-2 border-dashed border-space-accent bg-card/80 px-4 py-2 text-sm font-medium text-space-accent">
              Drop to place
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
