"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { cn } from "@/lib/utils";
import { CreateAgent } from "@/components/agents/CreateAgent";
import {
  Card,
  Field,
  SectionHeading,
  TextInput,
  Toggle,
} from "./section-primitives";

/* ------------------------------ Account ------------------------------ */

export function AccountSection() {
  return (
    <div>
      <SectionHeading
        title="Account"
        description="Email, sign-in, and account details."
      />
      <Card className="flex max-w-xl flex-col gap-4">
        <Field label="Email">
          <TextInput type="email" defaultValue="andrea@example.com" />
        </Field>
        <Field label="Display name">
          <TextInput defaultValue="Andrea" />
        </Field>
        <div className="flex justify-end">
          <Button size="sm">Save changes</Button>
        </div>
      </Card>
    </div>
  );
}

/* ------------------------------ Profile ------------------------------ */

export function ProfileSection() {
  return (
    <div>
      <SectionHeading
        title="Profile"
        description="How you appear across your spaces."
      />
      <Card className="flex max-w-xl flex-col gap-4">
        <div className="flex items-center gap-3">
          <Avatar name="Andrea" size="lg" />
          <Button variant="outline" size="sm">
            Change avatar
          </Button>
        </div>
        <Field label="Full name">
          <TextInput defaultValue="Andrea Rossi" />
        </Field>
        <Field label="Role" hint="Shown next to your name in people lists.">
          <TextInput defaultValue="Founder" />
        </Field>
        <Field label="Bio">
          <textarea
            rows={3}
            defaultValue="Building a calmer way to run things."
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </Field>
        <div className="flex justify-end">
          <Button size="sm">Save profile</Button>
        </div>
      </Card>
    </div>
  );
}

/* ------------------------------ Memory ------------------------------ */

const MEMORY_SEED = [
  "Prefers brief updates before 10am",
  "Q3 supplier list confirmed 12 Aug",
  "Weekly standup on Mondays",
];

export function MemorySection() {
  const [entries, setEntries] = useState<string[]>(MEMORY_SEED);

  return (
    <div>
      <SectionHeading
        title="Memory"
        description="Facts and preferences Jamot has learned about you."
      />
      <Card className="max-w-xl">
        <ul className="flex flex-col gap-2">
          {entries.map((entry, index) => (
            <li
              key={entry}
              className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
            >
              <span>{entry}</span>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-muted-foreground"
                aria-label="Forget"
                onClick={() =>
                  setEntries((prev) => prev.filter((_, i) => i !== index))
                }
              >
                <Trash2 className="size-3.5" />
              </Button>
            </li>
          ))}
        </ul>
        {entries.length === 0 ? (
          <p className="py-2 text-sm text-muted-foreground">
            No memories yet.
          </p>
        ) : null}
      </Card>
    </div>
  );
}

/* --------------------------- Privacy & consent --------------------------- */

export function PrivacyConsentSection() {
  const [learning, setLearning] = useState(true);
  const [shareAcrossSpaces, setShareAcrossSpaces] = useState(false);
  const [exportOptIn, setExportOptIn] = useState(false);

  return (
    <div>
      <SectionHeading
        title="Privacy & Consent"
        description="Control what Jamot remembers and where it is used."
      />
      <Card className="max-w-xl">
        <Toggle
          checked={learning}
          onChange={setLearning}
          label="Learn from my activity"
          description="Allow Jamot to form new memories as you work."
        />
        <Toggle
          checked={shareAcrossSpaces}
          onChange={setShareAcrossSpaces}
          label="Share personal memory across spaces"
          description="Make personal memories available to organization spaces."
        />
        <Toggle
          checked={exportOptIn}
          onChange={setExportOptIn}
          label="Allow data export"
          description="Permit scheduled exports of your data."
        />
      </Card>
    </div>
  );
}

/* ------------------------------ Connectors ------------------------------ */

