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

export interface ApiSupplier {
  id: string;
  actorId: string;
  organizationId: string | null;
  onboardingStatus: string;
  defaultCurrency: string;
  terms: string | null;
  reputation: Record<string, number>;
  createdAt: string;
}

export interface ApiProduct {
  id: string;
  name: string;
  gtin: string | null;
  sku: string | null;
  lifeCycle: string;
  unitOfMeasure: string;
  description: string;
}

export interface ApiCatalog {
  id: string;
  ownerOrganizationId: string;
  name: string;
  version: string;
  visibility: string;
  status: string;
  source: string;
  sourceOfTruth: string;
  syncRef: string | null;
}

export interface ApiCatalogOffer {
  id: string;
  catalogId: string;
  sellerOrganizationId: string;
  productId: string;
  priceQuantity: number;
  priceTiers: Array<{ minQty: number; amount: number; currency: string }>;
  minQty: number;
  maxQty: number | null;
  orderIncrement: number;
  availability: string | null;
  leadTime: string | null;
  status: string;
}

export interface ApiQuoteRequest {
  id: string;
  buyerOrganizationId: string;
  title: string;
  description: string;
  items: Array<{ productId: string; quantity: number }>;
  status: string;
  responseDeadline: string | null;
}

export interface ApiQuote {
  id: string;
  quoteRequestId: string;
  sellerOrganizationId: string;
  total: number;
  currency: string;
  status: string;
  terms: string | null;
  validUntil: string | null;
  items: Array<{ productId: string; quantity: number; unitPrice: number }>;
}

export interface ApiPurchaseOrder {
  id: string;
  quoteId: string;
  buyerOrganizationId: string;
  sellerOrganizationId: string;
  total: number;
  currency: string;
  status: string;
  paymentIntentId: string | null;
  approvedByActorId: string | null;
  items: Array<{ productId: string; quantity: number; unitPrice: number }>;
}

export interface ApiPaymentIntent {
  id: string;
  purchaseOrderId: string;
  buyerOrganizationId: string;
  sellerOrganizationId: string;
  currency: string;
  estimatedAmount: number;
  provider: string;
  status: string;
  requiresApproval: boolean;
  approvedByActorId: string | null;
  providerReference: string | null;
  metadata: Record<string, unknown> | null;
}

export interface ApiPaymentRecord {
  id: string;
  paymentIntentId: string;
  paidAmount: number;
  currency: string;
  providerReference: string | null;
  settledAt: string;
}

