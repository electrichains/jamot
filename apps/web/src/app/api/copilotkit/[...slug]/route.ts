import { NextRequest } from "next/server";
import {
  BuiltInAgent,
  CopilotRuntime,
  createCopilotRuntimeHandler,
} from "@copilotkit/runtime/v2";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

const DEFAULT_PROMPT =
  "You are the Jamot Main Manager. You help a person or organization plan, delegate and track work. Be concise and concrete. When asked to find or research people or agents, delegate to the searchPeople and searchAgents tools when they are available instead of guessing from memory. You can also help with supplier network procurement and payments: register suppliers, search the supplier network, review purchase orders, and act on them. When adding a supplier, resolve the person or agent first with searchPeople or searchAgents to get its actorId (never invent one) and confirm the supplier's name with the user before registering. High-risk actions (approving a purchase order, approving or settling a payment intent, fulfilling a PO) must only be performed after the user explicitly confirms the amounts and counterparty — never auto-approve payments on your own. The system enforces an approval threshold: orders at or above it still need a separate human payment-approval step.\n\nThe app pushes a context entry named 'active Jamot workspace/organization the user is operating in' with spaceId, organizationId, workspaceId, spaceName and kind. Treat that as the tenant boundary: scope all people, agents, tasks, memory, knowledge, products, purchase orders, payment intents, WhatsApp channels and other data operations to that workspace (spaceId) and organization (organizationId). Do not mix data across workspaces or organizations. When the user references 'this org', 'our workspace', or the active space, use the values from that context entry. If the context is missing or kind is 'personal', operate in the user's personal space.\n\nActor mentions: when the user tags a person or agent, the chat input embeds the resolved actor reference directly in the message using the format @Name(actor:<actorId>) — e.g. @Alice Chen(actor:u_abc123). This actorId is authoritative and already resolved by the app; do not invent, guess, or re-derive it. When an action needs a specific person or agent, read the actorId straight from the mention token and use it as the actorId for tools like searchPeople, searchAgents, or supplier registration. If no actorId is embedded for a referenced name, only then resolve it via searchPeople/searchAgents. Never fabricate an actorId.\n\nLead generation: you can generate and enrich B2B leads. When the user describes a research (a target persona and a map area), use createLeadList to turn it into a Lead List and then runLeadGeneration to collect leads from a provider (Apollo, Composio, or MCP). The Leads workspace pushes a context entry named 'active lead research selection' containing the drawn map area and persona prefill — when the user says 'this area' or 'the area I drew', use that entry's area rather than guessing a location. Parse the user's natural language into the persona fields (titles, seniority, functions, industries, companySizes, keywords). Name the Lead List after the research (e.g. 'Paris fintech CTOs'). Default to the 'apollo' provider, but confirm the provider when more than one is configured. Generated leads are written into Jamot People under the Lead List; use getLeadListLeads to report them. Always run generation against real provider data — never fabricate emails, names, or contact details. Use enrichLead to fill in missing firmographics only when the user asks or a lead clearly lacks contact info.";

const BUILDER_PROMPT =
  "You are the Jamot Agent Builder. Your only job is to help the user design and create a new agent through a short, friendly conversation. Start by asking the user to describe, in their own words, what kind of agent they want to build and what it should do. Then ask up to a few targeted follow-up questions to nail down: (1) a clear name, (2) the agent's role or purpose in one sentence, (3) the desired autonomy level — one of 'suggest', 'approve' or 'autonomous' — and (4) which channels it should use (WhatsApp, Telegram, Email, Slack) if any.\n\nWhen you have enough detail, confirm the plan with the user in one or two lines, then call the createAgent tool with name, role (the purpose), autonomy and availability (default 'available'). Do not invent an ownerId — the tool fills it in. The app pushes a context entry named 'active Jamot workspace/organization the user is operating in' with spaceId, organizationId, workspaceId, spaceName and kind; when the context kind is 'organization', pass its organizationId so the agent is created in the right organization. After the tool succeeds, tell the user the agent was created and that they will be taken to the editor to refine it. Keep responses concise and friendly, and never create an agent until the user has confirmed the intent.";

