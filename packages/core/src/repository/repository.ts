import type {
  Actor,
  Agent,
  BuyerAgreement,
  Capability,
  Catalog,
  CatalogOffer,
  Connector,
  Organization,
  PaymentIntent,
  PaymentRecord,
  Person,
  Policy,
  Product,
  PurchaseOrder,
  Quote,
  QuoteRequest,
  Role,
  Skill,
  Space,
  Supplier,
  Task,
  TaskAttachment,
  TaskList,
} from "@jamot/contracts";

/**
 * Persistence interface for the Jamot domain. This is the seam between the
 * Drizzle implementation and every service (routing, vault, api) that reads
 * or writes domain state. Implementations must be server-side validated for
 * ownership/tenant scoping by the caller, not the store.
 */

// --- Create inputs (server generates id + timestamps) ---

export interface NewActor {
  type: Actor["type"];
  source?: Actor["source"];
  displayName: string;
  status?: Actor["status"];
  externalIdentities?: Actor["externalIdentities"];
  personalSpaceId?: string | null;
}

export interface NewPerson {
  actorId: string;
  email?: string | null;
  profile?: Person["profile"];
  membershipSpaceIds?: string[];
  reputation?: Record<string, number>;
}

export interface NewAgent {
  actorId: string;
  ownerId: string;
  organizationIds?: string[];
  role?: string | null;
  harness: Agent["harness"];
  skillIds?: string[];
  capabilityIds?: string[];
  permissions?: string[];
  autonomy?: Agent["autonomy"];
  budget?: number | null;
  heartbeat?: Agent["heartbeat"];
  availability?: Agent["availability"];
  performance?: Record<string, number>;
}

export interface NewSpace {
  kind: Space["kind"];
  ownerActorId: string;
  name: string;
}

export interface NewOrganization {
  spaceId: string;
  dream?: string;
  blueprint?: Record<string, unknown>;
  enabledAppIds?: string[];
  treasuryId?: string | null;
  reputation?: Record<string, number>;
}

export interface NewRole {
  actorId: string;
  spaceId: string;
  kind: Role["kind"];
  title?: string | null;
}

export interface NewTask {
  spaceId: string;
  projectId?: string | null;
  listId?: string | null;
  title: string;
  description?: string;
  status?: Task["status"];
  assigneeActorIds?: string[];
  targetType?: Task["targetType"];
  requiredCapabilityIds?: string[];
  outcome?: Record<string, unknown> | null;
  dueDate?: string | null;
  position?: number;
}

export interface NewTaskList {
  spaceId: string;
  name: string;
  position?: number;
}

export interface NewTaskAttachment {
  taskId: string;
  name: string;
  mimeType?: string;
  size?: number;
  data: string;
}

export interface NewSkill {
  ownerActorId?: string | null;
  ownerOrganizationId?: string | null;
  name: string;
  description?: string;
  version?: string;
  inputs?: Record<string, unknown>;
  outputs?: Record<string, unknown>;
  prerequisites?: string[];
  allowedCapabilityIds?: string[];
  evaluationCriteria?: string[];
  provenance: Skill["provenance"];
  status?: Skill["status"];
}

export interface NewConnector {
  provider: Connector["provider"];
  type?: Connector["type"];
  ownerActorId?: string | null;
  ownerOrganizationId?: string | null;
  capabilities?: string[];
  credentialRef: Connector["credentialRef"];
  scopes?: string[];
  configuration?: Record<string, unknown>;
  status?: Connector["status"];
}

export interface NewCapability {
  name: string;
  skillId: string;
  connectorId: string;
  policyIds?: string[];
  context?: Record<string, unknown>;
  spaceId: string;
}

export interface NewPolicy {
  spaceId: string;
  name: string;
  capability: string;
  resource?: string;
  minRole?: Policy["minRole"];
  riskThreshold?: number;
  decision: Policy["decision"];
}

export interface NewSupplier {
  actorId: string;
  organizationId?: string | null;
  onboardingStatus?: Supplier["onboardingStatus"];
  defaultCurrency?: string;
  terms?: string | null;
}

