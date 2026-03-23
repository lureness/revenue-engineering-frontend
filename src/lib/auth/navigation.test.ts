import { resolveSafeRedirectPath } from "@/lib/auth/navigation";

describe("resolveSafeRedirectPath", () => {
  it("aceita redirects internos", () => {
    expect(resolveSafeRedirectPath("/workspace/[slug]/teams")).toBe(
      "/workspace/[slug]/teams",
    );
  });

  it("ignora redirects externos ou inválidos", () => {
    expect(resolveSafeRedirectPath("https://evil.test")).toBe(
      "/workspace/[slug]",
    );
    expect(resolveSafeRedirectPath("//evil.test")).toBe("/workspace/[slug]");
    expect(resolveSafeRedirectPath("app/teams")).toBe("/workspace/[slug]");
  });

  it("redireciona do /app antigo para workspace", () => {
    expect(resolveSafeRedirectPath("/app")).toBe("/workspace/[slug]");
    expect(resolveSafeRedirectPath("/app/teams")).toBe("/workspace/[slug]");
    expect(resolveSafeRedirectPath("/app/inbox")).toBe("/workspace/[slug]");
  });
});
