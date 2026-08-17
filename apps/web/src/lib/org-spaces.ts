import { API_URL } from "@/components/auth/auth-context";

export interface OrgSpaceRef {
  spaceId: string;
  name: string;
}

/**
 * Lists the caller's organizations and returns their space ids/names.
 * Self-contained (does not depend on the org-management WIP modules).
 */
export async function listOrgSpaces(): Promise<OrgSpaceRef[]> {
  const res = await fetch(`${API_URL}/api/organizations`, {
    credentials: "include",
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `failed to load organizations (${res.status})`);
  }
  const data = (await res.json()) as {
    items?: Array<{ space?: { id: string; name: string } }>;
  };
  return (data.items ?? [])
    .map((item) => ({
      spaceId: item.space?.id ?? "",
      name: item.space?.name ?? "",
    }))
    .filter((item) => item.spaceId.length > 0);
}
