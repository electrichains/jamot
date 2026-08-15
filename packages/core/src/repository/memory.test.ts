import { describe, expect, it } from "vitest";
import { createMemoryRepository } from "./memory.js";

const UUID = "00000000-0000-4000-8000-000000000001";

function provenance() {
  const ts = new Date().toISOString();
  return { source: "self_declared" as const, confidence: 0.8, createdAt: ts, updatedAt: ts };
}

describe("memory repository", () => {
  it("CRUDs connectors", async () => {
    const repo = createMemoryRepository();

    const created = await repo.createConnector({
      provider: "github",
      type: "data",
      ownerActorId: UUID,
      credentialRef: { ref: "gh-pat", scope: "system" },
    });

    expect(created.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
    expect(created.status).toBe("disconnected");
    expect(created.credentialRef).toEqual({ ref: "gh-pat", scope: "system" });

    const fetched = await repo.getConnector(created.id);
    expect(fetched).toEqual(created);

    const listed = await repo.listConnectors();
    expect(listed).toHaveLength(1);
    expect(await repo.listConnectors({ ownerOrganizationId: UUID })).toHaveLength(0);

    const updated = await repo.updateConnectorStatus(created.id, "connected");
    expect(updated?.status).toBe("connected");
    expect(await repo.getConnector(created.id)).toEqual(updated);
  });

  it("CRUDs capabilities with a space filter", async () => {
    const repo = createMemoryRepository();
    const spaceId = UUID;

    const created = await repo.createCapability({
      name: "customer.whatsapp.reply",
      skillId: UUID,
      connectorId: UUID,
      spaceId,
    });

    expect(created.name).toBe("customer.whatsapp.reply");
    expect(created.policyIds).toEqual([]);

    expect(await repo.getCapability(created.id)).toEqual(created);
    expect(await repo.listCapabilities({ spaceId })).toHaveLength(1);
    expect(await repo.listCapabilities()).toHaveLength(1);
    expect(await repo.listCapabilities({ spaceId: "00000000-0000-4000-8000-0000000000ff" })).toHaveLength(0);
  });

  it("CRUDs skills with provenance", async () => {
    const repo = createMemoryRepository();

    const created = await repo.createSkill({
      ownerActorId: UUID,
      name: "summarize",
      description: "summarize a document",
      provenance: provenance(),
    });

    expect(created.name).toBe("summarize");
    expect(created.status).toBe("draft");
    expect(created.provenance.source).toBe("self_declared");
    expect(created.prerequisites).toEqual([]);

    expect(await repo.getSkill(created.id)).toEqual(created);
    expect(await repo.listSkills()).toHaveLength(1);
    expect(await repo.listSkills({ ownerOrganizationId: UUID })).toHaveLength(0);
  });

  it("CRUDs policies with defaults", async () => {
    const repo = createMemoryRepository();
    const spaceId = UUID;

    const created = await repo.createPolicy({
      spaceId,
      name: "deny-external-writes",
      capability: "customer.*",
      decision: "deny",
    });

    expect(created.resource).toBe("*");
    expect(created.minRole).toBeNull();
    expect(created.riskThreshold).toBe(0.5);
    expect(created.decision).toBe("deny");

    expect(await repo.listPolicies({ spaceId })).toEqual([created]);
    expect(await repo.listPolicies()).toEqual([created]);
    expect(await repo.listPolicies({ spaceId: "00000000-0000-4000-8000-0000000000ff" })).toEqual([]);
  });

  it("stores and removes secrets by ref", async () => {
    const repo = createMemoryRepository();

    await repo.putSecret({
      ref: "stripe-key",
      scope: "organization",
      ownerOrganizationId: UUID,
      ciphertext: "cipher",
    });

    const secret = await repo.getSecret("stripe-key");
    expect(secret?.ciphertext).toBe("cipher");
    expect(secret?.scope).toBe("organization");

    await repo.deleteSecret("stripe-key");
    expect(await repo.getSecret("stripe-key")).toBeNull();
  });
});
