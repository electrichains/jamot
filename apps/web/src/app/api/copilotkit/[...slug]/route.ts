import { NextRequest, NextResponse } from "next/server";
import {
  BuiltInAgent,
  CopilotRuntime,
  createCopilotRuntimeHandler,
} from "@copilotkit/runtime/v2";

interface RuntimeModelResponse {
  configured: boolean;
  kind?: "openai" | "anthropic";
  model?: string;
  baseUrl?: string;
  apiKey?: string;
  providerName?: string;
  reason?: string;
}

type ResolveResult =
  | { ok: true; modelId: string; kind: "openai" | "anthropic"; apiKey: string; baseUrl: string | null; source: string }
  | { ok: false; reason: string };

const REASON_HINTS: Record<string, string> = {
  no_providers: "No provider configured — add one in Settings > Models.",
  no_enabled_models: "Provider exists but no model enabled — enable one.",
  secret_missing: "API key missing from vault — re-add provider.",
  decrypt_failed: "API key decrypt failed — re-add provider.",
  prefer_not_found: "Selected model no longer exists — pick another.",
  resolution_error: "Internal error — check API logs.",
  api_unauthorized: "Session rejected — log out, log back in once after deploys.",
  api_error_500: "API returned server error — check API logs.",
};

const DEFAULT_PROMPT =
  "You are the Jamot Main Manager. You help plan, delegate and track work. Delegate to searchPeople/searchAgents tools when available. Handle supplier procurement: register suppliers, review POs. High-risk actions (approving POs/payments/fulfilling PO) must wait for explicit confirmation.";

const BUILDER_PROMPT =
  "You are the Jamot Agent Builder. Help users design and create agents. Ask for name, role, autonomy (suggest/approve/autonomous), and channels. Call createAgent when ready.";

const SKILLS_PROMPT =
  "You are the Jamot Skill Assistant. Help users author and improve skills in Markdown. Produce FULL revised Markdown on modification requests. Good skills have purpose, inputs, process, constraints, output.";

/**
 * Build the LLM model for BuiltInAgent. Two strategies, tried in order:
 *
 * Strategy A (best): Use @ai-sdk/openai's createOpenAI to build a LanguageModel
 *     with the provider's exact baseURL. This bypasses CopilotKit's resolver
 *     so the request hits the real endpoint (e.g. Alibaba MaaS).
 *
 * Strategy B (fallback): Mutate OPENAI_BASE_URL env-var then return a plain
 *     "openai/<model>" string. CopilotKit's resolver picks up the URL.
 *     Race-safe because Node.js is single-threaded: the env-var persists
 *     through the synchronous constructor block of THIS request.
 */
async function buildAgentModel(resolved: ResolveResult & { ok: true }) {
  // --- Strategy A: createOpenAI + LanguageModel ---
  try {
    console.log("[model] Strategy A: loading @ai-sdk/openai via dynamic import...");
    const openaiPkg = await import("@ai-sdk/openai");
    const createOpenAI = openaiPkg.createOpenAI;

    const provider = createOpenAI({
      apiKey: resolved.apiKey,
      baseURL: resolved.baseUrl ?? undefined,
    });
    const lm = provider(resolved.modelId);
    console.log(
      "[model] Strategy A OK — LanguageModel constructed",
      typeof lm === "function" ? "callable" : JSON.stringify(lm),
    );
    return { strategy: "A", model: lm };
  } catch (err) {
    console.warn(
      "[model] Strategy A FAILED — will try fallback:",
      err instanceof Error ? err.message : err,
    );
  }

  // --- Strategy B: OPENAI_BASE_URL env-var ---
  console.log(
    "[model] Strategy B: setting OPENAI_BASE_URL =",
    resolved.baseUrl ?? "(none)",
  );
  process.env.OPENAI_BASE_URL = resolved.baseUrl ?? "";

  console.log(
    "[model] Strategy B: returning string model =",
    `${resolved.kind}/${resolved.modelId}`,
  );
  return {
    strategy: "B",
    model: `${resolved.kind}/${resolved.modelId}`,
  };
}

