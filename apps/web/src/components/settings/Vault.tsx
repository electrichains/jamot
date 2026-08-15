"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, Field, SectionHeading, TextInput } from "./section-primitives";

type Category = "AI Provider" | "Connector" | "MCP" | "Harness";

const CATEGORIES: Category[] = ["AI Provider", "Connector", "MCP", "Harness"];

interface Connection {
  id: string;
  category: Category;
  name: string;
  connected: boolean;
}

const SEED: Connection[] = [
  { id: "openai", category: "AI Provider", name: "OpenAI", connected: true },
  { id: "anthropic", category: "AI Provider", name: "Anthropic", connected: true },
  { id: "google", category: "AI Provider", name: "Google", connected: false },
  { id: "whatsapp", category: "Connector", name: "WhatsApp", connected: true },
  { id: "telegram", category: "Connector", name: "Telegram", connected: false },
  { id: "gcal", category: "Connector", name: "Google Calendar", connected: true },
  { id: "github", category: "Connector", name: "GitHub", connected: true },
  { id: "mcp-1", category: "MCP", name: "Filesystem MCP", connected: false },
  { id: "harness-1", category: "Harness", name: "Personal harness", connected: true },
];

type Step = "idle" | "category" | "form";

export function Vault() {
  const [connections, setConnections] = useState<Connection[]>(SEED);
  const [step, setStep] = useState<Step>("idle");
  const [category, setCategory] = useState<Category>("AI Provider");
  const [name, setName] = useState("");
  const [secret, setSecret] = useState("");

  const reset = () => {
    setStep("idle");
    setCategory("AI Provider");
    setName("");
    setSecret("");
  };

  const save = () => {
    if (!name.trim() || !secret.trim()) return;
    setConnections((prev) => [
      ...prev,
      {
        id: `${category}-${name}-${Date.now()}`,
        category,
        name: name.trim(),
        connected: true,
      },
    ]);
    // The secret is intentionally discarded and never re-displayed.
    reset();
  };

  return (
    <div>
      <SectionHeading
        title="Vault"
        description="One vault for every secret Jamot uses on your behalf."
      />

      <div className="mb-4">
        {step === "idle" ? (
          <Button size="sm" onClick={() => setStep("category")}>
            <Plus className="size-4" />
            Add connection
          </Button>
        ) : null}

        {step === "category" ? (
          <Card className="max-w-xl">
            <p className="mb-3 text-sm font-medium">What kind of connection?</p>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((candidate) => (
                <button
                  key={candidate}
                  type="button"
                  onClick={() => {
                    setCategory(candidate);
                    setStep("form");
                  }}
                  className={cn(
                    "rounded-lg border border-border px-3 py-2 text-sm transition-colors hover:bg-muted",
                    category === candidate && "border-space-accent bg-muted",
                  )}
                >
                  {candidate}
                </button>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <Button variant="ghost" size="sm" onClick={reset}>
                Cancel
              </Button>
            </div>
          </Card>
        ) : null}

        {step === "form" ? (
          <Card className="max-w-xl">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-medium">Add {category} connection</p>
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                aria-label="Close"
                onClick={reset}
              >
                <X className="size-4" />
              </Button>
            </div>
            <div className="flex flex-col gap-4">
              <Field label="Name">
                <TextInput
                  autoFocus
                  placeholder="e.g. OpenAI, WhatsApp…"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </Field>
              <Field
                label="Secret"
                hint="Stored once and never shown again."
              >
                <TextInput
                  type="password"
                  placeholder="API key or secret"
                  value={secret}
                  onChange={(event) => setSecret(event.target.value)}
                />
              </Field>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={reset}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  disabled={!name.trim() || !secret.trim()}
                  onClick={save}
                >
                  Save
                </Button>
              </div>
            </div>
          </Card>
        ) : null}
      </div>

      <div className="flex flex-col gap-6">
        {CATEGORIES.map((group) => {
          const items = connections.filter((c) => c.category === group);
          return (
            <Card key={group} className="max-w-xl">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {group}
              </p>
              <ul className="flex flex-col gap-1">
                {items.length === 0 ? (
                  <li className="py-1 text-sm text-muted-foreground">
                    No connections yet.
                  </li>
                ) : (
                  items.map((connection) => (
                    <li
                      key={connection.id}
                      className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm"
                    >
                      <span
                        className={cn(
                          "size-2 rounded-full",
                          connection.connected ? "bg-emerald-500" : "bg-border",
                        )}
                      />
                      <span className="flex-1 font-medium">{connection.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {connection.connected ? "Connected" : "Not connected"}
                      </span>
                    </li>
                  ))
                )}
              </ul>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
