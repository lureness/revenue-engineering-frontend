import { isValidTenantSlug, slugifyTenantName } from "@/lib/auth/onboarding";

describe("onboarding helpers", () => {
  it("normaliza nomes com acento para um slug compatível com a API", () => {
    expect(slugifyTenantName("São Paulo Growth")).toBe("sao-paulo-growth");
    expect(slugifyTenantName("  Lureness__Platform  ")).toBe(
      "lureness-platform",
    );
  });

  it("valida o formato aceito pelo backend", () => {
    expect(isValidTenantSlug("acme-platform")).toBe(true);
    expect(isValidTenantSlug("Acme")).toBe(false);
    expect(isValidTenantSlug("ab")).toBe(false);
  });
});