export interface NewProduct {
  gtin?: string | null;
  sku?: string | null;
  manufacturerId?: string | null;
  name: string;
  description?: string;
  dimensions?: Record<string, unknown> | null;
  packaging?: Record<string, unknown> | null;
  unitOfMeasure?: string;
  taxCategory?: string | null;
  compliance?: string[];
  lifecycle?: Product["lifecycle"];
}

export interface NewCatalog {
  ownerOrganizationId: string;
  name: string;
  version?: string;
  visibility?: Catalog["visibility"];
  source?: Catalog["source"];
  sourceOfTruth?: Catalog["sourceOfTruth"];
  syncRef?: string | null;
  lastSyncAt?: string | null;
  status?: Catalog["status"];
}

export interface NewCatalogOffer {
  catalogId: string;
  productId: string;
  sellerOrganizationId: string;
  orderableUnit?: string;
  priceQuantity?: number;
  priceTiers: CatalogOffer["priceTiers"];
  minQty?: number;
  maxQty?: number | null;
  orderIncrement?: number;
  availability?: string | null;
  leadTime?: string | null;
  validityFrom?: string | null;
  validityTo?: string | null;
  taxIncluded?: boolean;
  status?: CatalogOffer["status"];
}

export interface NewBuyerAgreement {
  catalogOfferId: string;
  buyerOrganizationId: string;
  priceTiers: BuyerAgreement["priceTiers"];
  validityFrom?: string | null;
  validityTo?: string | null;
}

export interface NewQuoteRequest {
  buyerOrganizationId: string;
  title: string;
  description?: string;
  items: QuoteRequest["items"];
  status?: QuoteRequest["status"];
  responseDeadline?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface NewQuote {
  quoteRequestId: string;
  sellerOrganizationId: string;
  items: Quote["items"];
  total: number;
  currency?: string;
  terms?: string | null;
  status?: Quote["status"];
  transcript?: string[];
  validUntil?: string | null;
}

export interface NewPurchaseOrder {
  quoteId: string;
  buyerOrganizationId: string;
  sellerOrganizationId: string;
  items: PurchaseOrder["items"];
  total: number;
  currency?: string;
  status?: PurchaseOrder["status"];
  approvedByActorId?: string | null;
}

export interface NewPaymentIntent {
  purchaseOrderId: string;
  buyerOrganizationId: string;
  sellerOrganizationId: string;
  currency?: string;
  estimatedAmount: number;
  status?: PaymentIntent["status"];
  provider?: PaymentIntent["provider"];
  requiresApproval?: boolean;
  approvedByActorId?: string | null;
  providerReference?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface NewPaymentRecord {
  paymentIntentId: string;
  paidAmount: number;
  currency?: string;
  providerReference?: string | null;
  settledAt?: string | null;
}

export interface SecretRecord {
  ref: string;
  scope: SecretRecordScope;
  ownerActorId?: string | null;
  ownerOrganizationId?: string | null;
  ciphertext: string;
}

export type SecretRecordScope =
  | "user"
  | "organization"
  | "system"
  | "environment";

// --- Update inputs (partial) ---

export type TaskStatusUpdate = Pick<Task, "status">;

// --- The repository ---

export interface JamotRepository {
  // actors
  createActor(input: NewActor): Promise<Actor>;
  getActor(id: string): Promise<Actor | null>;
  listActors(filter?: { spaceId?: string }): Promise<Actor[]>;
  updateActor(id: string, patch: Partial<Pick<Actor, "displayName" | "status" | "personalSpaceId">>): Promise<Actor | null>;

  // people
  createPerson(input: NewPerson): Promise<Person>;
  getPerson(id: string): Promise<Person | null>;
  listPeople(): Promise<Person[]>;
  updatePerson(
    id: string,
    patch: Partial<
      Pick<Person, "profile" | "email" | "membershipSpaceIds" | "reputation">
    >,
  ): Promise<Person | null>;

