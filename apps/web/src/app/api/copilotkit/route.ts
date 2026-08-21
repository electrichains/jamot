import { NextRequest, NextResponse } from "next/server";
import {
  BuiltInAgent,
  CopilotRuntime,
  createCopilotRuntimeHandler,
} from "@copilotkit/runtime/v2";

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
      prompt: "You are the Jamot Main Manager. Help plan, delegate and track work.",
      maxSteps: 5,
    }),
    builder: new BuiltInAgent({
      model: MODEL,
      prompt: "You are the Jamot Agent Builder. Help users design and create agents.",
      maxSteps: 6,
    }),
    skills: new BuiltInAgent({
      model: MODEL,
      prompt: "You are the Jamot Skill Assistant. Help users author Markdown skills.",
      maxSteps: 4,
    }),
  },
  a2ui: {},
});

console.log("[copilotkit] CopilotRuntime created OK");

const copilotHandler: any = null as any;
try {
  copilotHandler = createCopilotRuntimeHandler({
    runtime: copilotRuntime,
    basePath: "/api/copilotkit",
  });
  console.log("[copilotkit] Handler bound OK");
} catch (err) {
  console.error("[copilotkit] Handler creation FAILED:", err instanceof Error ? err.message : String(err));
}

async function handler(request: Request | NextRequest) {
  try {
    console.log("[copilotkit] REQUEST method=", request.method);
    if (!copilotHandler) {
      return new NextResponse(JSON.stringify({ error: "copilot not initialized" }), { status: 503 });
    }
    const result = await copilotHandler(request as NextRequest);
    console.log("[copilotkit] RESPONSE status=", result?.status);
    return result;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[copilotkit] HANDLER ERROR:", msg);
    return new NextResponse(
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
