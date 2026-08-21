import type { JamotRepository } from "../repository/repository.js";
import type { SecretStore } from "../secrets/secret-store.js";

export type ModelProvider = "openai" | "anthropic";

export interface ResolvedModelConfig {
  provider: ModelProvider;
  apiKey: string;
  baseUrl?: string;
  model?: string;
}

export interface ModelConfigResolveContext {
  repository: JamotRepository;
  store: SecretStore;
  organizationId?: string | null;
  actorId?: string | null;
  env?: NodeJS.ProcessEnv;
}

const MODEL_KEY_REF = "models";

function modelKeyRef(provider: ModelProvider, scopeId: string): string {
  return `${MODEL_KEY_REF}/${provider}/${scopeId}`;
}

async function readStored(
  repository: JamotRepository,
  store: SecretStore,
  ref: string,
  provider: ModelProvider,
): Promise<ResolvedModelConfig | null> {
  const secret = await repository.getSecret(ref);
  if (!secret) return null;
  try {
    const parsed = JSON.parse(store.decrypt(secret.ciphertext)) as Partial<ResolvedModelConfig>;
    if (!parsed.apiKey) return null;
    return {
      provider,
      apiKey: parsed.apiKey,
      baseUrl: parsed.baseUrl,
      model: parsed.model,
    };
  } catch {
    return null;
  }
}

export async function resolveModelConfig(
  input: ModelConfigResolveContext & { provider: ModelProvider },
): Promise<ResolvedModelConfig | null> {
  const { repository, store, provider, organizationId, actorId, env } = input;
  const envObj = env ?? process.env;

  if (organizationId) {
    const stored = await readStored(repository, store, modelKeyRef(provider, organizationId), provider);
    if (stored) return stored;
  }
  if (actorId) {
    const stored = await readStored(repository, store, modelKeyRef(provider, actorId), provider);
    if (stored) return stored;
  }

  if (provider === "openai" && envObj.OPENAI_API_KEY) {
    return {
      provider,
      apiKey: envObj.OPENAI_API_KEY,
      baseUrl: envObj.OPENAI_BASE_URL,
      model: envObj.OPENAI_MODEL,
    };
  }
  if (provider === "anthropic" && envObj.ANTHROPIC_API_KEY) {
    return {
      provider,
      apiKey: envObj.ANTHROPIC_API_KEY,
      baseUrl: envObj.ANTHROPIC_BASE_URL,
    };
  }
  return null;
}

export async function resolveAnyModelConfig(
  input: ModelConfigResolveContext,
): Promise<ResolvedModelConfig | null> {
  for (const provider of ["openai", "anthropic"] as ModelProvider[]) {
    const found = await resolveModelConfig({ ...input, provider });
    if (found) return found;
  }
  return null;
}

export interface WriteModelConfigInput {
  repository: JamotRepository;
  store: SecretStore;
  provider: ModelProvider;
  scope: "user" | "organization";
  scopeId: string;
  apiKey: string;
  baseUrl?: string;
  model?: string;
}

export async function writeModelConfig(input: WriteModelConfigInput): Promise<void> {
  const ref = modelKeyRef(input.provider, input.scopeId);
  await input.repository.putSecret({
    ref,
    scope: input.scope,
    ownerActorId: input.scope === "user" ? input.scopeId : null,
    ownerOrganizationId: input.scope === "organization" ? input.scopeId : null,
    ciphertext: input.store.encrypt(
      JSON.stringify({
        provider: input.provider,
        apiKey: input.apiKey,
        baseUrl: input.baseUrl,
        model: input.model,
      }),
    ),
  });
}

export async function clearModelConfig(input: {
  repository: JamotRepository;
  provider: ModelProvider;
  scope: "user" | "organization";
  scopeId: string;
}): Promise<void> {
  await input.repository.deleteSecret(modelKeyRef(input.provider, input.scopeId));
}
