import { NextRequest, NextResponse } from "next/server";
import {
  BuiltInAgent,
  CopilotRuntime,
  createCopilotRuntimeHandler,
} from "@copilotkit/runtime/v2";

/**
 * Module-level runtime config. Resolved ONCE at startup from env vars.
 * No per-request model resolution — keeps the copilot hot path fast
 * and avoids auth failures during client-side runtime-info checks.
 */
const MODEL = process.env.OPENAI_MODEL || "openai/gpt-4o-mini";
const API_KEY = process.env.OPENAI_API_KEY ?? "";
const BASE_URL = process.env.OPENAI_BASE_URL;

// Agent prompts
const DEFAULT_PROMPT =
  "You are the Jamot Main Manager. You help plan, delegate and track work. Delegate to searchPeople/searchAgents tools when available. Handle supplier procurement: register suppliers, review POs. High-risk actions must wait for explicit confirmation.";

const BUILDER_PROMPT =
  "You are the Jamot Agent Builder. Help users design and create agents. Ask for name, role, autonomy level (suggest/approve/autonomous), and channels. Then call createAgent.";

const SKILLS_PROMPT =
  "You are the Jamot Skill Assistant. Help users author and improve skills in Markdown. Produce FULL revised Markdown on modification requests.";

// Build the LLM model — try openAI-compatible provider with custom baseURL first
let agentModel: string | any; // type compatible with what BuiltInAgent.model accepts
try {
  if (BASE_URL && API_KEY) {
    const { createOpenAI } = await import("@ai-sdk/openai");
    const provider = createOpenAI({ apiKey: API_KEY, baseURL: BASE_URL });
    const modelName = MODEL.includes("/") ? MODEL.split("/")[1] : MODEL;
    agentModel = provider(modelName);
    console.log("[copilotkit] Using LanguageModel via createOpenAI with baseURL:", BASE_URL);
  } else {
    agentModel = MODEL; // standard openai/xxx string
    console.log("[copilotkit] Using model string:", MODEL);
  }
} catch {
  agentModel = MODEL; // fall back to plain string
  console.warn("[copilotkit] Failed to construct LanguageModel, falling back to string model");
}

// Global runtime — reused across all requests
const copilotRuntimeInstance = new CopilotRuntime({
  agents: {
    default: new BuiltInAgent({
      model: agentModel,
      prompt: DEFAULT_PROMPT,
      maxSteps: 5,
    }),
    builder: new BuiltInAgent({
      model: agentModel,
      prompt: BUILDER_PROMPT,
      maxSteps: 6,
    }),
    skills: new BuiltInAgent({
      model: agentModel,
      prompt: SKILLS_PROMPT,
      maxSteps: 4,
    }),
  },
  a2ui: {},
});

const copilotHandler = createCopilotRuntimeHandler({ runtime: copilotRuntimeInstance, basePath: "/api/copilotkit" });

async function handle(req: NextRequest) {
  try {
    return copilotHandler(req);
  } catch (err) {
    console.error("[copilotkit] HANDLER ERROR:", err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: "CopilotKit handler failed" }, { status: 502 });
  }
}

export const runtime = "nodejs";
export const GET = handle;
export const POST = handle;
export const OPTIONS = handle;
export const HEAD = handle;
