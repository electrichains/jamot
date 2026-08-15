import { afterEach, describe, expect, it } from "vitest";
import { assertSafeMcpUrl } from "./ssrf.js";
import { createMcpClient } from "./client.js";

describe("assertSafeMcpUrl", () => {
  it("accepts a public https URL", () => {
    expect(() => assertSafeMcpUrl("https://mcp.example.com/mcp")).not.toThrow();
  });

  it("rejects localhost", () => {
    expect(() => assertSafeMcpUrl("http://localhost:3000/mcp")).toThrow(/loopback|host/);
  });

  it("rejects private IPv4", () => {
    expect(() => assertSafeMcpUrl("http://192.168.1.1/mcp")).toThrow(/private IPv4/);
  });

  it("rejects non-http(s) schemes", () => {
    expect(() => assertSafeMcpUrl("ftp://mcp.example.com/mcp")).toThrow(/scheme/);
  });

  it("rejects loopback IPv6", () => {
    expect(() => assertSafeMcpUrl("http://[::1]/mcp")).toThrow(/private IPv6/);
  });
});

interface CapturedCall {
  method: string;
  params?: unknown;
}

describe("createMcpClient", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("round-trips initialize/tools/list/tools/call", async () => {
    const calls: CapturedCall[] = [];

    const stub = (async (_input: unknown, init?: RequestInit): Promise<Response> => {
      const body = JSON.parse(String(init?.body)) as {
        id: number;
        method: string;
        params?: unknown;
      };
      calls.push({ method: body.method, params: body.params });

      let result: unknown = {};
      if (body.method === "tools/list") {
        result = {
          tools: [
            { name: "run", description: "run a task", inputSchema: { type: "object" } },
            { name: "ping", description: "health check" },
          ],
        };
      }
      if (body.method === "tools/call") {
        result = { content: [{ type: "text", text: "done" }] };
      }

      return new Response(
        JSON.stringify({ jsonrpc: "2.0", id: body.id, result }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    }) as typeof fetch;

    globalThis.fetch = stub;

    const client = createMcpClient("https://mcp.example.com/mcp");

    const tools = await client.listTools();
    expect(tools).toEqual([
      { name: "run", description: "run a task", inputSchema: { type: "object" } },
      { name: "ping", description: "health check", inputSchema: undefined },
    ]);

    const result = await client.callTool("run", { prompt: "hello" });
    expect(result).toEqual({ content: [{ type: "text", text: "done" }] });

    expect(calls.map((c) => c.method)).toEqual([
      "initialize",
      "tools/list",
      "tools/call",
    ]);

    expect(calls[0]?.method).toBe("initialize");
    expect(calls[0]?.params).toHaveProperty("protocolVersion");
    expect(calls[2]?.params).toEqual({ name: "run", arguments: { prompt: "hello" } });
  });

  it("surfaces JSON-RPC errors", async () => {
    const stub = (async (): Promise<Response> => {
      return new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          error: { code: -32601, message: "Method not found" },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    }) as typeof fetch;

    globalThis.fetch = stub;

    const client = createMcpClient("https://mcp.example.com/mcp");
    await expect(client.listTools()).rejects.toThrow(/Method not found/);
  });
});
