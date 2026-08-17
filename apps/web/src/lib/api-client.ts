import { API_URL } from "@/components/auth/auth-context";

export type OrgRole = "owner" | "admin" | "member" | "agent" | "external" | null;

export type MemberRole = "owner" | "admin" | "member";

export interface Organization {
  id: string;
  createdAt: string;
  updatedAt: string;
  spaceId: string;
  dream: string;
  blueprint: Record<string, unknown>;
  enabledAppIds: string[];
  treasuryId: string | null;
  reputation: Record<string, number>;
}

export interface Space {
  id: string;
  kind: "personal" | "organization";
  ownerActorId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationListItem {
  organization: Organization;
  space: Space;
  role: OrgRole;
}

export interface OrganizationMember {
  personId: string;
  actorId: string;
  email: string | null;
  displayName: string;
  kind: MemberRole;
  title: string | null;
  membershipSince: string;
}

export interface AppManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  entities: string[];
  capabilities: string[];
  tools: string[];
  events: string[];
  hooks: string[];
  settings: Record<string, unknown>;
  canvas: string[];
  permissions: string[];
}

export interface AppAllocation {
  organizationId: string;
  enabledAppIds: string[];
  apps: Array<AppManifest & { enabled: boolean }>;
}

export interface MeResponse {
  actor: { id: string; type: string; displayName: string };
  person: { id: string; email: string | null; membershipSpaceIds: string[] } | null;
  isSuperAdmin: boolean;
}

export type AgentAutonomy = "suggest" | "approve" | "autonomous";

export interface ApiAgent {
  id: string;
  actorId: string;
  ownerId: string;
  organizationIds: string[];
  role: string | null;
  autonomy: AgentAutonomy;
  availability: "available" | "busy" | "offline";
  performance: Record<string, number>;
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `request failed (${res.status})`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export async function getMe(): Promise<MeResponse> {
  return api<MeResponse>("/api/auth/me");
}

export async function getOrganizations(): Promise<OrganizationListItem[]> {
  const data = await api<{ items: OrganizationListItem[] }>("/api/organizations");
  return data.items;
}

export async function getOrganization(id: string): Promise<Organization> {
  return api<Organization>(`/api/organizations/${id}`);
}

export async function createOrganization(input: {
  name: string;
  dream?: string;
}): Promise<{ organization: Organization; space: Space }> {
  return api<{ organization: Organization; space: Space }>("/api/organizations", {
    method: "POST",
    body: JSON.stringify({ name: input.name, dream: input.dream }),
  });
}

export async function updateOrganizationDream(
  organizationId: string,
  dream: string,
): Promise<Organization> {
  const data = await api<{ organization: Organization }>(
    `/api/organizations/${organizationId}`,
    {
      method: "PATCH",
      body: JSON.stringify({ dream }),
    },
  );
  return data.organization;
}

export async function getOrganizationMembers(
  organizationId: string,
): Promise<OrganizationMember[]> {
  const data = await api<{ items: OrganizationMember[] }>(
    `/api/organizations/${organizationId}/members`,
  );
  return data.items;
}

export async function addOrganizationMember(
  organizationId: string,
  input: { email: string; role: "admin" | "member" },
): Promise<OrganizationMember> {
  return api<OrganizationMember>(`/api/organizations/${organizationId}/members`, {
    method: "POST",
    body: JSON.stringify({ email: input.email, role: input.role }),
  });
}

export async function updateOrganizationMember(
  organizationId: string,
  personId: string,
  role: "admin" | "member",
): Promise<OrganizationMember> {
  return api<OrganizationMember>(
    `/api/organizations/${organizationId}/members/${personId}`,
    {
      method: "PATCH",
      body: JSON.stringify({ role }),
    },
  );
}

export async function removeOrganizationMember(
  organizationId: string,
  personId: string,
): Promise<void> {
  await api<void>(`/api/organizations/${organizationId}/members/${personId}`, {
    method: "DELETE",
  });
}

export async function getOrganizationApps(
  organizationId: string,
): Promise<AppAllocation> {
  return api<AppAllocation>(`/api/organizations/${organizationId}/apps`);
}

export async function setOrganizationApps(
  organizationId: string,
  enabledAppIds: string[],
): Promise<AppAllocation> {
  return api<AppAllocation>(`/api/organizations/${organizationId}/apps`, {
    method: "PUT",
    body: JSON.stringify({ enabledAppIds }),
  });
}

export async function getApps(): Promise<AppManifest[]> {
  const data = await api<{ items: AppManifest[] }>("/api/apps");
  return data.items;
}

export async function getAgents(): Promise<ApiAgent[]> {
  const data = await api<{ items: ApiAgent[] }>("/api/agents");
  return data.items;
}