"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { CheckCircle2, ListChecks, Settings2, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { KIND_LABEL, type OrgKind, type OrgNode } from "./org-data";

const KIND_ACCENT: Record<OrgKind, string> = {
  dream: "#8b5cf6",
  manager: "#52525b",
  dept: "#a1a1aa",
  human: "#0ea5e9",
  agent: "#10b981",
};

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-1.5">
      <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      {children}
    </section>
  );
}

export function NodeDrawer({ node, onClose }: { node: OrgNode; onClose: () => void }) {
  const router = useRouter();
  const agentId = node.kind === "agent" ? node.id.split("-agent-")[1] : undefined;
  const openAgentConfig = () => {
    if (!agentId) return;
    router.push(`/agents/${agentId}`);
  };
  return (
    <>
      <motion.div
        className="absolute inset-0 z-20 bg-black/20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className="absolute inset-y-0 right-0 z-30 flex w-80 max-w-[85vw] flex-col border-l border-border bg-card"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "tween", duration: 0.2 }}
      >
        <header className="flex items-start justify-between gap-3 border-b border-border p-4">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span
                className="size-2.5 rounded-full"
                style={{ backgroundColor: KIND_ACCENT[node.kind] }}
              />
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {KIND_LABEL[node.kind]}
              </span>
            </div>
            <h2 className="font-display text-lg font-semibold">{node.label}</h2>
            {node.role ? <p className="text-sm text-muted-foreground">{node.role}</p> : null}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 shrink-0"
            aria-label="Close"
            onClick={onClose}
          >
            <X className="size-4" />
          </Button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-4">
          <Section title="Skills">
            {node.skills && node.skills.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {node.skills.map((skill) => (
                  <Badge key={skill} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No skills listed.</p>
            )}
          </Section>

          <Section title="Memory">
            <p className="text-sm text-muted-foreground">{node.memory ?? "No memory yet."}</p>
          </Section>

          <Section title="Current tasks">
            {node.currentTasks && node.currentTasks.length > 0 ? (
              <ul className="flex flex-col gap-1.5">
                {node.currentTasks.map((task) => (
                  <li key={task} className="flex items-center gap-2 text-sm">
                    <ListChecks className="size-4 shrink-0 text-muted-foreground" />
                    {task}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No open tasks.</p>
            )}
          </Section>

          <Section title="Performance">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="size-4 shrink-0 text-muted-foreground" />
              {node.performance ?? "No performance data yet."}
            </div>
          </Section>
        </div>

        <footer className="flex flex-col gap-2 border-t border-border p-4">
          {agentId ? (
            <Button className="w-full" onClick={openAgentConfig}>
              <Settings2 className="size-4" />
              Configure agent
            </Button>
          ) : null}
          <Button variant="outline" className="w-full">
            Assign task
          </Button>
        </footer>
      </motion.div>
    </>
  );
}