  // agents
  createAgent(input: NewAgent): Promise<Agent>;
  getAgent(id: string): Promise<Agent | null>;
  listAgents(filter?: { organizationId?: string }): Promise<Agent[]>;

  // spaces & organizations
  createSpace(input: NewSpace): Promise<Space>;
  getSpace(id: string): Promise<Space | null>;
  listSpaces(): Promise<Space[]>;
  createOrganization(input: NewOrganization): Promise<Organization>;
  getOrganization(id: string): Promise<Organization | null>;
  listOrganizations(): Promise<Organization[]>;
  updateOrganization(
    id: string,
    patch: Partial<Pick<Organization, "dream" | "blueprint" | "enabledAppIds">>,
  ): Promise<Organization | null>;

  // roles
  createRole(input: NewRole): Promise<Role>;
  listRolesForActor(actorId: string): Promise<Role[]>;
  listRolesForSpace(spaceId: string): Promise<Role[]>;
  updateRole(
    id: string,
    patch: Partial<Pick<Role, "kind" | "title">>,
  ): Promise<Role | null>;
  deleteRole(id: string): Promise<void>;

  // tasks
  createTask(input: NewTask): Promise<Task>;
  getTask(id: string): Promise<Task | null>;
  listTasks(filter?: { spaceId?: string; assigneeActorId?: string; listId?: string }): Promise<Task[]>;
  updateTaskStatus(id: string, status: Task["status"]): Promise<Task | null>;
  assignTask(id: string, assigneeActorIds: string[]): Promise<Task | null>;
  updateTask(
    id: string,
    patch: Partial<
      Pick<
        Task,
        | "title"
        | "description"
        | "dueDate"
        | "listId"
        | "position"
        | "assigneeActorIds"
        | "targetType"
      >
    >,
  ): Promise<Task | null>;

  // task lists (Kanban columns)
  createTaskList(input: NewTaskList): Promise<TaskList>;
  getTaskList(id: string): Promise<TaskList | null>;
  listTaskLists(spaceId: string): Promise<TaskList[]>;
  updateTaskList(id: string, patch: Partial<Pick<TaskList, "name" | "position">>): Promise<TaskList | null>;
  deleteTaskList(id: string): Promise<void>;

  // task attachments
  addTaskAttachment(input: NewTaskAttachment): Promise<TaskAttachment>;
  listTaskAttachments(taskId: string): Promise<TaskAttachment[]>;
  deleteTaskAttachment(id: string): Promise<void>;

  // skills
  createSkill(input: NewSkill): Promise<Skill>;
  getSkill(id: string): Promise<Skill | null>;
  listSkills(filter?: { ownerOrganizationId?: string }): Promise<Skill[]>;

  // connectors
  createConnector(input: NewConnector): Promise<Connector>;
  getConnector(id: string): Promise<Connector | null>;
  listConnectors(filter?: { ownerOrganizationId?: string }): Promise<Connector[]>;
  updateConnectorStatus(id: string, status: Connector["status"]): Promise<Connector | null>;

  // capabilities
  createCapability(input: NewCapability): Promise<Capability>;
  getCapability(id: string): Promise<Capability | null>;
  listCapabilities(filter?: { spaceId?: string }): Promise<Capability[]>;

  // policies
  createPolicy(input: NewPolicy): Promise<Policy>;
  listPolicies(filter?: { spaceId?: string }): Promise<Policy[]>;

  // secrets
  putSecret(secret: SecretRecord): Promise<void>;
  getSecret(ref: string): Promise<SecretRecord | null>;
  deleteSecret(ref: string): Promise<void>;

  // suppliers
  createSupplier(input: NewSupplier): Promise<Supplier>;
  getSupplier(id: string): Promise<Supplier | null>;
  getSupplierByActor(actorId: string): Promise<Supplier | null>;
  listSuppliers(filter?: { organizationId?: string }): Promise<Supplier[]>;
  updateSupplier(
    id: string,
    patch: Partial<
      Pick<Supplier, "onboardingStatus" | "defaultCurrency" | "terms" | "reputation"> & {
        organizationId?: string | null;
      }
    >,
  ): Promise<Supplier | null>;

