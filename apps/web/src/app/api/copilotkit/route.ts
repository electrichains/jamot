import type { NextRequest } from "next/server";
import {
  CopilotRuntime,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";
import { BuiltInAgent } from "@copilotkit/runtime/v2";

// --- Module-level runtime (runs ONCE at server startup) ---
const MODEL = process.env.OPENAI_MODEL || "openai/gpt-4o-mini";
const API_KEY = process.env.OPENAI_API_KEY ?? "";
const BASE_URL = process.env.OPENAI_BASE_URL;

console.log("[copilotkit] STARTUP model=%s apiKeyLen=%d baseUrl=%s", MODEL, API_KEY.length, BASE_URL || "(none)");

if (BASE_URL) {
  process.env.OPENAI_BASE_URL = BASE_URL;
}

const copilotRuntime = new CopilotRuntime({
  agents: {
    default: new BuiltInAgent({
      model: MODEL,
      apiKey: API_KEY,
      prompt:
        "You are the Jamot Main Manager. Help plan, delegate and track work. Delegate to searchPeople/searchAgents tools when available. Handle supplier procurement: register suppliers, review POs. High-risk actions must wait for explicit confirmation.",
      maxSteps: 5,
    }),
    builder: new BuiltInAgent({
      model: MODEL,
      apiKey: API_KEY,
      prompt:
        "You are the Jamot Agent Builder. Help users design and create agents. Ask for name, role, autonomy level (suggest/approve/autonomous), and channels. Then call createAgent.",
      maxSteps: 6,
    }),
    skills: new BuiltInAgent({
      model: MODEL,
      apiKey: API_KEY,
      prompt:
        "You are the Jamot Skill Assistant. Help users author and improve skills in Markdown. Produce FULL revised Markdown on modification requests.",
      maxSteps: 4,
    }),
  },
  a2ui: {},
});

console.log("[copilotkit] CopilotRuntime created OK");

const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
  runtime: copilotRuntime,
  endpoint: "/api/copilotkit",
});

console.log("[copilotkit] Next.js App Router endpoint bound OK");

async function handler(req: NextRequest) {
  try {
    console.log("[copilotkit] REQUEST method=", req.method, "path=", req.nextUrl.pathname);
    const result = await handleRequest(req);
    console.log("[copilotkit] RESPONSE status=", result?.status);
    return result;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[copilotkit] HANDLER ERROR:", msg);
    return new Response(
      JSON.stringify({ error: "CopilotKit error: " + msg }),
      { status: 502, headers: { "Content-Type": "application/json" } },
    );
  }
}

export const runtime = "nodejs";
export const GET = handler;
export const POST = handler;
export const OPTIONS = handler;
export const HEAD = handler;
export const PUT = handler;
export const DELETE = handler;
export const PATCH = handler;