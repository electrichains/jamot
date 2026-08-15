"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Users } from "lucide-react";

import { PersonList } from "@/components/people/PersonList";
import { PersonProfile } from "@/components/people/PersonProfile";
import { PEOPLE } from "@/components/people/people-data";

export default function PeoplePage() {
  const [selectedId, setSelectedId] = useState<string | null>(
    PEOPLE[0]?.id ?? null,
  );
  const selected =
    PEOPLE.find((person) => person.id === selectedId) ?? null;

  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden bg-background text-foreground">
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-border px-3">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Jamot
        </Link>
        <span className="font-display text-sm font-semibold">People</span>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
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
    </div>
  );
}
