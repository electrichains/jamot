"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AgentList } from "@/components/agents/AgentList";
import { AgentProfile } from "@/components/agents/AgentProfile";
import { CreateAgent } from "@/components/agents/CreateAgent";
import { AGENTS } from "@/components/agents/agents-data";

export default function AgentsPage() {
  const [selectedId, setSelectedId] = useState<string | null>(AGENTS[0]?.id ?? null);
  const [creating, setCreating] = useState(false);

  const selected = AGENTS.find((agent) => agent.id === selectedId) ?? null;

  return (
    <div className="relative flex h-dvh w-full flex-col overflow-hidden bg-background text-foreground">
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-border px-3">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Jamot
        </Link>
        <span className="font-display text-sm font-semibold">Agents</span>
        <div className="ml-auto">
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus className="size-4" />
            New agent
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <AgentList agents={AGENTS} selectedId={selectedId} onSelect={setSelectedId} />

        <main className="min-w-0 flex-1 overflow-y-auto">
          {selected ? (
            <AgentProfile agent={selected} />
          ) : (
            <div className="flex h-full items-center justify-center p-6">
              <p className="text-sm text-muted-foreground">Select an agent to view its profile.</p>
            </div>
          )}
        </main>
      </div>

      <AnimatePresence>
        {creating ? (
          <>
            <motion.div
              className="absolute inset-0 z-20 bg-black/20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCreating(false)}
            />
            <div className="absolute inset-0 z-30 flex items-start justify-center overflow-y-auto p-4">
              <motion.div
                className="my-auto w-full max-w-lg"
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ type: "tween", duration: 0.15 }}
              >
                <CreateAgent onDone={() => setCreating(false)} />
              </motion.div>
            </div>
          </>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
