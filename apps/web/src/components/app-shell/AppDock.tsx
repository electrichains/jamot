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

const PLACEHOLDER_SECTIONS: SectionId[] = ["calendar", "crm"];

function PlaceholderSection({ title }: { title: string }) {
  return (
    <div className="flex flex-1 items-center justify-center p-6 text-center text-xs text-muted-foreground">
      {title} will appear here in a later phase.
    </div>
  );
}

export function AppDock() {
  const { activeSection, setActiveSection } = useAppShell();

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
    case "canvas":
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
