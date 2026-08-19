"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  Group,
  Panel,
  Separator,
  usePanelRef,
  type PanelSize,
} from "react-resizable-panels";
import { AnimatePresence, motion } from "framer-motion";
import { House, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CommandPalette } from "@/components/command-palette";
import {
  DEFAULT_LEFT_SIZE,
  DEFAULT_RIGHT_SIZE,
  DEFAULT_SECTION_WIDTH,
  useAppShell,
} from "./app-shell-context";
import { LeftSidebar } from "./LeftSidebar";
import { MainWorkspace } from "./MainWorkspace";
import { AppDock } from "./AppDock";
import { AppRail } from "./AppRail";
import { useBreakpoint } from "./use-breakpoint";

const LAYOUT_KEY = "jamot:shell:layout";
const LEFT_KEY = "jamot:left-collapsed";

export function AppShell() {
  return <AppShellInner />;
}

function AppShellInner() {
  const { space } = useAppShell();
  const breakpoint = useBreakpoint();

  const style = {
    "--space-accent": space.accent,
    "--space-accent-foreground": space.accentForeground,
  } as CSSProperties;

  return (
    <>
      <div
        style={style}
        className="flex h-dvh w-full flex-col overflow-hidden bg-background text-foreground"
      >
        {breakpoint === "desktop" ? <DesktopShell /> : null}
        {breakpoint === "tablet" ? <TabletShell /> : null}
        {breakpoint === "mobile" ? <MobileShell /> : null}
      </div>
      <CommandPalette />
    </>
  );
}

