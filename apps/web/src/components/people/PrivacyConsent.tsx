"use client";

import { useState } from "react";
import { Download, Pencil, ShieldCheck, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { PersonProfile } from "./people-data";

type Visibility = "private" | "org" | "public";

const VISIBILITY_OPTIONS: { value: Visibility; label: string }[] = [
  { value: "private", label: "Private" },
  { value: "org", label: "Org" },
  { value: "public", label: "Public" },
];

function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <div className="flex flex-col">
        <span className="text-sm font-medium">{label}</span>
        {description ? (
          <span className="text-xs text-muted-foreground">{description}</span>
        ) : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-5 w-9 shrink-0 rounded-full transition-colors",
          checked ? "bg-space-accent" : "bg-muted",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-4 rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-[18px]" : "translate-x-0.5",
          )}
        />
      </button>
    </div>
  );
}

export function PrivacyConsent({ person }: { person: PersonProfile }) {
  const [visibility, setVisibility] = useState<Visibility>("org");
  const [allowInference, setAllowInference] = useState(true);
  const [exportEnabled, setExportEnabled] = useState(true);

  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <header className="mb-3 flex items-center gap-2">
        <ShieldCheck className="size-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">Privacy & Consent</h3>
      </header>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">
            Profile visibility
          </span>
          <div className="inline-flex w-fit rounded-lg border border-border p-0.5">
            {VISIBILITY_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setVisibility(option.value)}
                className={cn(
                  "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                  visibility === option.value
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Controls who can see {person.name}&apos;s profile and derived
            attributes.
          </p>
        </div>

        <div className="border-t border-border">
          <Toggle
            checked={allowInference}
            onChange={setAllowInference}
            label="Allow AI inference"
            description="Let Jamot derive new attributes and mark them as inferred."
          />
          <Toggle
            checked={exportEnabled}
            onChange={setExportEnabled}
            label="Enable data export"
            description={`Permit ${person.name} to export their own data.`}
          />
        </div>

        <div className="flex flex-wrap gap-2 border-t border-border pt-3">
          <Button type="button" size="sm" variant="outline">
            <Pencil className="size-4" />
            Edit data
          </Button>
          <Button type="button" size="sm" variant="outline" disabled={!exportEnabled}>
            <Download className="size-4" />
            Export data
          </Button>
          <Button type="button" size="sm" variant="destructive">
            <Trash2 className="size-4" />
            Delete
          </Button>
        </div>
      </div>
    </section>
  );
}
