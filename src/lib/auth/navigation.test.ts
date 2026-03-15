import { resolveSafeRedirectPath } from "@/lib/auth/navigation";

describe("resolveSafeRedirectPath", () => {
  it("aceita redirects internos", () => {
    expect(resolveSafeRedirectPath("/app/teams")).toBe("/app/teams");
  });

  it("ignora redirects externos ou inválidos", () => {
    expect(resolveSafeRedirectPath("https://evil.test")).toBe("/app");
    expect(resolveSafeRedirectPath("//evil.test")).toBe("/app");
    expect(resolveSafeRedirectPath("app/teams")).toBe("/app");
  });
});