const CONNECTORS = [
  { id: "whatsapp", name: "WhatsApp" },
  { id: "telegram", name: "Telegram" },
  { id: "gcal", name: "Google Calendar" },
  { id: "github", name: "GitHub" },
];

export function ConnectorsSection() {
  const [connected, setConnected] = useState<Record<string, boolean>>({
    whatsapp: true,
  });

  return (
    <div>
      <SectionHeading
        title="Connectors"
        description="Services you have connected to Jamot."
      />
      <Card className="max-w-xl">
        <ul className="flex flex-col gap-2">
          {CONNECTORS.map((connector) => (
            <li
              key={connector.id}
              className="flex items-center justify-between rounded-md border border-border px-3 py-2"
            >
              <span className="flex items-center gap-2 text-sm font-medium">
                <span
                  className={cn(
                    "size-2 rounded-full",
                    connected[connector.id] ? "bg-emerald-500" : "bg-border",
                  )}
                />
                {connector.name}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setConnected((prev) => ({
                    ...prev,
                    [connector.id]: !prev[connector.id],
                  }))
                }
              >
                {connected[connector.id] ? "Disconnect" : "Connect"}
              </Button>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted-foreground">
          Secrets for these services live in the Vault.
        </p>
      </Card>
    </div>
  );
}

/* ------------------------------ Skills ------------------------------ */

const SKILLS_SEED = ["Summarize email", "Book calendar", "Draft replies"];

export function SkillsSection() {
  const [skills, setSkills] = useState<string[]>(SKILLS_SEED);
  const [draft, setDraft] = useState("");

  return (
    <div>
      <SectionHeading
        title="Skills"
        description="Reusable capabilities your agents can use."
      />
      <Card className="max-w-xl">
        <ul className="flex flex-wrap gap-2">
          {skills.map((skill) => (
            <li key={skill}>
              <Badge variant="secondary">{skill}</Badge>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex gap-2">
          <TextInput
            placeholder="New skill…"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
          <Button
            size="sm"
            disabled={!draft.trim()}
            onClick={() => {
              setSkills((prev) => [...prev, draft.trim()]);
              setDraft("");
            }}
          >
            <Plus className="size-4" />
            Add
          </Button>
        </div>
      </Card>
    </div>
  );
}

/* --------------------------- Personal agents --------------------------- */

const PERSONAL_AGENTS = [
  { id: "pa1", name: "Scheduler", status: "idle" },
  { id: "pa2", name: "Inbox triage", status: "busy" },
];

export function PersonalAgentsSection() {
  const [creating, setCreating] = useState(false);

  return (
    <div>
      <SectionHeading
        title="Personal Agents"
        description="Agents that work only for you."
      />
      <Card className="max-w-xl">
        <ul className="flex flex-col gap-2">
          {PERSONAL_AGENTS.map((agent) => (
            <li
              key={agent.id}
              className="flex items-center justify-between rounded-md border border-border px-3 py-2"
            >
              <span className="flex items-center gap-2 text-sm font-medium">
                <span
                  className={cn(
                    "size-2 rounded-full",
                    agent.status === "idle" ? "bg-emerald-500" : "bg-amber-500",
                  )}
                />
                {agent.name}
              </span>
              <Badge variant="secondary">{agent.status}</Badge>
            </li>
          ))}
        </ul>
        <div className="mt-4">
          <Button size="sm" onClick={() => setCreating((value) => !value)}>
            <Plus className="size-4" />
            New agent
          </Button>
        </div>
      </Card>

      {creating ? (
        <div className="mt-4 max-w-xl">
          <CreateAgent onDone={() => setCreating(false)} />
        </div>
      ) : null}
    </div>
  );
}

/* ---------------------------- Notifications ---------------------------- */

export function NotificationsSection() {
  const [email, setEmail] = useState(true);
  const [approvals, setApprovals] = useState(true);
  const [activity, setActivity] = useState(false);

  return (
    <div>
      <SectionHeading
        title="Notifications"
        description="Choose what Jamot tells you about."
      />
      <Card className="max-w-xl">
        <Toggle
          checked={email}
          onChange={setEmail}
          label="Email digests"
          description="A daily summary of what happened."
        />
        <Toggle
          checked={approvals}
          onChange={setApprovals}
          label="Approval requests"
          description="Notify me when an agent needs my sign-off."
        />
        <Toggle
          checked={activity}
          onChange={setActivity}
          label="Activity mentions"
          description="Notify me when I am mentioned."
        />
      </Card>
    </div>
  );
}

/* ------------------------------ Appearance ------------------------------ */

const ACCENTS = [
  { id: "violet", label: "Violet", color: "#7c3aed", foreground: "#ffffff" },
  { id: "warm", label: "Warm", color: "#f59e0b", foreground: "#1c1917" },
  { id: "blue", label: "Blue", color: "#3b82f6", foreground: "#ffffff" },
  { id: "green", label: "Green", color: "#10b981", foreground: "#022c22" },
] as const;

const ACCENT_KEY = "jamot:space-accent";
const ACCENT_FG_KEY = "jamot:space-accent-foreground";

function readStoredAccentId(): string {
  if (typeof window === "undefined") return "violet";
  const saved = window.localStorage.getItem(ACCENT_KEY);
  const match = ACCENTS.find((accent) => accent.color === saved);
  return match ? match.id : "violet";
}

export function AppearanceSection() {
  const [accentId, setAccentId] = useState<string>(readStoredAccentId);

  useEffect(() => {
    const accent = ACCENTS.find((candidate) => candidate.id === accentId);
    if (!accent) return;
    const root = document.documentElement;
    root.style.setProperty("--space-accent", accent.color);
    root.style.setProperty("--space-accent-foreground", accent.foreground);
    window.localStorage.setItem(ACCENT_KEY, accent.color);
    window.localStorage.setItem(ACCENT_FG_KEY, accent.foreground);
  }, [accentId]);

  const applyAccent = (id: string) => {
    setAccentId(id);
  };

  return (
    <div>
      <SectionHeading
        title="Appearance"
        description="Theme and accent color."
      />
      <div className="flex max-w-xl flex-col gap-6">
        <Card>
          <p className="mb-3 text-sm font-medium">Theme</p>
          <ThemeSwitcher />
        </Card>

        <Card>
          <p className="mb-3 text-sm font-medium">Space accent</p>
          <div className="flex flex-wrap gap-3">
            {ACCENTS.map((accent) => (
              <button
                key={accent.id}
                type="button"
                onClick={() => applyAccent(accent.id)}
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
                  accentId === accent.id
                    ? "border-space-accent bg-muted"
                    : "border-border hover:bg-muted",
                )}
              >
                <span
                  className="size-4 rounded-full"
                  style={{ backgroundColor: accent.color }}
                />
                {accent.label}
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ------------------------------ Security ------------------------------ */

export function SecuritySection() {
  const [twoFactor, setTwoFactor] = useState(true);
  const [sessionLock, setSessionLock] = useState(false);

  return (
    <div>
      <SectionHeading
        title="Security"
        description="Authentication and session settings."
      />
      <div className="flex max-w-xl flex-col gap-4">
        <Card>
          <Toggle
            checked={twoFactor}
            onChange={setTwoFactor}
            label="Two-factor authentication"
            description="Require a second factor at sign-in."
          />
          <Toggle
            checked={sessionLock}
            onChange={setSessionLock}
            label="Lock sessions after inactivity"
            description="Sign out after 30 minutes of inactivity."
          />
        </Card>
        <Card>
          <p className="text-sm font-medium">Password</p>
          <p className="mb-3 text-xs text-muted-foreground">
            Change your account password.
          </p>
          <div className="flex flex-col gap-3">
            <Field label="New password">
              <TextInput type="password" placeholder="••••••••" />
            </Field>
            <div className="flex justify-end">
              <Button size="sm">Update password</Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
