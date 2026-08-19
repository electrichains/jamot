"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  LogIn,
  LogOut,
  Plus,
  Search,
  Settings,
  ShieldCheck,
} from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BrandLogo } from "@/components/brand-logo";
import { useAuth } from "@/components/auth/auth-context";
import { ThemeToggle } from "@/components/theme-toggle";
import { ChatHistory } from "@/components/chat/ChatHistory";
import { useAppShell } from "./app-shell-context";

export function LeftSidebar() {
  return (
    <aside className="flex h-full flex-col border-r border-border bg-sidebar text-sidebar-foreground">
      <div className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-3">
        <BrandLogo className="size-6" />
        <span className="font-display text-sm font-semibold tracking-tight">Jamot</span>
      </div>

      <div className="flex flex-col gap-2 p-3">
        <Button className="w-full justify-start gap-2 bg-space-accent text-space-accent-foreground hover:bg-space-accent/90">
          <Plus className="size-4" />
          New
        </Button>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search…" className="pl-8" />
        </div>
      </div>

      <div className="min-h-0 flex-1">
        <ChatHistory />
      </div>

      <SpaceSwitcher />
    </aside>
  );
}

function SpaceSwitcher() {
  const { space, setSpace, spaces } = useAppShell();
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative border-t border-border p-2">
      <div className="flex items-center gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Avatar name={user?.actor.displayName ?? "Andrea"} size="sm" />
          <span className="truncate text-sm font-medium">
            {user?.actor.displayName ?? "Andrea"}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          aria-label="Settings menu"
          onClick={() => setOpen((value) => !value)}
        >
          <Settings className="size-4" />
        </Button>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-2 right-2 z-20 mb-1 overflow-hidden rounded-lg border border-border bg-card p-1 shadow-lg"
          >
            <p className="px-2.5 pb-1 pt-2 text-xs font-medium text-muted-foreground">
              {space.name}
            </p>
            <ul className="flex flex-col gap-0.5">
              {spaces.map((candidate) => (
                <li key={candidate.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSpace(candidate.id);
                      setOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm transition-colors hover:bg-muted"
                  >
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={{ backgroundColor: candidate.accent }}
                    />
                    <span className="flex-1 text-left">{candidate.name}</span>
                    {space.id === candidate.id ? (
                      <Check className="size-4 text-foreground" />
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>

            <div className="mt-1 flex items-center justify-between border-t border-border pt-1">
              <Link
                href="/settings"
                className="flex flex-1 items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Settings className="size-4" />
                Settings
              </Link>
              {user?.isSuperAdmin ? (
                <Link
                  href="/admin"
                  className="flex flex-1 items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <ShieldCheck className="size-4" />
                  Admin
                </Link>
              ) : null}
              <ThemeToggle />
            </div>

            {user ? (
              <button
                type="button"
                onClick={() => void signOut()}
                className="flex w-full items-center gap-2.5 rounded-lg border-t border-border px-2.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <LogOut className="size-4" />
                Sign out
              </button>
            ) : (
              <Link
                href="/login"
                className="flex w-full items-center gap-2.5 rounded-lg border-t border-border px-2.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <LogIn className="size-4" />
                Sign in
              </Link>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
