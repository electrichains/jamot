"use client";

import { AtSign, Paperclip, Plus } from "lucide-react";

import { CopilotChat } from "@copilotkit/react-core/v2";
import "@copilotkit/react-core/v2/styles.css";

function Hint() {
  return (
    <div className="flex shrink-0 items-center justify-center gap-2 px-6 py-2 text-xs text-muted-foreground">
      <span className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1">
        <Plus className="size-3" />
        <Paperclip className="size-3" />
        Attach
      </span>
      <span className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1">
        <AtSign className="size-3" />
        Person
      </span>
      <span className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1">
        <AtSign className="size-3" />
        Agent
      </span>
    </div>
  );
}

export function ChatWorkspace() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-hidden">
        <CopilotChat
          className="h-full"
          welcomeScreen={false}
          labels={{ chatInputPlaceholder: "Message Jamot…" }}
        />
      </div>
      <Hint />
    </div>
  );
}