export async function registerSupplier(input: {
  actorId: string;
  organizationId?: string | null;
}): Promise<ApiSupplier> {
  return api<ApiSupplier>("/api/suppliers", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function listSuppliers(): Promise<ApiSupplier[]> {
  const data = await api<{ items: ApiSupplier[] }>("/api/suppliers");
  return data.items;
}

export async function createProduct(input: {
  name: string;
  gtin?: string;
  sku?: string;
  unitOfMeasure?: string;
  description?: string;
}): Promise<ApiProduct> {
  return api<ApiProduct>("/api/products", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function listProducts(): Promise<ApiProduct[]> {
  const data = await api<{ items: ApiProduct[] }>("/api/products");
  return data.items;
}

export async function createCatalog(input: {
  ownerOrganizationId: string;
  name: string;
  visibility?: string;
}): Promise<ApiCatalog> {
  return api<ApiCatalog>("/api/catalogs", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function listCatalogs(
  ownerOrganizationId?: string,
): Promise<ApiCatalog[]> {
  const path = ownerOrganizationId
    ? `/api/catalogs?ownerOrganizationId=${encodeURIComponent(ownerOrganizationId)}`
    : "/api/catalogs";
  const data = await api<{ items: ApiCatalog[] }>(path);
  return data.items;
}

export async function publishCatalog(id: string): Promise<ApiCatalog> {
  return api<ApiCatalog>(`/api/catalogs/${id}/publish`, { method: "POST" });
}

export async function createCatalogOffer(input: {
  catalogId: string;
  sellerOrganizationId: string;
  productId: string;
  priceTiers: Array<{ minQty: number; amount: number; currency: string }>;
  minQty?: number;
}): Promise<ApiCatalogOffer> {
  return api<ApiCatalogOffer>("/api/catalog-offers", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function listCatalogOffers(): Promise<ApiCatalogOffer[]> {
  const data = await api<{ items: ApiCatalogOffer[] }>("/api/catalog-offers");
  return data.items;
}

export type NetworkSearchHit = ApiCatalogOffer & {
  offerId: string;
  productName: string;
  currency: string;
  unitPrice: number;
  reputation: number;
  matchScore: number;
};

export async function searchNetworkHits(input: {
  q?: string;
  minQty?: number;
}): Promise<NetworkSearchHit[]> {
  const params = new URLSearchParams();
  if (input.q) params.set("q", input.q);
  if (input.minQty) params.set("minQty", String(input.minQty));
  const qs = params.toString();
  const data = await api<{ items: NetworkSearchHit[] }>(
    `/api/network/search${qs ? `?${qs}` : ""}`,
  );
  return data.items;
}

export async function createQuoteRequest(input: {
  buyerOrganizationId: string;
  title: string;
  items: Array<{ productId: string; quantity: number }>;
}): Promise<ApiQuoteRequest> {
  return api<ApiQuoteRequest>("/api/quote-requests", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function listQuoteRequests(
  buyerOrganizationId: string,
): Promise<ApiQuoteRequest[]> {
  const data = await api<{ items: ApiQuoteRequest[] }>(
    `/api/quote-requests?buyerOrganizationId=${encodeURIComponent(buyerOrganizationId)}`,
  );
  return data.items;
}

export async function acceptQuote(
  quoteRequestId: string,
  quoteId: string,
): Promise<{ request: ApiQuoteRequest; quote: ApiQuote }> {
  return api<{ request: ApiQuoteRequest; quote: ApiQuote }>(
    `/api/quote-requests/${quoteRequestId}/accept`,
    { method: "POST", body: JSON.stringify({ quoteId }) },
  );
}

export async function createPurchaseOrder(quoteId: string): Promise<ApiPurchaseOrder> {
  return api<ApiPurchaseOrder>("/api/purchase-orders", {
    method: "POST",
    body: JSON.stringify({ quoteId }),
  });
}

export async function listPurchaseOrders(): Promise<ApiPurchaseOrder[]> {
  const data = await api<{ items: ApiPurchaseOrder[] }>("/api/purchase-orders");
  return data.items;
}

export async function approvePurchaseOrder(id: string): Promise<ApiPurchaseOrder> {
  return api<ApiPurchaseOrder>(`/api/purchase-orders/${id}/approve`, { method: "POST" });
}

export async function fulfillPurchaseOrder(id: string): Promise<ApiPurchaseOrder> {
  return api<ApiPurchaseOrder>(`/api/purchase-orders/${id}/fulfill`, { method: "POST" });
}

export async function listPaymentIntents(): Promise<ApiPaymentIntent[]> {
  const data = await api<{ items: ApiPaymentIntent[] }>("/api/payment-intents");
  return data.items;
}

export async function approvePaymentIntent(id: string): Promise<ApiPaymentIntent> {
  return api<ApiPaymentIntent>(`/api/payment-intents/${id}/approve`, { method: "POST" });
}

export async function confirmPaymentIntent(id: string): Promise<ApiPaymentIntent> {
  return api<ApiPaymentIntent>(`/api/payment-intents/${id}/confirm`, { method: "POST" });
}

export async function listPaymentRecords(
  paymentIntentId: string,
): Promise<ApiPaymentRecord[]> {
  const data = await api<{ items: ApiPaymentRecord[] }>(
    `/api/payment-intents/${paymentIntentId}/records`,
  );
  return data.items;
}