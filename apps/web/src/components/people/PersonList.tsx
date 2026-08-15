import { Star } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import { overallReputation, type PersonProfile } from "./people-data";

export function PersonList({
  people,
  selectedId,
  onSelect,
}: {
  people: PersonProfile[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-border bg-sidebar lg:w-80 lg:border-b-0 lg:border-r">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Directory
        </span>
        <span className="text-xs text-muted-foreground">
          {people.length} people
        </span>
      </div>
      <ul className="grid min-h-0 grid-cols-1 gap-2 overflow-y-auto p-3 sm:grid-cols-2 lg:flex-1 lg:grid-cols-1">
        {people.map((person) => {
          const selected = person.id === selectedId;
          const score = overallReputation(person.reputation);
          return (
            <li key={person.id}>
              <button
                type="button"
                onClick={() => onSelect(person.id)}
                aria-pressed={selected}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors",
                  selected
                    ? "border-space-accent bg-muted"
                    : "border-border bg-card hover:bg-muted",
                )}
              >
                <Avatar name={person.name} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium">
                      {person.name}
                    </span>
                    <span className="flex shrink-0 items-center gap-1 text-xs font-medium tabular-nums text-muted-foreground">
                      <Star className="size-3 fill-amber-400 text-amber-400" />
                      {score}
                    </span>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {person.role}
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1">
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
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