function DesktopShell() {
  const { setLeftSize, setRightSize, activeSection } = useAppShell();
  const leftRef = usePanelRef();
  const rightRef = usePanelRef();
  const restoredRef = useRef(false);
  const [leftCollapsed, setLeftCollapsed] = useState(() => {
    try {
      return window.localStorage.getItem(LEFT_KEY) === "1";
    } catch {
      return true;
    }
  });
  const [dockCollapsed, setDockCollapsed] = useState(false);

  useEffect(() => {
    if (!rightRef.current) return;
    if (activeSection) {
      if (rightRef.current.isCollapsed()) {
        rightRef.current.expand();
      }
      const current = rightRef.current.getSize();
      if (current.inPixels < DEFAULT_SECTION_WIDTH) {
        rightRef.current.resize(DEFAULT_SECTION_WIDTH);
      }
    } else if (!rightRef.current.isCollapsed()) {
      rightRef.current.collapse();
    }
  }, [activeSection, rightRef]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(LAYOUT_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as { left?: number; right?: number };
        if (typeof saved.left === "number" && saved.left >= 1) {
          leftRef.current?.resize(saved.left);
        }
        if (typeof saved.right === "number" && saved.right >= 1) {
          rightRef.current?.resize(saved.right);
        }
      }
    } catch {
      // Ignore malformed layout data.
    } finally {
      restoredRef.current = true;
    }
  }, [leftRef, rightRef]);

  useEffect(() => {
    try {
      window.localStorage.setItem(LEFT_KEY, leftCollapsed ? "1" : "0");
    } catch {
      // ignore storage errors
    }
  }, [leftCollapsed]);

  useEffect(() => {
    if (leftCollapsed) {
      leftRef.current?.collapse();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persistSize = (which: "left" | "right", value: number) => {
    if (!restoredRef.current) return;
    try {
      const raw = window.localStorage.getItem(LAYOUT_KEY);
      const data = raw
        ? (JSON.parse(raw) as Record<string, unknown>)
        : {};
      data[which] = Math.round(value);
      window.localStorage.setItem(LAYOUT_KEY, JSON.stringify(data));
    } catch {
      // Ignore storage errors.
    }
  };

  const handleLeftResize = (size: PanelSize) => {
    setLeftSize(size.inPixels);
    setLeftCollapsed(size.inPixels < 1);
    persistSize("left", size.inPixels);
  };

  const handleRightResize = (size: PanelSize) => {
    setRightSize(size.inPixels);
    setDockCollapsed(size.inPixels < 1);
    persistSize("right", size.inPixels);
  };

  const toggleLeft = () => {
    const panel = leftRef.current;
    if (!panel) return;
    if (panel.isCollapsed()) panel.expand();
    else panel.collapse();
  };

  const toggleDock = () => {
    const panel = rightRef.current;
    if (!panel) return;
    if (panel.isCollapsed()) panel.expand();
    else panel.collapse();
  };

  return (
    <Group id="jamot-shell" orientation="horizontal" className="h-full w-full">
      <Panel
        id="left"
        defaultSize={DEFAULT_LEFT_SIZE}
        minSize={0}
        maxSize={360}
        collapsible
        collapsedSize={0}
        panelRef={leftRef}
        onResize={handleLeftResize}
        className="h-full"
      >
        <LeftSidebar />
      </Panel>

      <Separator
        id="sep-left"
        className="w-px bg-border transition-colors hover:bg-ring data-[separator=active]:bg-ring"
      />

      <Panel id="main" minSize={280} className="h-full">
        <MainWorkspace
          onToggleLeft={toggleLeft}
          leftOpen={!leftCollapsed}
          onToggleDock={toggleDock}
          dockOpen={!dockCollapsed}
        />
      </Panel>

      <Panel
        id="rail"
        minSize={48}
        maxSize={48}
        defaultSize={48}
        className="h-full"
      >
        <AppRail />
      </Panel>

      <Separator
        id="sep-right"
        className="w-px bg-border transition-colors hover:bg-ring data-[separator=active]:bg-ring"
      />

      <Panel
        id="right"
        defaultSize={DEFAULT_RIGHT_SIZE}
        minSize={0}
        maxSize={700}
        collapsible
        collapsedSize={0}
        panelRef={rightRef}
        onResize={handleRightResize}
        className="h-full"
      >
        <AppDock />
      </Panel>
    </Group>
  );
}

function TabletShell() {
  const [dockOpen, setDockOpen] = useState(false);

  return (
    <div className="flex h-full w-full">
      <div className="w-60 shrink-0">
        <LeftSidebar />
      </div>
      <div className="relative flex-1 overflow-hidden">
        <MainWorkspace
          onToggleDock={() => setDockOpen((value) => !value)}
          dockOpen={dockOpen}
        />
        <AnimatePresence>
          {dockOpen ? (
            <>
              <motion.div
                className="absolute inset-0 z-20 bg-black/30"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setDockOpen(false)}
              />
              <motion.div
                className="absolute inset-y-0 right-0 z-30 w-80 max-w-[85vw]"
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "tween", duration: 0.2 }}
              >
                <AppDock />
              </motion.div>
            </>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}

const MOBILE_SECTIONS = ["People", "Agents", "Tasks", "Apps"];

function MobileShell() {
  const [sheet, setSheet] = useState<string | null>(null);

  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1 overflow-hidden">
        <MainWorkspace />
      </div>

      <nav className="flex shrink-0 items-center gap-1 border-t border-border bg-sidebar px-2 py-2">
        <Button
          variant="ghost"
          size="sm"
          className="flex-1"
          onClick={() => setSheet((value) => (value === "nav" ? null : "nav"))}
        >
          <House className="size-4" />
          Nav
        </Button>
        {MOBILE_SECTIONS.map((section) => (
          <Button
            key={section}
            variant="ghost"
            size="sm"
            className="flex-1"
            onClick={() => setSheet((value) => (value === section ? null : section))}
          >
            {section}
          </Button>
        ))}
      </nav>

      <AnimatePresence>
        {sheet ? (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "tween", duration: 0.2 }}
            className="shrink-0 border-t border-border bg-card p-4"
          >
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-display text-base font-semibold">
                {sheet === "nav" ? "Navigation" : sheet}
              </h3>
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                aria-label="Close"
                onClick={() => setSheet(null)}
              >
                <X className="size-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              This panel will appear in a later phase.
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
