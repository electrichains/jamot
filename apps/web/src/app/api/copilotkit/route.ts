import { NextRequest, NextResponse } from "next/server";

console.log("[copilotkit] ROUTE LOADED — flat structure active");

async function handler(req: Request) {
  console.log("[copilotkit] method:", req.method, "path:", new URL(req.url).pathname);
  try {
    // Return a simple 200 OK so the client knows the server is alive
    return new Response(
      JSON.stringify({ status: "ok", message: "CopilotKit endpoint ready" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[copilotkit] ERROR:", err instanceof Error ? err.message : String(err));
    return new Response(JSON.stringify({ error: "internal error" }), { status: 500 });
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