async function resolveChatModel(req: NextRequest): Promise<ResolveResult> {
  const cookieHeader = req.headers.get("cookie") ?? "";
  const orgId = req.cookies.get("jamot_active_org")?.value;
  const apiHost = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

  console.log("[route] === START === cookies=", !!cookieHeader, "orgId=", orgId, "apiHost=", apiHost);

  if (!cookieHeader) {
    console.warn("[route] no cookies");
    return { ok: false, reason: "no_cookies" };
  }

  const hasSession = /(^|;\s*)jamot_session=/.test(cookieHeader);
  console.log("[route] jamot_session present:", hasSession);

  const url = new URL(`${apiHost}/api/models/runtime`);
  if (orgId) url.searchParams.set("organizationId", orgId);

  console.log("[route] fetching:", url.toString());

  try {
    const res = await fetch(url.toString(), {
      headers: { cookie: cookieHeader },
      cache: "no-store",
    });
    console.log("[route] API status:", res.status);

    if (res.status === 401) {
      console.error("[route] API 401 — cookie rejected.");
      return { ok: false, reason: "api_unauthorized" };
    }
    if (!res.ok) {
      const text = await res.text();
      console.error("[route] API error:", res.status, text.slice(0, 300));
      return { ok: false, reason: `api_error_${res.status}` };
    }

    const data = (await res.json()) as RuntimeModelResponse;
    console.log("[route] API data:", JSON.stringify(data).slice(0, 600));

    if (data.configured && data.apiKey && data.kind && data.model) {
      console.log(
        "[route] SUCCESS —",
        data.providerName ?? "?",
        data.model,
        data.baseUrl ? "@" + data.baseUrl : "",
      );
      return {
        ok: true,
        modelId: data.model,
        kind: data.kind,
        apiKey: data.apiKey,
        baseUrl: data.baseUrl ?? null,
        source: "provider",
      };
    }

    console.warn("[route] configured=false, reason:", data.reason);
    return { ok: false, reason: data.reason ?? "unknown" };
  } catch (err) {
    console.error("[route] fetch exception:", err instanceof Error ? err.message : String(err));
    return { ok: false, reason: "api_unreachable" };
  }
}

export const runtime = "nodejs";

async function handle(req: NextRequest) {
  try {
    console.log("[handler] === CALL === method:", req.method, "path:", req.nextUrl.pathname);

    const resolved = await resolveChatModel(req);
    if (!resolved.ok) {
      const hint = REASON_HINTS[resolved.reason] ?? `Unknown: ${resolved.reason}`;
      throw new Error(`Chat unavailable (${resolved.reason}). ${hint}`);
    }

    const { strategy, model } = await buildAgentModel(resolved as ResolveResult & { ok: true });
    console.log("[handler] Model built via strategy:", strategy);

    console.log("[handler] Creating CopilotRuntime...");
    const runtime = new CopilotRuntime({
      agents: {
        default: new BuiltInAgent({ model, prompt: DEFAULT_PROMPT, maxSteps: 5 }),
        builder: new BuiltInAgent({ model, prompt: BUILDER_PROMPT, maxSteps: 6 }),
        skills: new BuiltInAgent({ model, prompt: SKILLS_PROMPT, maxSteps: 4 }),
      },
      a2ui: {},
    });
    console.log("[handler] CopilotRuntime created OK");

    console.log("[handler] Creating handler...");
    const handler = createCopilotRuntimeHandler({ runtime, basePath: "/api/copilotkit" });
    console.log("[handler] Handler created OK");
    return handler(req);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[handler] FATAL ERROR:", msg);
    // Stack trace to logs for debugging
    console.error("[handler] stack:", err instanceof Error ? err.stack : "");
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}

export const GET = handle;
export const POST = handle;
export const OPTIONS = handle;
