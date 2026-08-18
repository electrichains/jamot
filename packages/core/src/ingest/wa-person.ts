import type { Actor, Person } from "@jamot/contracts";
import type { InboundMessage } from "../channels/channel.js";

export const WHATSAPP_IDENTITY_PROVIDER = "whatsapp";

export interface IngestRepo {
  findActorByExternalIdentity(
    provider: string,
    value: string,
  ): Promise<Actor | null>;
  findPersonByActorId(actorId: string): Promise<Person | null>;
  createActor(input: {
    type: Actor["type"];
    source: Actor["source"];
    displayName: string;
    externalIdentities: Actor["externalIdentities"];
  }): Promise<Actor>;
  createPerson(input: {
    actorId: string;
    membershipSpaceIds: string[];
  }): Promise<Person>;
}

export interface WhatsAppPersonProvisioner {
  /**
   * Ensure the sender of an inbound WhatsApp message exists as an Actor +
   * Person. Idempotent: repeat messages from the same number reuse the
   * existing record and never create a duplicate account.
   */
  handleInbound(msg: InboundMessage): Promise<ProvisionResult>;
}

export interface ProvisionResult {
  actor: Actor | null;
  person: Person | null;
  created: boolean;
}

export interface WhatsAppPersonProvisionerDeps {
  repo: IngestRepo;
  /** Resolve the space a new contact should belong to from the channel. */
  spaceResolver?: (channelId: string) => Promise<string | undefined>;
}

function normalizeSender(sender: string): string {
  const normalized = sender.replace(/@.*$/, "").trim();
  return normalized.length > 0 ? normalized : "";
}

function pushName(msg: InboundMessage): string | undefined {
  const raw = msg.raw as { pushName?: unknown } | undefined;
  const name = raw?.pushName;
  return typeof name === "string" && name.trim().length > 0
    ? name.trim().slice(0, 120)
    : undefined;
}

export function createWhatsAppPersonProvisioner(
  deps: WhatsAppPersonProvisionerDeps,
): WhatsAppPersonProvisioner {
  const { repo, spaceResolver } = deps;

  return {
    async handleInbound(msg) {
      const sender = normalizeSender(msg.sender);
      if (!sender) {
        return { actor: null, person: null, created: false };
      }

      let actor = await repo.findActorByExternalIdentity(
        WHATSAPP_IDENTITY_PROVIDER,
        sender,
      );
      if (actor) {
        const person = await repo.findPersonByActorId(actor.id);
        return { actor, person, created: false };
      }

      const spaceId = await spaceResolver?.(msg.channelId);
      actor = await repo.createActor({
        type: "human",
        source: "external",
        displayName: pushName(msg) ?? sender,
        externalIdentities: [
          {
            provider: WHATSAPP_IDENTITY_PROVIDER,
            value: sender,
            verified: true,
          },
        ],
      });
      const person = await repo.createPerson({
        actorId: actor.id,
        membershipSpaceIds: spaceId ? [spaceId] : [],
      });

      return { actor, person, created: true };
    },
  };
}