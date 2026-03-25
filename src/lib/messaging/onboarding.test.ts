import { describe, expect, it } from "vitest";

import { shouldRedirectToProviderSetup } from "@/lib/messaging/onboarding";

describe("shouldRedirectToProviderSetup", () => {
  it("redireciona rotas internas do app que dependem do setup inicial", () => {
    expect(shouldRedirectToProviderSetup("/workspace/basixdigital")).toBe(true);
    expect(shouldRedirectToProviderSetup("/workspace/basixdigital/teams")).toBe(
      true,
    );
    expect(
      shouldRedirectToProviderSetup("/workspace/basixdigital/settings/rbac"),
    ).toBe(true);
  });

  it("não redireciona a área de mensageria, agents e conta do usuário", () => {
    expect(
      shouldRedirectToProviderSetup("/workspace/basixdigital/inbox/messages"),
    ).toBe(false);
    expect(
      shouldRedirectToProviderSetup(
        "/workspace/basixdigital/inbox/messages/provider",
      ),
    ).toBe(false);
    expect(
      shouldRedirectToProviderSetup("/workspace/basixdigital/inbox/contacts"),
    ).toBe(false);
    expect(
      shouldRedirectToProviderSetup("/workspace/basixdigital/inbox/agents"),
    ).toBe(false);
    expect(
      shouldRedirectToProviderSetup("/workspace/basixdigital/settings/account"),
    ).toBe(false);
  });

  it("ignora rotas públicas", () => {
    expect(shouldRedirectToProviderSetup("/login")).toBe(false);
    expect(shouldRedirectToProviderSetup("/signup")).toBe(false);
  });
});
