/**
 * Shared types for the docking canvas.
 *
 * These are intentionally serializable (no React / Lucide values) so the same
 * shapes can be reconciled with the backend `App` / `AppResolver` later.
 */

export type CanvasTileKind = "app" | "mcp" | "harness" | "channel";

export interface CanvasTile {
  id: string;
  kind: CanvasTileKind;
  name: string;
  /** Icon key resolved to a lucide-react icon by the UI layer. */
  icon?: string;
  summary?: string;
}

/** Position of a pane inside the 2-column grid. */
export interface CanvasPosition {
  /** 0 = left column, 1 = right column. */
  column: 0 | 1;
  /** 0-based vertical order within the column. */
  order: number;
}

export interface CanvasPane {
  id: string;
  tileId: string;
  position: CanvasPosition;
  /** Vertical size within its column, as a percentage (0..100). */
  size?: number;
}

export interface CanvasLayout {
  panes: CanvasPane[];
}
