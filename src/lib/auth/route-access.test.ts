import {
  isProtectedAppRoute,
  isPublicOnlyAuthRoute,
  resolveAuthRedirectForPath,
} from "@/lib/auth/route-access";

describe("auth route access", () => {
  it("detects protected workspace routes", () => {
    expect(isProtectedAppRoute("/app")).toBe(true);
    expect(isProtectedAppRoute("/app/user")).toBe(true);
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
        pathname: "/app/user",
        search: "?tab=password",
        hasSession: false,
      }),
    ).toBe("/login?redirectTo=%2Fapp%2Fuser%3Ftab%3Dpassword");
  });

  it("redirects authenticated users away from public-only auth routes", () => {
    expect(
      resolveAuthRedirectForPath({
        pathname: "/login",
        hasSession: true,
      }),
    ).toBe("/app");
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
