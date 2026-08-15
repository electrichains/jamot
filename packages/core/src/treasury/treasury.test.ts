import { describe, expect, it } from "vitest";
import { createInMemoryTreasuryService } from "./memory.js";

const ORG = "00000000-0000-4000-8000-000000000001";
const ACTOR = "00000000-0000-4000-8000-000000000002";

describe("treasury service", () => {
  it("propose then approve posts a payment ledger entry", async () => {
    const svc = createInMemoryTreasuryService();
    const proposal = await svc.propose(ORG, {
      title: "Pay vendor",
      description: "monthly retainer",
      amount: 100,
      proposedByActorId: ACTOR,
    });
    expect(proposal.status).toBe("proposed");

    const approved = await svc.approve(proposal.id);
    expect(approved.status).toBe("approved");

    const ledger = await svc.ledger(ORG);
    expect(ledger).toHaveLength(1);
    expect(ledger[0]?.entryType).toBe("payment");
    expect(ledger[0]?.amount).toBe(-100);
  });

  it("addContribution posts a credit entry", async () => {
    const svc = createInMemoryTreasuryService();
    await svc.addContribution(ACTOR, ORG, "coding", 50);

    const ledger = await svc.ledger(ORG);
    expect(ledger).toHaveLength(1);
    expect(ledger[0]?.entryType).toBe("credit");
    expect(ledger[0]?.amount).toBe(50);
  });

  it("ensureAccount reuses the same account", async () => {
    const svc = createInMemoryTreasuryService();
    const a = await svc.ensureAccount(ORG);
    const b = await svc.ensureAccount(ORG, "EUR");
    expect(a).toBe(b);
  });
});
