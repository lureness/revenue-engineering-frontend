import { isValidTeamSlug, slugifyTeamName } from "@/lib/teams/validation";

describe("team validation", () => {
  it("gera slugs estáveis a partir do nome", () => {
    expect(slugifyTeamName("Suporte São Paulo")).toBe("suporte-sao-paulo");
  });

  it("valida slugs compatíveis com o backend", () => {
    expect(isValidTeamSlug("sales-ops")).toBe(true);
    expect(isValidTeamSlug("Sales Ops")).toBe(false);
    expect(isValidTeamSlug("ab")).toBe(false);
  });
});
