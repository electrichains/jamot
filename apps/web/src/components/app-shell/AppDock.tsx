"use client";

import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AgentsWorkspace } from "@/components/agents/AgentsWorkspace";
import { PeopleWorkspace } from "@/components/people/PeopleWorkspace";
import { OrganizationWorkspace } from "@/components/organization/OrganizationWorkspace";
import { TasksBoard } from "@/components/tasks/TasksBoard";
import { CanvasWorkspace } from "@/components/canvas/CanvasWorkspace";
import { WhatsAppApp } from "@/components/whatsapp/WhatsAppApp";
import { FinanceWorkspace } from "@/components/finance/FinanceWorkspace";
import { SuppliersWorkspace } from "@/components/suppliers/SuppliersWorkspace";
import { LeadsWorkspace } from "@/components/leads/LeadsWorkspace";
import { OutreachWorkspace } from "@/components/outreach/OutreachWorkspace";

import { SECTION_TITLES, useAppShell, type SectionId } from "./app-shell-context";
import type { AppManifest } from "@/lib/api-client";

const PLACEHOLDER_SECTIONS: SectionId[] = ["calendar", "crm"];

function PlaceholderSection({ title }: { title: string }) {
  return (
    <div className="flex flex-1 items-center justify-center p-6 text-center text-xs text-muted-foreground">
      {title} will appear here in a later phase.
    </div>
  );
}

function AppPanelBody({ app }: { app: AppManifest }) {
  return (
    <div className="flex flex-col gap-4 p-4">
      <p className="text-sm text-muted-foreground">{app.description}</p>
      {app.capabilities.length > 0 ? (
        <div>
          <h4 className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Capabilities
          </h4>
          <div className="flex flex-wrap gap-1">
            {app.capabilities.map((capability) => (
              <span
                key={capability}
                className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
              >
                {capability}
              </span>
            ))}
          </div>
        </div>
      ) : null}
      <div className="text-xs text-muted-foreground">Version {app.version}</div>
    </div>
  );
}

export function AppDock() {
  const {
    activeSection,
    activeAppId,
    availableApps,
    setActiveSection,
    closeApp,
  } = useAppShell();

  if (!activeSection && !activeAppId) {
    return null;
  }

  if (activeAppId) {
    const app = availableApps.find((candidate) => candidate.id === activeAppId);
    return (
      <aside className="flex h-full flex-col bg-sidebar/80 text-sidebar-foreground backdrop-blur-md">
        <header className="flex h-11 shrink-0 items-center justify-between border-b border-border/40 px-3">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {app?.name ?? "App"}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 rounded-lg text-muted-foreground hover:text-foreground"
            aria-label="Close app"
            onClick={closeApp}
          >
            <X className="size-3.5" />
          </Button>
        </header>
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          {app ? (
            <AppPanelBody app={app} />
          ) : (
            <p className="p-4 text-xs text-muted-foreground">App not found.</p>
          )}
        </div>
      </aside>
    );
  }

  if (!activeSection) {
    return null;
  }

  let content;
  switch (activeSection) {
    case "tasks":
      content = <TasksBoard />;
      break;
    case "people":
      content = <PeopleWorkspace />;
      break;
    case "agents":
      content = <AgentsWorkspace />;
      break;
    case "organization":
      content = <OrganizationWorkspace />;
      break;
    case "dashboard":
      content = <CanvasWorkspace />;
      break;
    case "whatsapp":
      content = <WhatsAppApp compact />;
      break;
    case "suppliers":
      content = <SuppliersWorkspace />;
      break;
    case "leads":
      content = <LeadsWorkspace />;
      break;
    case "outreach":
      content = <OutreachWorkspace />;
      break;
    case "finance":
      content = <FinanceWorkspace />;
      break;
    default:
      content = PLACEHOLDER_SECTIONS.includes(activeSection) ? (
        <PlaceholderSection title={SECTION_TITLES[activeSection]} />
      ) : null;
  }

  return (
    <aside className="flex h-full flex-col bg-sidebar/80 backdrop-blur-md text-sidebar-foreground">
      <header className="flex h-11 shrink-0 items-center justify-between border-b border-border/40 px-3">
        <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {SECTION_TITLES[activeSection]}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 rounded-lg text-muted-foreground hover:text-foreground"
          aria-label="Close section"
          onClick={() => setActiveSection(null)}
        >
          <X className="size-3.5" />
        </Button>
      </header>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">{content}</div>
    </aside>
  );
}
