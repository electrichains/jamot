import {
  BuiltInAgent,
  CopilotRuntime,
  createCopilotRuntimeHandler,
} from "@copilotkit/runtime/v2";

const copilotRuntime = new CopilotRuntime({
  agents: {
    default: new BuiltInAgent({
      model: "openai/gpt-4o",
      apiKey: process.env.OPENAI_API_KEY ?? "",
      prompt:
        "You are the Jamot Main Manager. You help a person or organization plan, delegate and track work. Be concise and concrete.",
      maxSteps: 5,
    }),
  },
});

const handler = createCopilotRuntimeHandler({
  runtime: copilotRuntime,
  basePath: "/api/copilotkit",
});

export const runtime = "nodejs";

export const GET = handler;
export const POST = handler;
export const OPTIONS = handler;
