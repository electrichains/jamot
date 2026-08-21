import { describe, expect, it, beforeAll } from "vitest";
import type { LightMyRequestResponse } from "fastify";
import { buildApp } from "./app.js";
import { createMemoryRepository } from "./repository.js";

function sessionCookie(res: LightMyRequestResponse): string {
  const raw = res.headers["set-cookie"];
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value ? (value.split(";")[0] ?? "") : "";
}

async function makeApp() {
  return buildApp({ repository: createMemoryRepository(), secret: "test" });
}

type App = Awaited<ReturnType<typeof makeApp>>;

async function registerAndLogin(
  app: App,
  email: string,
  password: string,
  displayName: string,
): Promise<string> {
  await app.inject({
    method: "POST",
    url: "/api/people",
    payload: { email, password, displayName },
  });
  const login = await app.inject({
    method: "POST",
    url: "/api/auth/login",
    payload: { email, password },
  });
  return sessionCookie(login);
}

describe("models smoke", () => {
  let app: App;
  let owner: string;
  let admin: string;
  let member: string;
  let stranger: string;
  let orgId: string;

  beforeAll(async () => {
    app = await makeApp();
    owner = await registerAndLogin(app, "owner@example.com", "password123", "Owner");
    admin = await registerAndLogin(app, "admin@example.com", "password123", "Admin");
    member = await registerAndLogin(app, "member@example.com", "password123", "Member");
    stranger = await registerAndLogin(app, "stranger@example.com", "password123", "Stranger");

    const created = await app.inject({
      method: "POST",
      url: "/api/organizations",
      headers: { cookie: owner },
      payload: { name: "Acme", dream: "sell widgets" },
    });
    orgId = created.json().organization.id;

    await app.inject({
      method: "POST",
      url: `/api/organizations/${orgId}/members`,
      headers: { cookie: owner },
      payload: { email: "admin@example.com", role: "admin" },
    });
    await app.inject({
      method: "POST",
      url: `/api/organizations/${orgId}/members`,
      headers: { cookie: owner },
      payload: { email: "member@example.com", role: "member" },
    });
  });

  it("unauthenticated requests are rejected with 401", async () => {
    const get = await app.inject({ method: "GET", url: "/api/models" });
    const put = await app.inject({
      method: "PUT",
      url: "/api/models",
      payload: { provider: "openai", apiKey: "sk-x" },
    });
    const del = await app.inject({
      method: "DELETE",
      url: "/api/models?provider=openai",
    });
    expect(get.statusCode).toBe(401);
    expect(put.statusCode).toBe(401);
    expect(del.statusCode).toBe(401);
  });

  it("personal scope: put, masked read, secret read, delete", async () => {
    const put = await app.inject({
      method: "PUT",
      url: "/api/models",
      headers: { cookie: owner },
      payload: { provider: "openai", apiKey: "sk-test-123" },
    });
    expect(put.statusCode).toBe(200);
    expect(put.json()).toMatchObject({ status: "ok", provider: "openai", scope: "user" });

    const masked = await app.inject({
      method: "GET",
      url: "/api/models",
      headers: { cookie: owner },
    });
    expect(masked.statusCode).toBe(200);
    expect(masked.json().user.openai.configured).toBe(true);
    expect(masked.json().user.openai.apiKey).toBeUndefined();

    const secret = await app.inject({
      method: "GET",
      url: "/api/models?includeSecret=true",
      headers: { cookie: owner },
    });
    expect(secret.json().user.openai.apiKey).toBe("sk-test-123");

    const update = await app.inject({
      method: "PUT",
      url: "/api/models",
      headers: { cookie: owner },
      payload: { provider: "openai", baseUrl: "https://gateway.example/v1", model: "gpt-4o-mini" },
    });
    expect(update.statusCode).toBe(200);
    const after = await app.inject({
      method: "GET",
      url: "/api/models",
      headers: { cookie: owner },
    });
    expect(after.json().user.openai.baseUrl).toBe("https://gateway.example/v1");
    expect(after.json().user.openai.model).toBe("gpt-4o-mini");

    const del = await app.inject({
      method: "DELETE",
      url: "/api/models?provider=openai",
      headers: { cookie: owner },
    });
    expect(del.statusCode).toBe(200);
    expect(del.json()).toMatchObject({ status: "ok", scope: "user" });

    const gone = await app.inject({
      method: "GET",
      url: "/api/models",
      headers: { cookie: owner },
    });
    expect(gone.json().user.openai.configured).toBe(false);
  });

  it("personal scope validation", async () => {
    const noKey = await app.inject({
      method: "PUT",
      url: "/api/models",
      headers: { cookie: owner },
      payload: { provider: "anthropic" },
    });
    expect(noKey.statusCode).toBe(400);

    const badProvider = await app.inject({
      method: "PUT",
      url: "/api/models",
      headers: { cookie: owner },
      payload: { provider: "bogus", apiKey: "x" },
    });
    expect(badProvider.statusCode).toBe(400);

    const noProvider = await app.inject({
      method: "DELETE",
      url: "/api/models",
      headers: { cookie: owner },
    });
    expect(noProvider.statusCode).toBe(400);
  });

  it("isolation: other users and other orgs do not see a config", async () => {
    await app.inject({
      method: "PUT",
      url: "/api/models",
      headers: { cookie: owner },
      payload: { provider: "openai", apiKey: "sk-owner-personal" },
    });

    const otherUser = await app.inject({
      method: "GET",
      url: "/api/models",
      headers: { cookie: member },
    });
    expect(otherUser.json().user.openai.configured).toBe(false);

    const otherOrg = await app.inject({
      method: "GET",
      url: `/api/models?organizationId=${orgId}&includeSecret=true`,
      headers: { cookie: stranger },
    });
    expect(otherOrg.json().organization.openai.configured).toBe(false);
  });

  it("org scope: owner/admin may write; member/stranger get 403", async () => {
    const byMember = await app.inject({
      method: "PUT",
      url: "/api/models",
      headers: { cookie: member },
      payload: { provider: "openai", apiKey: "sk-org", organizationId: orgId },
    });
    expect(byMember.statusCode).toBe(403);

    const byStranger = await app.inject({
      method: "PUT",
      url: "/api/models",
      headers: { cookie: stranger },
      payload: { provider: "openai", apiKey: "sk-org", organizationId: orgId },
    });
    expect(byStranger.statusCode).toBe(403);

    const byOwner = await app.inject({
      method: "PUT",
      url: "/api/models",
      headers: { cookie: owner },
      payload: { provider: "openai", apiKey: "sk-org", organizationId: orgId },
    });
    expect(byOwner.statusCode).toBe(200);
    expect(byOwner.json()).toMatchObject({ scope: "organization" });
  });

  it("org secret readable by any member; gated for strangers", async () => {
    const byMember = await app.inject({
      method: "GET",
      url: `/api/models?organizationId=${orgId}&includeSecret=true`,
      headers: { cookie: member },
    });
    expect(byMember.statusCode).toBe(200);
    expect(byMember.json().organization.openai.configured).toBe(true);
    expect(byMember.json().organization.openai.apiKey).toBe("sk-org");

    const byStranger = await app.inject({
      method: "GET",
      url: `/api/models?organizationId=${orgId}&includeSecret=true`,
      headers: { cookie: stranger },
    });
    expect(byStranger.json().organization.openai.configured).toBe(true);
    expect(byStranger.json().organization.openai.apiKey).toBeUndefined();
  });

  it("org write to a nonexistent org returns 404", async () => {
    const res = await app.inject({
      method: "PUT",
      url: "/api/models",
      headers: { cookie: owner },
      payload: { provider: "openai", apiKey: "sk-x", organizationId: "org_does_not_exist" },
    });
    expect(res.statusCode).toBe(404);
  });

  it("org delete by owner clears the org config", async () => {
    const del = await app.inject({
      method: "DELETE",
      url: `/api/models?provider=openai&organizationId=${orgId}`,
      headers: { cookie: owner },
    });
    expect(del.statusCode).toBe(200);
    expect(del.json()).toMatchObject({ scope: "organization" });

    const after = await app.inject({
      method: "GET",
      url: `/api/models?organizationId=${orgId}`,
      headers: { cookie: owner },
    });
    expect(after.json().organization.openai.configured).toBe(false);
  });

  it("anthropic provider works in personal scope", async () => {
    const put = await app.inject({
      method: "PUT",
      url: "/api/models",
      headers: { cookie: admin },
      payload: { provider: "anthropic", apiKey: "ant-test-xyz" },
    });
    expect(put.statusCode).toBe(200);

    const secret = await app.inject({
      method: "GET",
      url: "/api/models?includeSecret=true",
      headers: { cookie: admin },
    });
    expect(secret.json().user.anthropic.configured).toBe(true);
    expect(secret.json().user.anthropic.apiKey).toBe("ant-test-xyz");
  });
});
