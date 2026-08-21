"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAppShell } from "./app-shell-context";
import { appIcon } from "./app-icons";

function RailToggle({
  checked,
  label,
  onToggle,
}: {
  checked: boolean;
  label: string;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onToggle}
      className={cn(
        "relative h-5 w-9 shrink-0 rounded-full transition-colors",
        checked ? "bg-space-accent" : "bg-muted",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 size-4 rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-[18px]" : "translate-x-0.5",
        )}
      />
    </button>
  );
}

export function AppRailConfig({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { availableApps, railAppIds, toggleRailApp } = useAppShell();

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            className="absolute inset-0 z-30 bg-black/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="glass-border absolute inset-y-0 right-14 z-40 flex w-80 max-w-[85vw] flex-col border-l border-border/40 bg-sidebar text-sidebar-foreground shadow-2xl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
          >
            <header className="flex h-11 shrink-0 items-center justify-between border-b border-border/40 px-3">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Apps
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 rounded-lg"
                aria-label="Close apps configuration"
                onClick={onClose}
              >
                <X className="size-3.5" />
              </Button>
            </header>
            <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-3">
              {availableApps.length === 0 ? (
                <p className="text-xs text-muted-foreground">No apps available.</p>
              ) : (
                availableApps.map((app) => {
                  const Icon = appIcon(app.id);
                  const enabled = railAppIds.includes(app.id);
                  return (
                    <div
                      key={app.id}
                      className="flex items-center gap-3 rounded-xl border border-border/40 px-3 py-2"
                    >
                      <Icon className="size-5 shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">
                          {app.name}
                        </div>
                        <div className="truncate text-xs text-muted-foreground">
                          {app.description}
                        </div>
                      </div>
                      <RailToggle
                        checked={enabled}
                        label={`Toggle ${app.name}`}
                        onToggle={() => toggleRailApp(app.id)}
                      />
                    </div>
                  );
                })
              )}
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
