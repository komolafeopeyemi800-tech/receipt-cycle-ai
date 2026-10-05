import { describe, expect, it } from "vitest";
import {
  TRIAL_MAX_TRANSACTIONS,
  TRIAL_MS,
  assertCanCreateTransaction,
  assertCanEditTransaction,
  assertCanExportCsv,
  assertCanMutateBudget,
  computeSubscriptionState,
  isLifetimeProEmail,
  type UserSubDoc,
} from "./_subscriptionLogic";

const START = 1_700_000_000_000;

function user(over: Partial<UserSubDoc> = {}): UserSubDoc {
  return {
    _id: "u1" as UserSubDoc["_id"],
    _creationTime: START,
    email: "a@b.com",
    ...over,
  };
}

describe("computeSubscriptionState", () => {
  it("new user is in an active trial with all slots free", () => {
    const s = computeSubscriptionState(user(), START + 1000);
    expect(s.phase).toBe("trial");
    expect(s.trialAddsUsed).toBe(0);
    expect(s.trialAddsRemaining).toBe(TRIAL_MAX_TRANSACTIONS);
    expect(s.canCreateTransaction).toBe(true);
    expect(s.canExportCsv).toBe(false);
  });

  it("trial ends after 7 days and the account becomes view only", () => {
    const s = computeSubscriptionState(user(), START + TRIAL_MS);
    expect(s.phase).toBe("expired");
    expect(s.viewOnlyLocked).toBe(true);
    expect(s.canCreateTransaction).toBe(false);
    expect(s.canEditOrDeleteTransaction).toBe(false);
  });

  it("trial is exhausted at the transaction cap but editing still works", () => {
    const s = computeSubscriptionState(user({ trialLifetimeAdds: TRIAL_MAX_TRANSACTIONS }), START + 1000);
    expect(s.phase).toBe("trial_exhausted");
    expect(s.canCreateTransaction).toBe(false);
    expect(s.canMutateBudgets).toBe(false);
    expect(s.canEditOrDeleteTransaction).toBe(true);
  });

  it("clamps a bad trialLifetimeAdds value", () => {
    expect(computeSubscriptionState(user({ trialLifetimeAdds: 999 }), START).trialAddsUsed).toBe(
      TRIAL_MAX_TRANSACTIONS,
    );
    expect(computeSubscriptionState(user({ trialLifetimeAdds: -5 }), START).trialAddsUsed).toBe(0);
  });

  it("trialStartedAt overrides the creation time", () => {
    const s = computeSubscriptionState(user({ trialStartedAt: START + TRIAL_MS }), START + TRIAL_MS + 1000);
    expect(s.phase).toBe("trial");
  });

  it("pro is unlimited even after the trial window and cap", () => {
    const s = computeSubscriptionState(
      user({ proSubscriptionActive: true, trialLifetimeAdds: 100 }),
      START + TRIAL_MS * 10,
    );
    expect(s.phase).toBe("pro");
    expect(s.canCreateTransaction).toBe(true);
    expect(s.canExportCsv).toBe(true);
    expect(s.viewOnlyLocked).toBe(false);
  });
});

describe("assert helpers", () => {
  const expired = computeSubscriptionState(user(), START + TRIAL_MS + 1);
  const exhausted = computeSubscriptionState(user({ trialLifetimeAdds: TRIAL_MAX_TRANSACTIONS }), START);
  const pro = computeSubscriptionState(user({ proSubscriptionActive: true }), START);

  it("block creation with the right message", () => {
    expect(() => assertCanCreateTransaction(expired)).toThrow(/7-day trial ended/);
    expect(() => assertCanCreateTransaction(exhausted)).toThrow(/used all 25 trial transactions/);
    expect(() => assertCanCreateTransaction(pro)).not.toThrow();
  });

  it("block edit only after the trial window ends", () => {
    expect(() => assertCanEditTransaction(expired)).toThrow(/edit or delete/);
    expect(() => assertCanEditTransaction(exhausted)).not.toThrow();
  });

  it("allow CSV export only for pro", () => {
    expect(() => assertCanExportCsv(exhausted)).toThrow(/Pro subscribers/);
    expect(() => assertCanExportCsv(pro)).not.toThrow();
  });

  it("block budget changes when expired or exhausted", () => {
    expect(() => assertCanMutateBudget(expired)).toThrow();
    expect(() => assertCanMutateBudget(exhausted)).toThrow();
    expect(() => assertCanMutateBudget(pro)).not.toThrow();
  });
});

describe("isLifetimeProEmail", () => {
  it("matches the built-in list case-insensitively", () => {
    expect(isLifetimeProEmail("  OWNER@example.com ")).toBe(true);
    expect(isLifetimeProEmail("nobody@example.com")).toBe(false);
  });
});
