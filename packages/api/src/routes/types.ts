import type {
  Capability,
  Connector,
  ConnectorProvider,
  ConnectorType,
  Skill,
} from "@jamot/contracts";

export interface SecretRecord {
  ref: string;
  scope: "user" | "organization" | "system" | "environment";
  ownerActorId?: string | null;
  ownerOrganizationId?: string | null;
  ciphertext: string;
}

export interface NewConnectorInput {
  provider: ConnectorProvider;
  type?: ConnectorType;
  ownerActorId?: string | null;
  ownerOrganizationId?: string | null;
  capabilities?: string[];
  credentialRef: Connector["credentialRef"];
  scopes?: string[];
  configuration?: Record<string, unknown>;
  status?: Connector["status"];
}

export interface NewCapabilityInput {
  name: string;
  skillId: string;
  connectorId: string;
  policyIds?: string[];
  context?: Record<string, unknown>;
  spaceId: string;
}

export interface NewSkillInput {
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

export interface VaultRepository {
  createConnector(input: NewConnectorInput): Promise<Connector>;
  getConnector(id: string): Promise<Connector | null>;
  listConnectors(filter?: {
    ownerOrganizationId?: string;
  }): Promise<Connector[]>;
  createCapability(input: NewCapabilityInput): Promise<Capability>;
  getCapability(id: string): Promise<Capability | null>;
  listCapabilities(filter?: { spaceId?: string }): Promise<Capability[]>;
  createSkill(input: NewSkillInput): Promise<Skill>;
  getSkill(id: string): Promise<Skill | null>;
  listSkills(filter?: { ownerOrganizationId?: string }): Promise<Skill[]>;
  putSecret(secret: SecretRecord): Promise<void>;
  getSecret(ref: string): Promise<SecretRecord | null>;
  deleteSecret(ref: string): Promise<void>;
}

export interface SecretStore {
  encrypt(plaintext: string): string;
  decrypt(ciphertext: string): string;
}

export type CredentialResolver = (ref: string) => Promise<string | null>;

export interface RoutesOptions {
  repository: VaultRepository;
  secretStore: SecretStore;
  credentialResolver: CredentialResolver;
}
