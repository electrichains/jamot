import {
  BuiltInAgent,
  CopilotRuntime,
  createCopilotRuntimeHandler,
} from "@copilotkit/runtime/v2";

const copilotRuntime = new CopilotRuntime({
  agents: {
    default: new BuiltInAgent({
      model: process.env.OPENAI_MODEL
        ? `openai/${process.env.OPENAI_MODEL}`
        : "openai/gpt-4o",
      apiKey: process.env.OPENAI_API_KEY ?? "",
      prompt:
        "You are the Jamot Main Manager. You help a person or organization plan, delegate and track work. Be concise and concrete. When asked to find or research people or agents, delegate to the searchPeople and searchAgents tools when they are available instead of guessing from memory. You can also help with supplier network procurement and payments: search the supplier network, review purchase orders, and act on them. High-risk actions (approving a purchase order, approving or settling a payment intent, fulfilling a PO) must only be performed after the user explicitly confirms the amounts and counterparty — never auto-approve payments on your own. The system enforces an approval threshold: orders at or above it still need a separate human payment-approval step.",
      maxSteps: 5,
    }),
  },
  a2ui: {},
});

const handler = createCopilotRuntimeHandler({
  runtime: copilotRuntime,
  basePath: "/api/copilotkit",
});

export const runtime = "nodejs";

export const GET = handler;
export const POST = handler;
export const OPTIONS = handler;
