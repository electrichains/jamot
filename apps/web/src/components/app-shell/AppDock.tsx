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

import { SECTION_TITLES, useAppShell, type SectionId } from "./app-shell-context";
import { ContextDock } from "./ContextDock";

export interface AppDockProps {
  onCollapse?: () => void;
}

const PLACEHOLDER_SECTIONS: SectionId[] = ["calendar", "inventory", "crm"];

function PlaceholderSection({ title }: { title: string }) {
  return (
    <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-muted-foreground">
      {title} will appear here in a later phase.
    </div>
  );
}

export function AppDock({ onCollapse }: AppDockProps) {
  const { activeSection, setActiveSection } = useAppShell();

  if (!activeSection) {
    return <ContextDock onCollapse={onCollapse} />;
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
    case "finance":
      content = <FinanceWorkspace />;
      break;
    default:
      content = PLACEHOLDER_SECTIONS.includes(activeSection) ? (
        <PlaceholderSection title={SECTION_TITLES[activeSection]} />
      ) : null;
  }

  return (
    <aside className="flex h-full flex-col border-l border-border bg-sidebar text-sidebar-foreground">
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-border px-2">
        <span className="text-sm font-medium">{SECTION_TITLES[activeSection]}</span>
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          aria-label="Close section"
          onClick={() => setActiveSection(null)}
        >
          <X className="size-4" />
        </Button>
      </header>
      <div className="flex min-h-0 flex-1 flex-col">{content}</div>
    </aside>
  );
}