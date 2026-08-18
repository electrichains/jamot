import { describe, expect, it } from "vitest";
import type { Actor, Id, Person } from "@jamot/contracts";
import type { InboundMessage } from "../channels/channel.js";
import {
  createWhatsAppPersonProvisioner,
  WHATSAPP_IDENTITY_PROVIDER,
  type IngestRepo,
} from "./wa-person.js";

const SPACE = "00000000-0000-4000-8000-000000000001" as Id;

function actor(id: string, displayName: string, sender: string): Actor {
  return {
    id: id as Id,
    type: "human",
    source: "external",
    displayName,
    status: "active",
    externalIdentities: [
      { provider: WHATSAPP_IDENTITY_PROVIDER, value: sender, verified: true },
    ],
    personalSpaceId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function person(actorId: string): Person {
  return {
    id: "00000000-0000-4000-8000-000000000099" as Id,
    actorId: actorId as Id,
    email: null,
    profile: { selfDescribed: {}, integral: {}, skills: [], preferences: {}, goals: [] },
    membershipSpaceIds: [SPACE],
    reputation: {},
  };
}

function msg(overrides: Partial<InboundMessage> = {}): InboundMessage {
  return {
    channelId: "acct-1",
    kind: "whatsapp",
    sender: "16508665016",
    text: "hi",
    timestamp: "2026-08-19T00:00:00.000Z",
    ...overrides,
  };
}

function fakeRepo(init: { actors?: Actor[]; people?: Person[] } = {}): IngestRepo {
  const actors = new Map<string, Actor>((init.actors ?? []).map((a) => [a.id, a]));
  const people = new Map<string, Person>((init.people ?? []).map((p) => [p.actorId, p]));
  return {
    async findActorByExternalIdentity(provider, value) {
      for (const a of actors.values()) {
        if (a.externalIdentities.some((i) => i.provider === provider && i.value === value)) {
          return a;
        }
      }
      return null;
    },
    async findPersonByActorId(actorId) {
      return people.get(actorId) ?? null;
    },
    async createActor(input) {
      const a = actor("new-actor", input.displayName, input.externalIdentities[0]!.value);
      actors.set(a.id, a);
      return a;
    },
    async createPerson(input) {
      const p = {
        ...person(input.actorId),
        membershipSpaceIds: input.membershipSpaceIds as Id[],
      };
      people.set(input.actorId, p);
      return p;
    },
  };
}

describe("whatsapp person provisioner", () => {
  it("creates an actor + person for a new sender", async () => {
    const repo = fakeRepo();
    const provisioner = createWhatsAppPersonProvisioner({
      repo,
      spaceResolver: async () => SPACE,
    });

    const result = await provisioner.handleInbound(msg());

    expect(result.created).toBe(true);
    expect(result.actor).toMatchObject({
      type: "human",
      source: "external",
      displayName: "16508665016",
      externalIdentities: [
        { provider: "whatsapp", value: "16508665016", verified: true },
      ],
    });
    expect(result.person?.membershipSpaceIds).toEqual([SPACE]);
  });

  it("reuses an existing actor and never creates a duplicate", async () => {
    const existing = actor("existing-actor", "Existing", "16508665016");
    const repo = fakeRepo({ actors: [existing], people: [person("existing-actor")] });
    const provisioner = createWhatsAppPersonProvisioner({ repo });

    const result = await provisioner.handleInbound(msg());

    expect(result.created).toBe(false);
    expect(result.actor?.id).toBe("existing-actor");
    expect(result.person?.actorId).toBe("existing-actor");
  });

  it("uses the WhatsApp push name as the display name", async () => {
    const repo = fakeRepo();
    const provisioner = createWhatsAppPersonProvisioner({ repo });

    const result = await provisioner.handleInbound(
      msg({ raw: { pushName: "Jane Doe" } }),
    );

    expect(result.actor?.displayName).toBe("Jane Doe");
  });

  it("falls back to no space membership when the space cannot be resolved", async () => {
    const repo = fakeRepo();
    const provisioner = createWhatsAppPersonProvisioner({
      repo,
      spaceResolver: async () => undefined,
    });

    const result = await provisioner.handleInbound(msg());

    expect(result.person?.membershipSpaceIds).toEqual([]);
  });

  it("normalizes jid-suffixed senders", async () => {
    const repo = fakeRepo();
    const provisioner = createWhatsAppPersonProvisioner({ repo });

    const result = await provisioner.handleInbound(
      msg({ sender: "16508665016@s.whatsapp.net" }),
    );

    expect(result.actor?.externalIdentities[0]?.value).toBe("16508665016");
  });

  it("skips empty senders", async () => {
    const repo = fakeRepo();
    const provisioner = createWhatsAppPersonProvisioner({ repo });

    const result = await provisioner.handleInbound(msg({ sender: "" }));

    expect(result).toEqual({ actor: null, person: null, created: false });
  });
});