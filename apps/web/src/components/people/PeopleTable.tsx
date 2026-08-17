"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Star } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import type { DirectoryMatch } from "@/components/directory/search";
import { cn } from "@/lib/utils";
import { overallReputation, type PersonProfile as Person } from "./people-data";

type SortKey =
  | "name"
  | "role"
  | "email"
  | "location"
  | "reputation"
  | "availability";

interface Column {
  key: SortKey;
  label: string;
  headerClassName?: string;
  cellClassName?: string;
  sortValue: (person: Person) => string | number;
}

const COLUMNS: Column[] = [
  {
    key: "name",
    label: "Person",
    headerClassName: "w-[22%]",
    sortValue: (person) => person.name.toLowerCase(),
  },
  {
    key: "role",
    label: "Role",
    headerClassName: "w-[16%]",
    sortValue: (person) => person.role.toLowerCase(),
  },
  {
    key: "email",
    label: "Email",
    headerClassName: "w-[22%]",
    sortValue: (person) => person.identity.email.toLowerCase(),
  },
  {
    key: "location",
    label: "Location",
    headerClassName: "w-[14%]",
    sortValue: (person) => person.identity.location.toLowerCase(),
  },
  {
    key: "reputation",
    label: "Reputation",
    headerClassName: "w-[12%]",
    sortValue: (person) => overallReputation(person.reputation),
  },
  {
    key: "availability",
    label: "Availability",
    headerClassName: "w-[14%]",
    sortValue: (person) => person.availability.toLowerCase(),
  },
];

type SortState = { key: SortKey; dir: "asc" | "desc" } | null;

export function PeopleTable({
  people,
  matches,
  showMatch,
  onOpen,
}: {
  people: Person[];
  matches: Record<string, DirectoryMatch>;
  showMatch: boolean;
  onOpen: (id: string) => void;
}) {
  const [sort, setSort] = useState<SortState>(null);

  const toggleSort = (key: SortKey) => {
    setSort((previous) => {
      if (previous?.key === key) {
        return previous.dir === "asc" ? { key, dir: "desc" } : null;
      }
      return { key, dir: "asc" };
    });
  };

  const sorted = useMemo(() => {
    const list = [...people];
    if (!sort) return list;
    const column = COLUMNS.find((candidate) => candidate.key === sort.key);
    if (!column) return list;
    list.sort((a, b) => {
      const av = column.sortValue(a);
      const bv = column.sortValue(b);
      const comparison =
        typeof av === "number" && typeof bv === "number"
          ? av - bv
          : String(av).localeCompare(String(bv));
      return sort.dir === "asc" ? comparison : -comparison;
    });
    return list;
  }, [people, sort]);

  return (
    <div className="min-w-0 flex-1 overflow-auto">
      <table className="w-full border-collapse text-sm">
        <thead className="sticky top-0 z-10 bg-sidebar">
          <tr>
            {COLUMNS.map((column) => {
              const active = sort?.key === column.key;
              return (
                <th
                  key={column.key}
                  className={cn(
                    "border-b border-border px-3 py-2 text-left font-medium text-muted-foreground",
                    column.headerClassName,
                  )}
                >
                  <button
                    type="button"
                    onClick={() => toggleSort(column.key)}
                    className="flex items-center gap-1 transition-colors hover:text-foreground"
                  >
                    {column.label}
                    {active ? (
                      sort?.dir === "asc" ? (
                        <ChevronUp className="size-3.5" />
                      ) : (
                        <ChevronDown className="size-3.5" />
                      )
                    ) : null}
                  </button>
                </th>
              );
            })}
            {showMatch ? (
              <th className="w-[20%] border-b border-border px-3 py-2 text-left font-medium text-muted-foreground">
                Match
              </th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {sorted.map((person) => {
            const match = matches[person.id];
            const score = overallReputation(person.reputation);
            return (
              <tr
                key={person.id}
                onClick={() => onOpen(person.id)}
                className="cursor-pointer border-b border-border/60 transition-colors hover:bg-muted/50"
              >
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={person.name} size="sm" />
                    <span className="min-w-0">
                      <span className="block truncate font-medium">
                        {person.name}
                      </span>
                      {match ? (
                        <span className="block truncate text-xs text-muted-foreground">
                          {match.snippet}
                        </span>
                      ) : null}
                    </span>
                  </div>
                </td>
                <td className="truncate px-3 py-2 text-muted-foreground">
                  {person.role}
                </td>
                <td className="truncate px-3 py-2 text-muted-foreground">
                  {person.identity.email || "—"}
                </td>
                <td className="truncate px-3 py-2 text-muted-foreground">
                  {person.identity.location || "—"}
                </td>
                <td className="px-3 py-2">
                  <span className="flex items-center gap-1 font-medium tabular-nums">
                    <Star className="size-3 fill-amber-400 text-amber-400" />
                    {score}
                  </span>
                </td>
                <td className="truncate px-3 py-2 text-muted-foreground">
                  {person.availability}
                </td>
                {showMatch ? (
                  <td className="px-3 py-2">
                    {match ? (
                      <span className="flex flex-wrap gap-1">
                        {match.matchedFields.map((label) => (
                          <span
                            key={label}
                            className="rounded bg-space-accent/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-space-accent"
                          >
                            {label}
                          </span>
                        ))}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                ) : null}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}