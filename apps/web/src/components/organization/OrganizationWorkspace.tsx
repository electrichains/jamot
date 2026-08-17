"use client";

import { useEffect, useState } from "react";
import { Loader2, Network } from "lucide-react";

import { EmptyList } from "@/components/directory/EmptyList";
import { OrgChart } from "@/components/org-chart/OrgChart";
import { useAppShell } from "@/components/app-shell/app-shell-context";
import { getAgents, getOrganizationMembers, type OrganizationListItem } from "@/lib/api-client";
import { buildOrgNodes } from "@/lib/live-directory";
import type { OrgNode } from "@/components/org-chart/org-data";

export function OrganizationWorkspace() {
  const { space, organizations } = useAppShell();
  const orgId = space.kind === "organization" ? space.organizationId : undefined;

  if (!orgId) {
    return (
      <div className="h-full w-full">
        <EmptyList
          icon={Network}
          title="No organization structure here"
          description="This is your personal space. Switch to one of your organizations to view its chart."
        />
      </div>
    );
  }

  return (
    <OrgWorkspaceBody
      key={space.id}
      orgId={orgId}
      spaceName={space.name}
      organizations={organizations}
    />
  );
}

function OrgWorkspaceBody({
  orgId,
  spaceName,
  organizations,
}: {
  orgId: string;
  spaceName: string;
  organizations: OrganizationListItem[];
}) {
  const [nodes, setNodes] = useState<OrgNode[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const summary = organizations.find((item) => item.organization.id === orgId);
    Promise.all([getOrganizationMembers(orgId), getAgents()])
      .then(([members, agents]) => {
        if (cancelled) return;
        setNodes(
          buildOrgNodes({
            organizationId: orgId,
            spaceName,
            dream: summary?.organization.dream ?? "",
            members,
            agents,
          }),
        );
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Could not load organization");
      });
    return () => {
      cancelled = true;
    };
  }, [orgId, spaceName, organizations]);

  if (error) {
    return (
      <div className="h-full w-full">
        <EmptyList icon={Network} title="Unable to load" description={error} />
      </div>
    );
  }

  if (nodes === null) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <EmptyList
          icon={Loader2}
          title="Loading organization…"
          description="Building the chart from live members and agents."
        />
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <OrgChart nodes={nodes} />
    </div>
  );
}