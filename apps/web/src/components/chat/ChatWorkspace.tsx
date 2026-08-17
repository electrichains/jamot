"use client";

import { useMemo } from "react";
import { AtSign, Paperclip, Plus } from "lucide-react";

import { CopilotChat, useAgentContext } from "@copilotkit/react-core/v2";
import "@copilotkit/react-core/v2/styles.css";
import { CommerceToolBridge } from "@/components/commerce/use-commerce-tools";
import { useAppShell } from "@/components/app-shell/app-shell-context";

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
  const { space } = useAppShell();
  const orgContext = useMemo(
    () => ({
      spaceId: space.spaceId ?? null,
      organizationId: space.organizationId ?? null,
      workspaceId: space.workspaceId ?? null,
      spaceName: space.name,
      kind: space.kind ?? "personal",
    }),
    [space.spaceId, space.organizationId, space.workspaceId, space.name, space.kind],
  );
  useAgentContext({
    description: "active Jamot workspace/organization the user is operating in",
    value: orgContext,
  });

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <CommerceToolBridge />
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
