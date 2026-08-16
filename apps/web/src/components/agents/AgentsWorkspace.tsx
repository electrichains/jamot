"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

import { AgentList } from "./AgentList";
import { AgentProfile } from "./AgentProfile";
import { CreateAgent } from "./CreateAgent";
import { AGENTS } from "./agents-data";

export function AgentsWorkspace() {
  const [selectedId, setSelectedId] = useState<string | null>(
    AGENTS[0]?.id ?? null,
  );
  const [creating, setCreating] = useState(false);

  const selected = AGENTS.find((agent) => agent.id === selectedId) ?? null;

  return (
    <div className="relative flex min-h-0 w-full flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 items-center justify-end border-b border-border px-2 py-1.5">
        <Button size="sm" variant="outline" onClick={() => setCreating(true)}>
          <Plus className="size-3.5" />
          New agent
        </Button>
      </div>

      <div className="flex min-h-0 w-full flex-1">
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