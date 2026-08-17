"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AppWindow,
  ArrowLeft,
  Building2,
  ChevronDown,
  ChevronRight,
  ShieldAlert,
  Sparkles,
  Loader2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/settings/section-primitives";
import { OrgAppsList } from "@/components/settings/org-apps-list";
import { BrandLogo } from "@/components/brand-logo";
import { useAuth } from "@/components/auth/auth-context";
import { useAppShell } from "@/components/app-shell/app-shell-context";
import {
  createOrganization,
  getOrganizationMembers,
  getOrganizations,
  type OrganizationListItem,
  type OrgRole,
} from "@/lib/api-client";

const ROLE_VARIANT: Record<
  NonNullable<OrgRole>,
  "default" | "secondary" | "outline" | "accent"
> = {
  owner: "default",
  admin: "accent",
  member: "secondary",
  agent: "outline",
  external: "outline",
};

function MemberCountCell({
  organizationId,
}: {
  organizationId: string;
}) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    getOrganizationMembers(organizationId)
      .then((members) => {
        if (!cancelled) setCount(members.length);
      })
      .catch(() => {
        if (!cancelled) setCount(null);
      });
    return () => {
      cancelled = true;
    };
  }, [organizationId]);

  return (
    <span className="text-sm tabular-nums text-muted-foreground">
      {count === null ? "…" : count}
    </span>
  );
}

export default function AdminPage() {
  const { user } = useAuth();
  const { setSpace } = useAppShell();
  const router = useRouter();

  const [items, setItems] = useState<OrganizationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [dream, setDream] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const reload = async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await getOrganizations());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load organizations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    getOrganizations()
      .then((items) => {
        if (!cancelled) setItems(items);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load organizations");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const createOrg = async () => {
    const trimmed = name.trim();
    if (!trimmed || creating) return;
    setCreateError(null);
    setCreating(true);
    try {
      await createOrganization({ name: trimmed, dream: dream.trim() || undefined });
      setName("");
      setDream("");
      await reload();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Could not create organization");
    } finally {
      setCreating(false);
    }
  };

  const openOrg = (org: OrganizationListItem) => {
    setSpace(org.organization.id);
    router.push("/");
  };

  if (!user?.isSuperAdmin) {
    return (
      <div className="flex h-dvh w-full items-center justify-center bg-background p-6 text-foreground">
        <Card className="flex max-w-md flex-col items-center gap-3 text-center">
          <ShieldAlert className="size-8 text-muted-foreground" />
          <h1 className="font-display text-lg font-semibold">Access denied</h1>
          <p className="text-sm text-muted-foreground">
            Only super admins can view this console.
          </p>
          <Button onClick={() => router.push("/")}>Back to home</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden bg-background text-foreground">
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-border px-3">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          <BrandLogo className="size-5" />
        </Link>
        <span className="font-display text-sm font-semibold">Admin</span>
      </header>

      <div className="flex min-h-0 flex-1 justify-center overflow-y-auto px-8 py-6">
        <div className="w-full max-w-3xl">
          <div className="mb-6 flex items-center gap-3">
            <Sparkles className="size-6 text-space-accent" />
            <div>
              <h1 className="font-display text-lg font-semibold tracking-tight">
                Super Admin Console
              </h1>
              <p className="text-sm text-muted-foreground">
                Manage every organization on the platform.
              </p>
            </div>
          </div>

          <Card className="mb-6 flex max-w-3xl flex-wrap items-end gap-3">
            <div className="min-w-0 flex-1">
              <label className="mb-1.5 block text-sm font-medium">Name</label>
              <Input
                placeholder="New organization name"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </div>
            <div className="min-w-0 flex-[2]">
              <label className="mb-1.5 block text-sm font-medium">Dream</label>
              <Input
                placeholder="Optional long-term vision"
                value={dream}
                onChange={(event) => setDream(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") void createOrg();
                }}
              />
            </div>
            <Button onClick={() => void createOrg()} disabled={creating}>
              {creating ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Building2 className="size-4" />
              )}
              Create organization
            </Button>
          </Card>

          {createError ? (
            <p className="mb-3 text-sm text-red-600">{createError}</p>
          ) : null}
          {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}

          {loading ? (
            <p className="text-sm text-muted-foreground">Loading organizations…</p>
          ) : items.length === 0 ? (
            <Card className="max-w-3xl">
              <p className="text-sm text-muted-foreground">No organizations yet.</p>
            </Card>
          ) : (
            <div className="flex max-w-3xl flex-col gap-2">
              {items.map((item) => {
                const expanded = expandedId === item.organization.id;
                return (
                  <Card key={item.organization.id} className="flex flex-col gap-3 p-0">
                    <div className="flex flex-wrap items-center gap-3 p-4">
                      <button
                        type="button"
                        aria-expanded={expanded}
                        onClick={() =>
                          setExpandedId(expanded ? null : item.organization.id)
                        }
                        className="flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {expanded ? (
                          <ChevronDown className="size-4" />
                        ) : (
                          <ChevronRight className="size-4" />
                        )}
                      </button>

                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate font-medium">{item.space.name}</span>
                        <span className="truncate text-xs text-muted-foreground">
                          {item.organization.dream || "No dream set"}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{item.organization.enabledAppIds.length} apps</span>
                        <span>
                          <MemberCountCell organizationId={item.organization.id} />{" "}
                          members
                        </span>
                        {item.role ? (
                          <Badge variant={ROLE_VARIANT[item.role]}>{item.role}</Badge>
                        ) : (
                          <Badge variant="outline">none</Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setExpandedId(expanded ? null : item.organization.id)
                          }
                        >
                          <AppWindow className="size-3.5" />
                          Apps
                        </Button>
                        <Button size="sm" onClick={() => openOrg(item)}>
                          Open
                        </Button>
                      </div>
                    </div>

                    {expanded ? (
                      <div className="border-t border-border px-4 py-4">
                        <OrgAppsList organizationId={item.organization.id} canEdit />
                      </div>
                    ) : null}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}