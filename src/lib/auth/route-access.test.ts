import {
  isProtectedAppRoute,
  isPublicOnlyAuthRoute,
  resolveAuthRedirectForPath,
} from "@/lib/auth/route-access";

describe("auth route access", () => {
  it("detects protected workspace routes", () => {
    expect(isProtectedAppRoute("/workspace/basixdigital")).toBe(true);
    expect(
      isProtectedAppRoute("/workspace/basixdigital/settings/account"),
    ).toBe(true);
    expect(isProtectedAppRoute("/login")).toBe(false);
  });

  it("detects public-only auth routes", () => {
    expect(isPublicOnlyAuthRoute("/login")).toBe(true);
    expect(isPublicOnlyAuthRoute("/reset-password")).toBe(true);
    expect(isPublicOnlyAuthRoute("/verify-email")).toBe(false);
  });

  it("redirects unauthenticated access to protected routes", () => {
    expect(
      resolveAuthRedirectForPath({
        pathname: "/workspace/basixdigital/settings/account",
        search: "?tab=password",
        hasSession: false,
      }),
    ).toBe(
      "/login?redirectTo=%2Fworkspace%2Fbasixdigital%2Fsettings%2Faccount%3Ftab%3Dpassword",
    );
  });

  it("does not redirect public auth routes only because a cookie exists", () => {
    expect(
      resolveAuthRedirectForPath({
        pathname: "/login",
        hasSession: true,
      }),
    ).toBeNull();
  });

  it("returns null when no redirect is needed", () => {
    expect(
      resolveAuthRedirectForPath({
        pathname: "/verify-email",
        hasSession: false,
      }),
    ).toBeNull();
  });
});