const SKILLS_PROMPT =
  "You are the Jamot Skill Assistant. The user is authoring a Jamot Skill in Markdown — the Markdown document is the source of truth for the skill. Help them improve, complete, simplify or safety-check the skill. Good skills state a clear purpose, inputs, step-by-step process, constraints (what the skill must never do), and the expected output. When the user asks for a modification ('improve this', 'make it safer', 'add an approval step', 'make it work with WhatsApp', 'check whether this is complete'), produce the FULL revised Markdown and call the applySkillSuggestion tool with the complete proposed Markdown plus a one-line summary of what changed. NEVER claim you saved or applied anything: your suggestion is only staged for preview, and the user decides whether to accept it. If the user just asks a question about the skill, answer concisely without calling the tool.";

const OPENAI_MODEL = process.env.OPENAI_MODEL
  ? `openai/${process.env.OPENAI_MODEL}`
  : "openai/gpt-4o";

interface ModelConfig {
  configured?: boolean;
  apiKey?: string;
  baseUrl?: string | null;
  model?: string | null;
}

async function resolveChatModel(req: NextRequest): Promise<{ model: string; apiKey: string } | null> {
  const orgId = req.cookies.get("jamot_active_org")?.value;
  const cookieHeader = req.headers.get("cookie") ?? "";
  if (!cookieHeader) return null;

  const url = new URL(`${API_URL}/api/models`);
  if (orgId) url.searchParams.set("organizationId", orgId);
  url.searchParams.set("includeSecret", "true");

  try {
    const res = await fetch(url.toString(), {
      headers: { cookie: cookieHeader },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      user?: { openai?: ModelConfig; anthropic?: ModelConfig };
      organization?: { openai?: ModelConfig; anthropic?: ModelConfig } | null;
    };

    const pickOpenAI =
      (orgId && data.organization?.openai?.configured ? data.organization.openai : null) ??
      (data.user?.openai?.configured ? data.user.openai : null);
    const pickAnthropic =
      (orgId && data.organization?.anthropic?.configured ? data.organization.anthropic : null) ??
      (data.user?.anthropic?.configured ? data.user.anthropic : null);

    const chosen = pickOpenAI ?? pickAnthropic;
    if (!chosen?.apiKey) return null;

    const kind = pickOpenAI ? "openai" : "anthropic";
    const modelName =
      chosen.model ||
      (kind === "openai" ? process.env.OPENAI_MODEL || "gpt-4o" : "claude-3-5-sonnet-latest");
    return { model: `${kind}/${modelName}`, apiKey: chosen.apiKey };
  } catch {
    return null;
  }
}

async function buildHandler(req: NextRequest) {
  const resolved = await resolveChatModel(req);
  const apiKey = resolved?.apiKey ?? process.env.OPENAI_API_KEY ?? "";
  const model = resolved?.model ?? OPENAI_MODEL;

  const runtime = new CopilotRuntime({
    agents: {
      default: new BuiltInAgent({
        model,
        apiKey,
        prompt: DEFAULT_PROMPT,
        maxSteps: 5,
      }),
      builder: new BuiltInAgent({
        model,
        apiKey,
        prompt: BUILDER_PROMPT,
        maxSteps: 6,
      }),
      skills: new BuiltInAgent({
        model,
        apiKey,
        prompt: SKILLS_PROMPT,
        maxSteps: 4,
      }),
    },
    a2ui: {},
  });

  return createCopilotRuntimeHandler({
    runtime,
    basePath: "/api/copilotkit",
  });
}

export const runtime = "nodejs";

async function handle(req: NextRequest) {
  const handler = await buildHandler(req);
  return handler(req);
}

export const GET = handle;
export const POST = handle;
export const OPTIONS = handle;
