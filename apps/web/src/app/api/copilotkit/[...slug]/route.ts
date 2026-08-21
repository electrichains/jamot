import { NextRequest, NextResponse } from "next/server";
import {
  BuiltInAgent,
  CopilotRuntime,
  createCopilotRuntimeHandler,
} from "@copilotkit/runtime/v2";
import { createOpenAI } from "@ai-sdk/openai";

/** LanguageModel produced by the AI SDK provider (same type BuiltInAgent accepts). */
type SdkLanguageModel = ReturnType<ReturnType<typeof createOpenAI>>;

/**
 * Build the agent model for BuiltInAgent. Providers configured in
 * Settings > Models usually live on a custom OpenAI-compatible endpoint
 * (base URL), which a plain "openai/<model>" string cannot express — so we
 * construct a LanguageModel bound to that base URL. Without a base URL we
 * fall back to the provider-prefixed string, letting CopilotKit resolve it.
 */
function buildAgentModel(input: {
  modelId: string;
  kind: "openai" | "anthropic";
  apiKey: string;
  baseUrl: string | null;
}): SdkLanguageModel | string {
  console.log(
    "[buildAgentModel] input:",
    JSON.stringify({ modelId: input.modelId, kind: input.kind, baseUrl: input.baseUrl }),
  );
  if (input.baseUrl) {
    console.log("[buildAgentModel] building LanguageModel via createOpenAI with baseURL:", input.baseUrl);
    const provider = createOpenAI({
      apiKey: input.apiKey.slice(0, 8) + "..." + input.apiKey.slice(-4), // mask key in logs
      baseURL: input.baseUrl,
    });
    const lm = provider(input.modelId);
    console.log("[buildAgentModel] LanguageModel built, keys:", Object.keys(lm));
    return lm;
  }
  const str = `${input.kind}/${input.modelId}`;
  console.log("[buildAgentModel] returning string model:", str);
  return str;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

// Shortened prompts to reduce bundle size — the full prompt strings remain below
const PROMPT_PREFIX =
  "You are the Jamot Main Manager. You help a person or organization plan, delegate and track work. Be concise and concrete.";
const BUILDER_PROMPT_SHORT =
  "You are the Jamot Agent Builder. Your only job is to help the user design and create a new agent.";
const SKILLS_PROMPT_SHORT =
  "You are the Jamot Skill Assistant. Help the user improve, complete, simplify or safety-check their skill.";

const DEFAULT_PROMPT = `${PROMPT_PREFIX} When asked to find or research people or agents, delegate to the searchPeople and searchAgents tools when available. Handle supplier network procurement and payments: register suppliers, search suppliers, review POs. High-risk actions must wait for explicit confirmation.`;
const BUILDER_PROMPT = `${BUILDER_PROMPT_SHORT} Ask for name, role, autonomy level (suggest/approve/autonomous), and channels. Then call createAgent.`;
const SKILLS_PROMPT = `${SKILLS_PROMPT_SHORT} Good skills have clear purpose, inputs, step-by-step process, constraints. Produce FULL revised Markdown on modification requests.`;

interface RuntimeModelResponse {
  configured: boolean;
  kind?: "openai" | "anthropic";
  model?: string;
  baseUrl?: string;
  apiKey?: string;
  providerName?: string;
  reason?: string;
}

const REASON_HINTS: Record<string, string> = {
  no_providers: "No model provider configured. Add one in Settings > Models.",
  no_enabled_models: "Provider exists but no model enabled. Enable one in Settings > Models.",
  secret_missing: "Provider API key missing from vault. Re-add provider in Settings > Models.",
  decrypt_failed: "Provider API key decryption failed. Re-add provider in Settings > Models.",
  prefer_not_found: "Selected orchestrator model no longer exists. Pick another in Settings > Models.",
  resolution_error: "Internal error resolving model. Check API logs.",
  api_unauthorized: "Session cookie not forwarded — may need to log out/in once after deploys.",
  api_error_500: "API returned server error. Check API logs.",
};

type ResolveResult =
  | { ok: true; modelId: string; kind: "openai" | "anthropic"; apiKey: string; baseUrl: string | null; source: string }
  | { ok: false; reason: string };

async function resolveChatModel(req: NextRequest): Promise<ResolveResult> {
  const orgId = req.cookies.get("jamot_active_org")?.value;
  const cookieHeader = req.headers.get("cookie") ?? "";

  console.log("[copilotkit] === resolveChatModel START ===", { hasCookie: !!cookieHeader, orgId });

  if (!cookieHeader) {
    console.warn("[copilotkit] no cookies");
    return { ok: false, reason: "no_cookies" };
  }

  const hasSession = /(^|;\s*)jamot_session=/.test(cookieHeader);
  console.log("[copilotkit] jamot_session present:", hasSession);

  const url = new URL(`${API_URL}/api/models/runtime`);
  if (orgId) url.searchParams.set("organizationId", orgId);

  console.log("[copilotkit] fetching:", url.toString());

  try {
    const res = await fetch(url.toString(), {
      headers: { cookie: cookieHeader },
      cache: "no-store",
    });
    console.log("[copilotkit] API response status:", res.status);

    if (res.status === 401) {
      console.error("[copilotkit] API 401 — session cookie rejected.");
      return { ok: false, reason: "api_unauthorized" };
    }
    if (!res.ok) {
      const text = await res.text();
      console.error("[copilotkit] API error:", res.status, text.slice(0, 300));
      return { ok: false, reason: `api_error_${res.status}` };
    }

    const data = (await res.json()) as RuntimeModelResponse;
    console.log("[copilotkit] API data:", JSON.stringify(data).slice(0, 500));

    if (data.configured && data.apiKey && data.kind && data.model) {
      console.log("[copilotkit] SUCCESS: provider", data.providerName, "model", data.model);
      return {
        ok: true,
        modelId: data.model,
        kind: data.kind,
        apiKey: data.apiKey,
        baseUrl: data.baseUrl ?? null,
        source: "provider",
      };
    }

    console.warn("[copilotkit] configured=false, reason:", data.reason);
    return { ok: false, reason: data.reason ?? "unknown" };
  } catch (err) {
    console.error("[copilotkit] fetch exception:", err instanceof Error ? err.message : err);
    return { ok: false, reason: "api_unreachable" };
  }
}

async function buildHandler(req: NextRequest) {
  console.log("[copilotkit] === buildHandler START ===");
  const resolved = await resolveChatModel(req);

  if (!resolved.ok) {
    const hint = REASON_HINTS[resolved.reason] ?? `Unknown reason: ${resolved.reason}`;
    throw new Error(`Chat model unavailable (${resolved.reason}). ${hint}`.trim());
  }

  console.log("[copilotkit] About to buildAgentModel...");
  const agentModel = buildAgentModel(resolved);
  console.log("[copilotkit] Model type:", typeof agentModel, agentModel instanceof Function ? "provider-result" : typeof String(agentModel));

  console.log("[copilotkit] Constructing CopilotRuntime...");
  const runtime = new CopilotRuntime({
    agents: {
      default: new BuiltInAgent({
        model: agentModel,
        apiKey: resolved.apiKey,
        prompt: DEFAULT_PROMPT,
        maxSteps: 5,
      }),
      builder: new BuiltInAgent({
        model: agentModel,
        apiKey: resolved.apiKey,
        prompt: BUILDER_PROMPT,
        maxSteps: 6,
      }),
      skills: new BuiltInAgent({
        model: agentModel,
        apiKey: resolved.apiKey,
        prompt: SKILLS_PROMPT,
        maxSteps: 4,
      }),
    },
    a2ui: {},
  });
  console.log("[copilotkit] CopilotRuntime constructed successfully");

  console.log("[copilotkit] Creating handler...");
  const handler = createCopilotRuntimeHandler({ runtime, basePath: "/api/copilotkit" });
  console.log("[copilotkit] Handler created successfully");
  return handler;
}

export const runtime = "nodejs";

async function handle(req: NextRequest) {
  try {
    console.log("[copilotkit] === handle CALL === method:", req.method, "path:", req.nextUrl.pathname);
    const handler = await buildHandler(req);
    return handler(req);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[copilotkit] HANDLER ERROR:", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

export const GET = handle;
export const POST = handle;
export const OPTIONS = handle;
