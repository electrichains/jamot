"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, UserPlus, Users } from "lucide-react";

import { EmptyList } from "@/components/directory/EmptyList";
import { DirectoryToolbar } from "@/components/directory/DirectoryToolbar";
import { useDirectorySearch } from "@/components/directory/use-directory-search";
import type { DirectoryMatch } from "@/components/directory/search";
import { useAppShell } from "@/components/app-shell/app-shell-context";
import { useAuth } from "@/components/auth/auth-context";
import { addOrganizationMember, getOrganizationMembers } from "@/lib/api-client";
import { memberToPersonProfile } from "@/lib/live-directory";
import { cn } from "@/lib/utils";
import { PersonDrawer } from "./PersonDrawer";
import { PeopleTable } from "./PeopleTable";
import { QuickAddPerson } from "./QuickAddPerson";
import { PeopleLists } from "./PeopleLists";
import type { PersonProfile as Person } from "./people-data";
import {
  consumeAddPerson,
  isAddPersonPending,
  subscribeAddPerson,
} from "./add-person-signal";

function localPersonFromEmail(email: string): Person {
  const displayName =
    email.split("@")[0].replace(/[._-]+/g, " ").trim() || email;
  return {
    id: `person-${Date.now()}`,
    name: displayName,
    role: "Team member",
    identity: {
      email,
      department: "",
      location: "Remote",
      timezone: "UTC+1",
      reportsTo: "Andrea",
    },
    selfDescribed: {},
    integral: {},
    skills: [],
    experience: [],
    preferences: {},
    goals: [],
    availability: "Available · UTC+1 · 9–18",
    contributions: [],
    reputation: {
      helpfulness: 0.5,
      reliability: 0.5,
      collaboration: 0.5,
      delivery: 0.5,
    },
    memory: {
      interactions: 0,
      notes: ["Added to the local directory."],
    },
  };
}

export function PeopleWorkspace() {
  const { space } = useAppShell();
  const { user } = useAuth();
  const orgId = space.kind === "organization" ? space.organizationId : undefined;
  return (
    <PeopleDirectory
      key={space.id}
      orgId={orgId}
      spaceName={space.name}
      spaceId={space.spaceId ?? user?.person?.membershipSpaceIds[0] ?? null}
      isOrganization={space.kind === "organization"}
    />
  );
}

function PeopleDirectory({
  orgId,
  spaceName,
  spaceId,
  isOrganization,
}: {
  orgId: string | undefined;
  spaceName: string;
  spaceId: string | null;
  isOrganization: boolean;
}) {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(orgId ? true : false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [adding, setAdding] = useState(() => isAddPersonPending());
  const [tab, setTab] = useState<"directory" | "lists">("directory");

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

  useEffect(() => {
    const unsubscribe = subscribeAddPerson(() => setAdding(true));
    if (isAddPersonPending()) {
      consumeAddPerson();
    }
    return unsubscribe;
  }, []);

  const search = useDirectorySearch({ kind: "people", people, agents: [] });

  const byId = useMemo(
    () => new Map(people.map((person) => [person.id, person])),
    [people],
  );
  const selected = selectedId ? (byId.get(selectedId) ?? null) : null;

  const matches = useMemo(() => {
    const map: Record<string, DirectoryMatch> = {};
    for (const match of search.results) map[match.id] = match;
    return map;
  }, [search.results]);

  const visible = useMemo(() => {
    const trimmed = search.query.trim();
    if (!trimmed) return people;
    const ranked: Person[] = [];
    for (const match of search.results) {
      const person = byId.get(match.id);
      if (person) ranked.push(person);
    }
    return ranked;
  }, [search.query, search.results, byId, people]);

  const showSearchResult = search.query.trim() !== "" && search.hasSearched;

  const handleAdd = async ({
    email,
    role,
  }: {
    email: string;
    role: "admin" | "member";
  }) => {
    if (orgId) {
      const member = await addOrganizationMember(orgId, { email, role });
      setPeople((previous) => [
        ...previous,
        memberToPersonProfile(member, spaceName),
      ]);
    } else {
      setPeople((previous) => [...previous, localPersonFromEmail(email)]);
    }
  };

  return (
    <div className="relative flex min-h-0 w-full flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 items-center gap-1 border-b border-border px-2 pt-1.5">
        <button
          type="button"
          onClick={() => setTab("directory")}
          className={cn(
            "rounded-t-md px-3 py-1.5 text-sm font-medium transition-colors",
            tab === "directory"
              ? "border-b-2 border-space-accent text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          Directory
        </button>
        <button
          type="button"
          onClick={() => setTab("lists")}
          className={cn(
            "rounded-t-md px-3 py-1.5 text-sm font-medium transition-colors",
            tab === "lists"
              ? "border-b-2 border-space-accent text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          Lists
        </button>
      </div>

      {tab === "lists" ? (
        <PeopleLists spaceId={spaceId} orgId={orgId} />
      ) : (
        <>
          <DirectoryToolbar
        placeholder="Search people… try “Lisbon”, “quiet hours”, “runbook”"
        query={search.query}
        loading={search.searching}
        onQueryChange={search.updateQuery}
        onSubmit={search.submit}
        onClear={search.clear}
        actionLabel="Add a human"
        actionIcon={<UserPlus className="size-3.5" />}
        onAction={() => setAdding(true)}
      />

      <section className="relative flex min-h-0 w-full flex-1 flex-col overflow-hidden">
        {showSearchResult && search.searching ? (
          <div className="shrink-0 border-b border-border px-4 py-2 text-sm text-muted-foreground">
            Asking Main Manager to interpret the matches…
          </div>
        ) : null}

        {search.interpretation && showSearchResult ? (
          <div className="shrink-0 border-b border-border bg-muted/40 px-4 py-2 text-sm">
            {search.interpretation}
          </div>
        ) : null}

        {loading ? (
          <div className="flex min-h-0 flex-1">
            <EmptyList
              icon={Loader2}
              title="Loading people…"
              description="Fetching members for this space."
            />
          </div>
        ) : showSearchResult && visible.length === 0 ? (
          <div className="flex min-h-0 flex-1">
            <EmptyList
              icon={Users}
              title="No people match your search"
              description={`“${search.query}” didn’t match anyone in this directory.`}
            />
          </div>
        ) : !showSearchResult && people.length === 0 ? (
          <div className="flex min-h-0 flex-1">
            <EmptyList
              icon={Users}
              title="No people here yet"
              description={
                isOrganization
                  ? "This organization has no members yet. Invite people from Settings → People."
                  : "This is your personal space. Switch to an organization to browse its members."
              }
            />
          </div>
        ) : (
          <div className="flex min-h-0 flex-1">
            <PeopleTable
              people={visible}
              matches={matches}
              showMatch={showSearchResult}
              onOpen={setSelectedId}
            />
          </div>
        )}
      </section>
        </>
      )}

      <AnimatePresence>
        {selected ? (
          <PersonDrawer person={selected} onClose={() => setSelectedId(null)} />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {adding ? (
          <>
            <motion.div
              className="absolute inset-0 z-20 bg-black/20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAdding(false)}
            />
            <div className="absolute inset-0 z-30 flex items-start justify-center overflow-y-auto p-4">
              <motion.div
                className="my-auto w-full max-w-md"
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ type: "tween", duration: 0.15 }}
              >
                <QuickAddPerson
                  onAdd={handleAdd}
                  onDone={() => setAdding(false)}
                />
              </motion.div>
            </div>
          </>
        ) : null}
      </AnimatePresence>
    </div>
  );
}