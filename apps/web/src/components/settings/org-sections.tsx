"use client";

import { useEffect, useState } from "react";
import { Loader2, Layers, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SectionHeading, Card } from "./section-primitives";
import { ChannelsSection } from "./channels-section";
import { WorkspacesSection } from "./workspaces-section";
import {
  CapabilitiesSection as CapabilitiesDataSection,
  KnowledgeSection as KnowledgeDataSection,
  OrgMemorySection as OrgMemoryDataSection,
  SharedSkillsSection as SharedSkillsDataSection,
} from "./org-data-sections";
import { useActiveOrg } from "./use-active-org";
import { getOrganizations, listWorkspaces, updateWorkspace } from "@/lib/api-client";

function OrgStub({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <SectionHeading title={title} description={description} />
      <Card className="max-w-xl">
        <p className="text-sm text-muted-foreground">
          This section is a placeholder and will be fleshed out in a later phase.
        </p>
      </Card>
    </div>
  );
}

export function GeneralOrgSection() {
  return <WorkspacesSection />;
}

export { PeopleOrgSection } from "./people-org-section";
export { AppsOrgSection } from "./apps-org-section";

export function RolesOrgSection() {
  return <OrgStub title="Roles" description="Define roles and permissions." />;
}

export function OrganicChartSection() {
  return (
    <OrgStub
      title="OrganicChart"
      description="The living org chart of your organization."
    />
  );
}

export function OrgAgentsSection() {
  return <OrgStub title="Agents" description="Shared organization agents." />;
}

export function ChannelsOrgSection() {
  return <ChannelsSection />;
}

export function SharedSkillsSection() {
  return <SharedSkillsDataSection />;
}
export function PoliciesSection() {
  return <OrgStub title="Policies" description="Policies that govern agent behavior." />;
}

export function TreasurySection() {
  return <OrgStub title="Treasury" description="Budgets and financial controls." />;
}

export function DreamSection() {
  return <OrgStub title="Dream" description="Long-term goals and vision." />;
}

export function OrgMemorySection() {
  return <OrgMemoryDataSection />;
}

export function CapabilitiesOrgSection() {
  return <CapabilitiesDataSection />;
}

export function KnowledgeOrgSection() {
  return <KnowledgeDataSection />;
}

export function AuditSection() {
  return <OrgStub title="Audit" description="Audit logs and compliance." />;
}

/** Workspace-level settings: rename the current workspace and edit its config.
 * Org admins can edit; members see a read-only view. */
export function WorkspaceSettingsSection() {
  const { space, isOrg, organizationId, isAdmin } = useActiveOrg();
  const workspaceId = space.workspaceId ?? null;

  const [orgId, setOrgId] = useState<string>("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [configText, setConfigText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!isOrg || !organizationId) return;
    let cancelled = false;
    void (async () => {
      try {
        setOrgId(organizationId);
        const orgs = await getOrganizations();
        const item = orgs.find((o) => o.organization.id === organizationId);
        const ws = item?.workspaces?.length
          ? item.workspaces
          : await listWorkspaces(organizationId);
        const current = ws.find((w) => w.id === workspaceId) ?? ws[0];
        if (!cancelled) {
          setWorkspaceName(current?.name ?? space.name);
          setConfigText(
            current?.config ? JSON.stringify(current.config, null, 2) : "{}",
          );
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setError("Could not load workspace settings.");
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOrg, organizationId, workspaceId, space.name]);

  if (!isOrg || !organizationId || !workspaceId) {
    return (
      <div>
        <SectionHeading
          title="Workspace"
          description="Per-workspace settings and configuration."
        />
        <Card className="max-w-xl">
          <div className="flex items-center gap-3">
            <Layers className="size-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Open an organization workspace to manage its settings.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  const save = async () => {
    if (!orgId || !workspaceId || saving) return;
    setSaving(true);
    setSaved(false);
    setError(null);
    let config: Record<string, unknown> | undefined;
    try {
      config = configText.trim() ? JSON.parse(configText) : {};
    } catch {
      setError("Config must be valid JSON.");
      setSaving(false);
      return;
    }
    try {
      await updateWorkspace(orgId, workspaceId, {
        name: workspaceName.trim() || undefined,
        config,
      });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save workspace settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <SectionHeading
        title="Workspace"
        description="Each workspace is an isolated tenant with its own configuration and data."
      />
      <Card className="flex max-w-xl flex-col gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium">Workspace name</label>
          <Input
            value={workspaceName}
            disabled={!isAdmin || loading}
            onChange={(e) => {
              setWorkspaceName(e.target.value);
              setSaved(false);
            }}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">Configuration (JSON)</label>
          <textarea
            rows={8}
            value={configText}
            disabled={!isAdmin || loading}
            onChange={(e) => {
              setConfigText(e.target.value);
              setSaved(false);
            }}
            className="w-full rounded-lg border border-border bg-card px-3 py-2 font-mono text-xs shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {saved ? <p className="text-sm text-emerald-600">Workspace settings saved.</p> : null}

        <div className="flex justify-end">
          {isAdmin ? (
            <Button onClick={() => void save()} disabled={saving || loading}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Pencil className="size-4" />}
              Save
            </Button>
          ) : (
            <p className="text-xs text-muted-foreground">
              Only admins can edit workspace settings.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}

