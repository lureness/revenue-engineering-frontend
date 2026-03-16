import { describe, expect, it } from "vitest";

import { shouldRedirectToProviderSetup } from "@/lib/messaging/onboarding";

describe("shouldRedirectToProviderSetup", () => {
  it("redireciona rotas internas do app que dependem do setup inicial", () => {
    expect(shouldRedirectToProviderSetup("/app")).toBe(true);
    expect(shouldRedirectToProviderSetup("/app/teams")).toBe(true);
    expect(shouldRedirectToProviderSetup("/app/rbac")).toBe(true);
  });

  it("não redireciona a área de mensageria nem conta do usuário", () => {
    expect(shouldRedirectToProviderSetup("/app/messaging")).toBe(false);
    expect(shouldRedirectToProviderSetup("/app/messaging/senders")).toBe(false);
    expect(shouldRedirectToProviderSetup("/app/contacts")).toBe(false);
    expect(shouldRedirectToProviderSetup("/app/user")).toBe(false);
  });

  it("ignora rotas públicas", () => {
    expect(shouldRedirectToProviderSetup("/login")).toBe(false);
    expect(shouldRedirectToProviderSetup("/signup")).toBe(false);
  });
});
