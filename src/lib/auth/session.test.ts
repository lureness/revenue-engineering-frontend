import {
  clearAuthSession,
  getAccessTokenExpiresAt,
  isAccessTokenExpired,
  isRefreshTokenExpired,
  readAuthSession,
  writeAuthSession,
} from "@/lib/auth/session";

describe("auth session storage", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useRealTimers();
  });

  it("persiste e relê a sessão localmente", () => {
    const session = writeAuthSession({
      access_token: "access",
      refresh_token: "refresh",
      token_type: "Bearer",
      expires_in: 3600,
      refresh_expires_in: 86400,
      tenant: {
        id: "tenant-1",
        name: "Lureness",
        slug: "lureness",
      },
      user: {
        id: "user-1",
        tenant_id: "tenant-1",
        email: "owner@lureness.test",
        email_verified_at: null,
        role: "owner",
        is_active: true,
      },
    });

    expect(readAuthSession()).toEqual(session);
    clearAuthSession();
    expect(readAuthSession()).toBeNull();
  });

  it("calcula a expiração de access e refresh token", () => {
    vi.setSystemTime(new Date("2026-03-15T17:00:00.000Z"));

    const session = {
      access_token: "access",
      refresh_token: "refresh",
      token_type: "Bearer",
      expires_in: 60,
      refresh_expires_in: 120,
      tenant: {
        id: "tenant-1",
        name: "Lureness",
        slug: "lureness",
      },
      user: {
        id: "user-1",
        tenant_id: "tenant-1",
        email: "owner@lureness.test",
        email_verified_at: null,
        role: "owner",
        is_active: true,
      },
      issued_at: "2026-03-15T17:00:00.000Z",
    };

    expect(getAccessTokenExpiresAt(session)).toBe(
      Date.parse("2026-03-15T17:01:00.000Z"),
    );
    expect(isAccessTokenExpired(session)).toBe(false);
    expect(isRefreshTokenExpired(session)).toBe(false);

    vi.setSystemTime(new Date("2026-03-15T17:01:20.000Z"));

    expect(isAccessTokenExpired(session)).toBe(true);
    expect(isRefreshTokenExpired(session)).toBe(false);
  });
});
