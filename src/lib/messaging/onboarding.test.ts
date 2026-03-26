import { describe, expect, it } from "vitest";

import { resolveProviderSetupStep } from "@/lib/messaging/onboarding";

describe("resolveProviderSetupStep", () => {
  it("prioriza a criacao da conta de provedor quando ela ainda nao existe", () => {
    expect(
      resolveProviderSetupStep({
        hasProviderAccount: false,
        hasSender: false,
      }),
    ).toBe("provider_account");
  });

  it("avanca para sender quando a conta de provedor ja existe", () => {
    expect(
      resolveProviderSetupStep({
        hasProviderAccount: true,
        hasSender: false,
      }),
    ).toBe("sender");
  });

  it("marca o setup como pronto quando conta e sender ja existem", () => {
    expect(
      resolveProviderSetupStep({
        hasProviderAccount: true,
        hasSender: true,
      }),
    ).toBe("ready");
  });
});
