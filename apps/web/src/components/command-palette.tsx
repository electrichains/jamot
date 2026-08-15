"use client";

import { useEffect, useState } from "react";
import { Command } from "cmdk";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bot,
  CalendarRange,
  FileText,
  ListTodo,
  MemoryStick,
  MessageSquare,
  Search,
  User,
  UserPlus,
  Vault,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface PaletteItem {
  label: string;
  icon: LucideIcon;
}

const GROUPS: { name: string; items: PaletteItem[] }[] = [
  {
    name: "Navigate",
    items: [
      { label: "Go to Maria", icon: User },
      { label: "Open Q4 Sales", icon: FileText },
      { label: "Open OrganicChart", icon: CalendarRange },
      { label: "Open Vault", icon: Vault },
    ],
  },
  {
    name: "Create",
    items: [
      { label: "Create task", icon: ListTodo },
      { label: "Create agent", icon: Bot },
    ],
  },
  {
    name: "Connect",
    items: [
      { label: "Add WhatsApp", icon: MessageSquare },
      { label: "Invite person", icon: UserPlus },
    ],
  },
  {
    name: "Memory",
    items: [{ label: "Search memory", icon: MemoryStick }],
  },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[14vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <motion.div
            className="relative w-full max-w-xl overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-2xl"
            initial={{ opacity: 0, scale: 0.97, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            <Command
              label="Jamot command menu"
              className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground"
            >
              <div className="flex items-center gap-2 border-b border-border px-3">
                <Search className="size-4 shrink-0 text-muted-foreground" />
                <Command.Input
                  autoFocus
                  placeholder="Search or run a command…"
                  className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
              </div>
              <Command.List className="max-h-80 overflow-y-auto p-2">
                <Command.Empty className="py-8 text-center text-sm text-muted-foreground">
                  No results found.
                </Command.Empty>
                {GROUPS.map((group) => (
                  <Command.Group key={group.name} heading={group.name}>
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Command.Item
                          key={item.label}
                          value={item.label}
                          onSelect={() => setOpen(false)}
                          className="flex cursor-pointer select-none items-center gap-3 rounded-lg px-3 py-2 text-sm data-[selected=true]:bg-muted"
                        >
                          <Icon className="size-4 text-muted-foreground" />
                          <span>{item.label}</span>
                        </Command.Item>
                      );
                    })}
                  </Command.Group>
                ))}
              </Command.List>
            </Command>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
