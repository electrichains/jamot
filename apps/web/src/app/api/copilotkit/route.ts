import { NextRequest, NextResponse } from "next/server";
import {
  BuiltInAgent,
  CopilotRuntime,
  createCopilotRuntimeHandler,
} from "@copilotkit/runtime/v2";

// --- Module-level config (runs ONCE at server startup, no per-request overhead) ---
const MODEL = process.env.OPENAI_MODEL || "openai/gpt-4o-mini";
const API_KEY = process.env.OPENAI_API_KEY ?? "";
const BASE_URL = process.env.OPENAI_BASE_URL;

console.log("[copilotkit] STARTUP model=%s keyLen=%d baseUrl=%s", MODEL, API_KEY.length, BASE_URL || "(none)");

const DEFAULT_PROMPT =
  "You are the Jamot Main Manager. Help plan, delegate and track work. Delegate to searchPeople/searchAgents tools when available.";

const BUILDER_PROMPT =
  "You are the Jamot Agent Builder. Help users design and create agents. Ask for name, role, autonomy level, and channels. Call createAgent when ready.";

const SKILLS_PROMPT =
  "You are the Jamot Skill Assistant. Help users author and improve skills in Markdown. Produce FULL revised Markdown on modification requests.";

// Set OPENAI_BASE_URL so CopilotKit's built-in openai resolver picks it up
if (BASE_URL) {
  process.env.OPENAI_BASE_URL = BASE_URL;
}

// Construct runtime using the configured model string.
// The @ai-sdk/openai provider will be invoked internally by CopilotKit
// with apiKey + baseURL set via process.env.
const copilotRuntime = new CopilotRuntime({
  agents: {
    default: new BuiltInAgent({
      model: MODEL,
      prompt: DEFAULT_PROMPT,
      maxSteps: 5,
    }),
    builder: new BuiltInAgent({
      model: MODEL,
      prompt: BUILDER_PROMPT,
      maxSteps: 6,
    }),
    skills: new BuiltInAgent({
      model: MODEL,
      prompt: SKILLS_PROMPT,
      maxSteps: 4,
    }),
  },
  a2ui: {},
});

console.log("[copilotkit] CopilotRuntime created OK");

const copilotHandler = createCopilotRuntimeHandler({
  runtime: copilotRuntime,
  basePath: "/api/copilotkit",
});
console.log("[copilotkit] Handler created — serving all methods");

async function handle(req: NextRequest) {
  try {
    return copilotHandler(req);
  } catch (err) {
    console.error("[copilotkit] HANDLER ERROR:", err instanceof Error ? err.message : String(err));
    return NextResponse.json(
      { error: "CopilotKit handler error: " + (err instanceof Error ? err.message : "unknown") },
      { status: 502 },
    );
  }
}

export const runtime = "nodejs";
export const GET = handle;
export const POST = handle;
export const OPTIONS = handle;
export const HEAD = handle;
export const PUT = handle;
export const DELETE = handle;
export const PATCH = handle;
