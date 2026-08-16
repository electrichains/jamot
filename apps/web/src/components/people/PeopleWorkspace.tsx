"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Users } from "lucide-react";

import { PersonList } from "./PersonList";
import { PersonProfile } from "./PersonProfile";
import { PEOPLE } from "./people-data";

export function PeopleWorkspace() {
  const [selectedId, setSelectedId] = useState<string | null>(
    PEOPLE[0]?.id ?? null,
  );
  const selected =
    PEOPLE.find((person) => person.id === selectedId) ?? null;

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col lg:flex-row">
      <PersonList
        people={PEOPLE}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />

      <section className="min-w-0 flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {selected ? (
            <motion.div
              key={selected.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
            >
              <PersonProfile person={selected} />
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center"
            >
              <Users className="size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Select a person to see their profile.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
}