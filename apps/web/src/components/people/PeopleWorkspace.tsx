"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Loader2, Star, UserPlus, Users } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { EmptyList } from "@/components/directory/EmptyList";
import { DirectoryToolbar } from "@/components/directory/DirectoryToolbar";
import { useDirectorySearch } from "@/components/directory/use-directory-search";
import type { DirectoryMatch } from "@/components/directory/search";
import { useAppShell } from "@/components/app-shell/app-shell-context";
import { getOrganizationMembers } from "@/lib/api-client";
import { memberToPersonProfile } from "@/lib/live-directory";
import { AddPersonModal } from "./AddPersonModal";
import { PersonProfile } from "./PersonProfile";
import { overallReputation, type PersonProfile as Person } from "./people-data";

function PersonCard({
  person,
  match,
  onOpen,
}: {
  person: Person;
  match?: DirectoryMatch;
  onOpen: (id: string) => void;
}) {
  const score = overallReputation(person.reputation);
  return (
    <button
      type="button"
      onClick={() => onOpen(person.id)}
      className="flex flex-col gap-3 rounded-lg border border-border bg-card p-3 text-left transition-colors hover:bg-muted"
    >
      <div className="flex items-center gap-2.5">
        <Avatar name={person.name} size="md" />
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-sm font-medium">{person.name}</span>
            <span className="flex shrink-0 items-center gap-1 text-xs font-medium tabular-nums text-muted-foreground">
              <Star className="size-3 fill-amber-400 text-amber-400" />
              {score}
            </span>
          </div>
          <p className="truncate text-xs text-muted-foreground">{person.role}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1">
        {person.skills.slice(0, 3).map((skill) => (
          <Badge
            key={skill}
            variant="secondary"
            className="px-1.5 py-0 text-[10px]"
          >
            {skill}
          </Badge>
        ))}
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
      ) : (
        <p className="text-xs text-muted-foreground">
          {person.identity.location} · {person.availability}
        </p>
      )}
    </button>
  );
}

export function PeopleWorkspace() {
  const { space } = useAppShell();
  const orgId = space.kind === "organization" ? space.organizationId : undefined;
  return (
    <PeopleDirectory
      key={space.id}
      orgId={orgId}
      spaceName={space.name}
      isOrganization={space.kind === "organization"}
    />
  );
}

function PeopleDirectory({
  orgId,
  spaceName,
  isOrganization,
}: {
  orgId: string | undefined;
  spaceName: string;
  isOrganization: boolean;
}) {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(orgId ? true : false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!orgId) return;
    let cancelled = false;
    getOrganizationMembers(orgId)
      .then((members) => {
        if (cancelled) return;
        setPeople(
          members.map((member) => memberToPersonProfile(member, spaceName)),
        );
      })
      .catch(() => {
        if (!cancelled) setPeople([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [orgId, spaceName]);

  const search = useDirectorySearch({ kind: "people", people, agents: [] });

  const byId = useMemo(() => new Map(people.map((person) => [person.id, person])), [people]);
  const selected = selectedId ? (byId.get(selectedId) ?? null) : null;

  const visible = useMemo(() => {
    const trimmed = search.query.trim();
    if (!trimmed) return null;
    const matches: { person: Person; match: DirectoryMatch }[] = [];
    for (const match of search.results) {
      const person = byId.get(match.id);
      if (person) matches.push({ person, match });
    }
    return matches;
  }, [search.query, search.results, byId]);

  const showSearchResult = search.query.trim() !== "" && search.hasSearched;

  return (
    <div className="relative flex min-h-0 w-full flex-1 flex-col overflow-hidden">
      <DirectoryToolbar
        placeholder="Search people… try “Lisbon”, “quiet hours”, “runbook”"
        query={search.query}
        loading={search.searching}
        onQueryChange={search.updateQuery}
        onSubmit={search.submit}
        onClear={search.clear}
        actionLabel="Add a human"
        actionIcon={<UserPlus className="size-3.5" />}
        onAction={() => setCreating(true)}
      />

      {selected ? (
        <section className="min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto flex max-w-2xl flex-col px-6 pb-0 pt-4">
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              className="flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
              Back to directory
            </button>
          </div>
          <PersonProfile person={selected} />
        </section>
      ) : (
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
                <Users className="size-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  No people match “{search.query}”.
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
                  ? visible.map(({ person, match }) => (
                      <PersonCard
                        key={person.id}
                        person={person}
                        match={match}
                        onOpen={setSelectedId}
                      />
                    ))
                  : loading ? (
                      <EmptyList
                        icon={Loader2}
                        title="Loading people…"
                        description="Fetching members for this space."
                      />
                    ) : people.length === 0 ? (
                      <EmptyList
                        icon={Users}
                        title="No people here yet"
                        description={
                          isOrganization
                            ? "This organization has no members yet. Invite people from Settings → People."
                            : "This is your personal space. Switch to an organization to browse its members."
                        }
                      />
                    ) : (
                      people.map((person) => (
                        <PersonCard
                          key={person.id}
                          person={person}
                          onOpen={setSelectedId}
                        />
                      ))
                    )}
              </motion.div>
            )}
          </AnimatePresence>
        </section>
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
                <AddPersonModal
                  onAdd={(person) => setPeople((previous) => [...previous, person])}
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