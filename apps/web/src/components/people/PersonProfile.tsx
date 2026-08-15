"use client";

import type { ReactNode } from "react";
import {
  Brain,
  Briefcase,
  CheckCircle2,
  Clock,
  MemoryStick,
  Quote,
  SlidersHorizontal,
  Sparkles,
  Target,
  TrendingUp,
  UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

import {
  overallReputation,
  type Attribute,
  type PersonProfile,
} from "./people-data";
import { PrivacyConsent } from "./PrivacyConsent";
import { ProvenanceBadge } from "./ProvenanceBadge";

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon?: LucideIcon;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2.5">
      <h3 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {Icon ? <Icon className="size-3.5" /> : null}
        {title}
      </h3>
      {children}
    </section>
  );
}

function AttributeList({ attrs }: { attrs: Record<string, Attribute> }) {
  return (
    <dl className="flex flex-col gap-3">
      {Object.entries(attrs).map(([label, attribute]) => (
        <div key={label} className="flex flex-col gap-1">
          <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
          <dd className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-foreground">{attribute.value}</span>
            <ProvenanceBadge
              source={attribute.source}
              confidence={attribute.confidence}
            />
          </dd>
        </div>
      ))}
    </dl>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-col gap-1.5">
      {items.map((item) => (
        <li key={item} className="flex items-center gap-2 text-sm">
          <CheckCircle2 className="size-4 shrink-0 text-muted-foreground" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function ReputationList({ reputation }: { reputation: Record<string, number> }) {
  return (
    <ul className="flex flex-col gap-2.5">
      {Object.entries(reputation).map(([dimension, score]) => (
        <li key={dimension} className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-sm">
            <span className="capitalize">{dimension}</span>
            <span className="tabular-nums text-xs text-muted-foreground">
              {Math.round(score * 100)}%
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-space-accent"
              style={{ width: `${Math.round(score * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function PersonProfile({ person }: { person: PersonProfile }) {
  const score = overallReputation(person.reputation);

  const identity = [
    { label: "Email", value: person.identity.email },
    { label: "Department", value: person.identity.department },
    { label: "Location", value: person.identity.location },
    { label: "Timezone", value: person.identity.timezone },
    ...(person.identity.reportsTo
      ? [{ label: "Reports to", value: person.identity.reportsTo }]
      : []),
  ];

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-6">
      <header className="flex items-start gap-4 border-b border-border pb-5">
        <Avatar name={person.name} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-xl font-semibold tracking-tight">
              {person.name}
            </h2>
            <Badge variant="accent">{person.role}</Badge>
          </div>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Clock className="size-4" />
            {person.availability}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="font-display text-2xl font-semibold tabular-nums">
            {score}
          </span>
          <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Reputation
          </span>
        </div>
      </header>

      <Section title="Identity" icon={UserRound}>
        <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
          {identity.map((entry) => (
            <div key={entry.label} className="flex flex-col gap-0.5">
              <dt className="text-xs font-medium text-muted-foreground">
                {entry.label}
              </dt>
              <dd className="text-sm">{entry.value}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section title="Self-described profile" icon={Quote}>
        <AttributeList attrs={person.selfDescribed} />
      </Section>

      <Section title="Integral Profile" icon={Brain}>
        <p className="text-xs text-muted-foreground">
          An integrated read on this person, assembled from multiple signals.
          Every attribute carries its source and confidence so inferences never
          silently become facts.
        </p>
        <AttributeList attrs={person.integral} />
      </Section>

      <Section title="Skills" icon={Sparkles}>
        <div className="flex flex-wrap gap-1.5">
          {person.skills.map((skill) => (
            <Badge key={skill} variant="secondary">
              {skill}
            </Badge>
          ))}
        </div>
      </Section>

      <Section title="Experience" icon={Briefcase}>
        <List items={person.experience} />
      </Section>

      <Section title="Preferences" icon={SlidersHorizontal}>
        <AttributeList attrs={person.preferences} />
      </Section>

      <Section title="Goals" icon={Target}>
        <List items={person.goals} />
      </Section>

      <Section title="Contributions" icon={CheckCircle2}>
        <List items={person.contributions} />
      </Section>

      <Section title="Reputation" icon={TrendingUp}>
        <ReputationList reputation={person.reputation} />
      </Section>

      <Section title="Memory" icon={MemoryStick}>
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">
              {person.memory.interactions}
            </span>{" "}
            interactions on record
          </p>
          <ul className="flex flex-col gap-1.5">
            {person.memory.notes.map((note) => (
              <li
                key={note}
                className="rounded-md border border-border px-3 py-2 text-sm"
              >
                {note}
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <div className="border-t border-border pt-4">
        <PrivacyConsent person={person} />
      </div>
    </div>
  );
}
