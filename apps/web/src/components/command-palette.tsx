"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bot,
  FileText,
  House,
  ListTodo,
  MemoryStick,
  MessageSquare,
  Network,
  Search,
  Settings,
  User,
  UserPlus,
  Vault,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { useAppShell } from "@/components/app-shell/app-shell-context";
import { requestAddPerson } from "@/components/people/add-person-signal";

type PaletteAction =
  | { type: "navigate"; href: string }
  | { type: "run" }
  | { type: "add-person" };

interface PaletteItem {
  id: string;
  label: string;
  icon: LucideIcon;
  keywords?: string;
  action: PaletteAction;
}

interface PaletteGroup {
  name: string;
  items: PaletteItem[];
}

const GROUPS: PaletteGroup[] = [
  {
    name: "Search",
    items: [
      { id: "go-maria", label: "Go to Maria", icon: User, action: { type: "run" } },
      { id: "open-q4", label: "Open Q4 Sales", icon: FileText, action: { type: "run" } },
      { id: "create-task", label: "Create task", icon: ListTodo, action: { type: "run" } },
      {
        id: "open-org-chart",
        label: "Open OrganicChart",
        icon: Network,
        keywords: "organization org chart people",
        action: { type: "navigate", href: "/organization" },
      },
      { id: "add-whatsapp", label: "Add WhatsApp", icon: MessageSquare, action: { type: "run" } },
      { id: "invite-person", label: "Invite person", icon: UserPlus, keywords: "add human member team", action: { type: "add-person" } },
      {
        id: "create-agent",
        label: "Create agent",
        icon: Bot,
        keywords: "assistant bot",
        action: { type: "navigate", href: "/settings" },
      },
      {
        id: "open-vault",
        label: "Open Vault",
        icon: Vault,
        keywords: "secrets credentials",
        action: { type: "navigate", href: "/settings" },
      },
      { id: "search-memory", label: "Search memory", icon: MemoryStick, action: { type: "run" } },
    ],
  },
  {
    name: "Actions",
    items: [
      { id: "go-home", label: "Go to Home", icon: House, action: { type: "navigate", href: "/" } },
      {
        id: "open-settings",
        label: "Open Settings",
        icon: Settings,
        action: { type: "navigate", href: "/settings" },
      },
      {
        id: "open-organization",
        label: "Open Organization",
        icon: Network,
        action: { type: "navigate", href: "/organization" },
      },
    ],
  },
];

export function CommandPalette() {
  const router = useRouter();
  const { setActiveSection } = useAppShell();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

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

  const close = () => {
    setOpen(false);
    setSearch("");
  };

  const visibleGroups = useMemo(() => {
    const terms = search.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return GROUPS.map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (terms.length === 0) return true;
        const haystack = `${item.label} ${item.keywords ?? ""}`.toLowerCase();
        return terms.every((term) => haystack.includes(term));
      }),
    })).filter((group) => group.items.length > 0);
  }, [search]);

  const runAction = (action: PaletteAction) => {
    if (action.type === "navigate") {
      router.push(action.href);
    } else if (action.type === "add-person") {
      setActiveSection("people");
      requestAddPerson();
    }
    close();
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[14vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onKeyDown={(event) => {
            if (event.key === "Escape") close();
          }}
        >
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={close}
          />
          <motion.div
            className="relative w-full max-w-xl overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-2xl"
            initial={{ opacity: 0, scale: 0.97, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            <Command
              shouldFilter={false}
              loop
              label="Jamot command menu"
              className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground"
            >
              <div className="flex items-center gap-2 border-b border-border px-3">
                <Search className="size-4 shrink-0 text-muted-foreground" />
                <Command.Input
                  autoFocus
                  value={search}
                  onValueChange={setSearch}
                  placeholder="Search or run a command…"
                  className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
              </div>
              <Command.List className="max-h-80 overflow-y-auto p-2">
                {visibleGroups.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    No results found.
                  </div>
                ) : (
                  visibleGroups.map((group) => (
                    <Command.Group key={group.name} heading={group.name}>
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        return (
                          <Command.Item
                            key={item.id}
                            value={item.id}
                            onSelect={() => runAction(item.action)}
                            className="flex cursor-pointer select-none items-center gap-3 rounded-lg px-3 py-2 text-sm data-[selected=true]:bg-muted"
                          >
                            <Icon className="size-4 text-muted-foreground" />
                            <span>{item.label}</span>
                          </Command.Item>
                        );
                      })}
                    </Command.Group>
                  ))
                )}
              </Command.List>
            </Command>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