  // products (master data)
  createProduct(input: NewProduct): Promise<Product>;
  getProduct(id: string): Promise<Product | null>;
  listProducts(): Promise<Product[]>;

  // catalogs
  createCatalog(input: NewCatalog): Promise<Catalog>;
  getCatalog(id: string): Promise<Catalog | null>;
  listCatalogs(filter?: { ownerOrganizationId?: string }): Promise<Catalog[]>;
  updateCatalog(
    id: string,
    patch: Partial<
      Pick<Catalog, "name" | "version" | "visibility" | "source" | "sourceOfTruth" | "syncRef" | "lastSyncAt" | "status">
    >,
  ): Promise<Catalog | null>;

  // catalog offers
  createCatalogOffer(input: NewCatalogOffer): Promise<CatalogOffer>;
  getCatalogOffer(id: string): Promise<CatalogOffer | null>;
  listCatalogOffers(filter?: {
    catalogId?: string;
    sellerOrganizationId?: string;
  }): Promise<CatalogOffer[]>;
  updateCatalogOffer(
    id: string,
    patch: Partial<
      Pick<CatalogOffer, "priceTiers" | "minQty" | "maxQty" | "orderIncrement" | "availability" | "leadTime" | "validityFrom" | "validityTo" | "taxIncluded" | "status">
    >,
  ): Promise<CatalogOffer | null>;

  // buyer agreements
  createBuyerAgreement(input: NewBuyerAgreement): Promise<BuyerAgreement>;
  listBuyerAgreements(filter?: {
    catalogOfferId?: string;
    buyerOrganizationId?: string;
  }): Promise<BuyerAgreement[]>;

  // procurement: RFQ -> Quote -> Purchase Order
  createQuoteRequest(input: NewQuoteRequest): Promise<QuoteRequest>;
  getQuoteRequest(id: string): Promise<QuoteRequest | null>;
  listQuoteRequests(filter?: {
    buyerOrganizationId?: string;
  }): Promise<QuoteRequest[]>;
  updateQuoteRequestStatus(
    id: string,
    status: QuoteRequest["status"],
  ): Promise<QuoteRequest | null>;

  createQuote(input: NewQuote): Promise<Quote>;
  getQuote(id: string): Promise<Quote | null>;
  listQuotes(filter?: { quoteRequestId?: string }): Promise<Quote[]>;
  updateQuoteStatus(id: string, status: Quote["status"]): Promise<Quote | null>;
  appendQuoteTranscript(id: string, message: string): Promise<Quote | null>;

  createPurchaseOrder(input: NewPurchaseOrder): Promise<PurchaseOrder>;
  getPurchaseOrder(id: string): Promise<PurchaseOrder | null>;
  listPurchaseOrders(filter?: {
    buyerOrganizationId?: string;
    sellerOrganizationId?: string;
  }): Promise<PurchaseOrder[]>;
  updatePurchaseOrder(
    id: string,
    patch: Partial<
      Pick<PurchaseOrder, "status" | "paymentIntentId"> & {
        approvedByActorId?: string | null;
        paymentIntentId?: string | null;
      }
    >,
  ): Promise<PurchaseOrder | null>;

  // payments
  createPaymentIntent(input: NewPaymentIntent): Promise<PaymentIntent>;
  getPaymentIntent(id: string): Promise<PaymentIntent | null>;
  listPaymentIntents(filter?: {
    buyerOrganizationId?: string;
    sellerOrganizationId?: string;
    purchaseOrderId?: string;
  }): Promise<PaymentIntent[]>;
  updatePaymentIntent(
    id: string,
    patch: Partial<
      Pick<
        PaymentIntent,
        | "status"
        | "providerReference"
        | "provider"
        | "metadata"
      > & {
        approvedByActorId?: string | null;
      }
    >,
  ): Promise<PaymentIntent | null>;

  createPaymentRecord(input: NewPaymentRecord): Promise<PaymentRecord>;
  listPaymentRecords(paymentIntentId: string): Promise<PaymentRecord[]>;
}
