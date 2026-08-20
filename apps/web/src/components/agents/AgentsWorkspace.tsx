"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, Loader2, Plus } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { EmptyList } from "@/components/directory/EmptyList";
import { DirectoryToolbar } from "@/components/directory/DirectoryToolbar";
import { useDirectorySearch } from "@/components/directory/use-directory-search";
import type { DirectoryMatch } from "@/components/directory/search";
import { useAppShell } from "@/components/app-shell/app-shell-context";
import { getAgents } from "@/lib/api-client";
import { agentToAgentProfile } from "@/lib/live-directory";
import { cn } from "@/lib/utils";
import { AgentConfigurator } from "./config/agent-configurator";
import { CreateAgent } from "./CreateAgent";
import { AUTONOMY_LABEL, type AgentProfile as Agent } from "./agents-data";

const AVAILABILITY: Record<
  Agent["availability"],
  { label: string; dot: string }
> = {
  available: { label: "Available", dot: "bg-emerald-500" },
  busy: { label: "Busy", dot: "bg-amber-500" },
  offline: { label: "Offline", dot: "bg-zinc-400" },
};

function reputationScore(agent: Agent): number {
  const values = Object.values(agent.reputation);
  if (values.length === 0) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function AgentCard({
  agent,
  match,
  onOpen,
}: {
  agent: Agent;
  match?: DirectoryMatch;
  onOpen: (id: string) => void;
}) {
  const availability = AVAILABILITY[agent.availability];
  const score = reputationScore(agent);
  return (
    <button
      type="button"
      onClick={() => onOpen(agent.id)}
      className="flex flex-col gap-3 rounded-lg border border-border bg-card p-3 text-left transition-colors hover:bg-muted"
    >
      <div className="flex items-center gap-2.5">
        <Avatar name={agent.name} size="md" />
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-sm font-medium">{agent.name}</span>
            <Badge variant="accent" className="px-1.5 text-[10px]">
              {AUTONOMY_LABEL[agent.autonomy]}
            </Badge>
          </div>
          <p className="truncate text-xs text-muted-foreground">{agent.role}</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className={cn("size-2 rounded-full", availability.dot)} aria-hidden />
          {availability.label}
        </span>
        <span className="flex items-center gap-2">
          {agent.channels.length > 0 ? (
            <span>{agent.channels.slice(0, 2).join(", ")}</span>
          ) : null}
          <span>{agent.tasks.active} active</span>
          <span className="font-medium tabular-nums text-foreground">
            {score}%
          </span>
        </span>
      </div>

      {match ? (
        <div className="rounded-md bg-muted/50 px-2 py-1.5">
          <div className="flex flex-wrap gap-1">
            {match.matchedFields.map((label) => (
              <span
                key={label}
                className="text-[10px] font-medium uppercase tracking-wide text-space-accent"
              >
                {label}
              </span>
            ))}
          </div>
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
            {match.snippet}
          </p>
        </div>
      ) : null}
    </button>
  );
}

export function AgentsWorkspace() {
  const { space } = useAppShell();
  const orgId = space.kind === "organization" ? space.organizationId : undefined;
  return (
    <AgentsDirectory
      key={space.id}
      orgId={orgId}
      isOrganization={space.kind === "organization"}
    />
  );
}

function AgentsDirectory({
  orgId,
  isOrganization,
}: {
  orgId: string | undefined;
  isOrganization: boolean;
}) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getAgents()
      .then((items) => {
        if (cancelled) return;
        const visible = orgId
          ? items.filter((agent) => agent.organizationIds.includes(orgId))
          : items;
        setAgents(visible.map(agentToAgentProfile));
      })
      .catch(() => {
        if (!cancelled) setAgents([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [orgId]);

  const search = useDirectorySearch({ kind: "agents", people: [], agents });

  const byId = useMemo(() => new Map(agents.map((agent) => [agent.id, agent])), [agents]);

  const visible = useMemo(() => {
    const trimmed = search.query.trim();
    if (!trimmed) return null;
    const matches: { agent: Agent; match: DirectoryMatch }[] = [];
    for (const match of search.results) {
      const agent = byId.get(match.id);
      if (agent) matches.push({ agent, match });
    }
    return matches;
  }, [search.query, search.results, byId]);

  const showSearchResult = search.query.trim() !== "" && search.hasSearched;

  const openAgent = (id: string) => setSelectedId(id);

  return (
    <div className="relative flex min-h-0 w-full flex-1 flex-col overflow-hidden">
      {selectedId ? (
        <AgentConfigurator
          key={selectedId}
          agentId={selectedId}
          onBack={() => setSelectedId(null)}
          onDeleted={() => setSelectedId(null)}
        />
      ) : (
        <>
          <DirectoryToolbar
            placeholder="Search agents… try “reconciliation”, “quiet hours”, “telegram”"
            query={search.query}
            loading={search.searching}
            onQueryChange={search.updateQuery}
            onSubmit={search.submit}
            onClear={search.clear}
            actionLabel="Add an agent"
            actionIcon={<Plus className="size-3.5" />}
            onAction={() => setCreating(true)}
          />

          <section className="min-w-0 flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              {showSearchResult && search.searching ? (
                <motion.div
                  key="thinking"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="border-b border-border px-4 py-2 text-sm text-muted-foreground"
                >
                  Asking Main Manager to interpret the matches…
                </motion.div>
              ) : null}

              {search.interpretation && showSearchResult ? (
                <motion.div
                  key="interpretation"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border-b border-border bg-muted/40 px-4 py-2 text-sm"
                >
                  {search.interpretation}
                </motion.div>
              ) : null}

              {showSearchResult && visible && visible.length === 0 ? (
                <motion.div
                  key="empty-search"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center"
                >
                  <Bot className="size-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    No agents match “{search.query}”.
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key={showSearchResult ? search.query : "all"}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                  className="grid grid-cols-1 gap-2 p-3 sm:grid-cols-2 xl:grid-cols-3"
                >
                  {showSearchResult && visible
                    ? visible.map(({ agent, match }) => (
                        <AgentCard
                          key={agent.id}
                          agent={agent}
                          match={match}
                          onOpen={openAgent}
                        />
                      ))
                    : loading ? (
                        <EmptyList
                          icon={Loader2}
                          title="Loading agents…"
                          description="Fetching agents for this space."
                        />
                      ) : agents.length === 0 ? (
                        <EmptyList
                          icon={Bot}
                          title="No agents here yet"
                          description={
                            isOrganization
                              ? "No agents are deployed to this organization yet."
                              : "This is your personal space. Switch to an organization to see its agents."
                          }
                        />
                      ) : (
                        agents.map((agent) => (
                          <AgentCard
                            key={agent.id}
                            agent={agent}
                            onOpen={openAgent}
                          />
                        ))
                      )}
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        </>
      )}

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
                <CreateAgent
                  onCreated={(id) => setSelectedId(id)}
                  onDone={() => setCreating(false)}
                />
              </motion.div>
            </div>
          </>
        ) : null}
      </AnimatePresence>
    </div>
  );
}