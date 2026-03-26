import {
  ApiClientError,
  apiRequest,
  isUnauthorizedApiError,
} from "@/lib/api/client";
import {
  AUTH_UNAUTHORIZED_EVENT,
  type AuthUnauthorizedEventDetail,
} from "@/lib/auth/events";

describe("apiRequest", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("retorna null para respostas 204 sem corpo", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(null, {
          status: 204,
          headers: {
            "content-type": "application/json",
          },
        }),
      ),
    );

    await expect(apiRequest<void>("/auth/logout")).resolves.toBeNull();
  });

  it("retorna null para respostas json com corpo vazio", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response("", {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        }),
      ),
    );

    await expect(apiRequest<null>("/empty")).resolves.toBeNull();
  });

  it("usa o proxy interno do Next para falar com a API", async () => {
    const fetchSpy = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: {
          "content-type": "application/json",
        },
      }),
    );

    vi.stubGlobal("fetch", fetchSpy);

    await apiRequest<{ ok: boolean }>("/auth/me", {
      query: {
        include: "tenant",
      },
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/backend/auth/me?include=tenant",
      expect.objectContaining({
        credentials: "same-origin",
      }),
    );
  });

  it("dispara o evento global de unauthorized em respostas 401", async () => {
    let eventDetail: AuthUnauthorizedEventDetail | undefined;
    const listener = vi.fn((event: Event) => {
      eventDetail = (
        event as CustomEvent<AuthUnauthorizedEventDetail | undefined>
      ).detail;
    });
    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, listener);

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ detail: "invalid access token" }), {
          status: 401,
          headers: {
            "content-type": "application/json",
            "X-Request-ID": "req_401",
          },
        }),
      ),
    );

    await expect(apiRequest("/auth/me")).rejects.toThrow();
    expect(listener).toHaveBeenCalledTimes(1);
    expect(eventDetail).toEqual({
      status: 401,
      message: "invalid access token",
      requestId: "req_401",
      path: "/auth/me",
    });

    window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, listener);
  });

  it("identifica ApiClientError 401 com o helper reutilizavel", () => {
    expect(
      isUnauthorizedApiError(
        new ApiClientError({
          status: 401,
          message: "missing bearer token",
          requestId: null,
          detail: { detail: "missing bearer token" },
        }),
      ),
    ).toBe(true);

    expect(
      isUnauthorizedApiError(
        new ApiClientError({
          status: 403,
          message: "missing permission: tenant.metrics.read",
          requestId: null,
          detail: { detail: "missing permission: tenant.metrics.read" },
        }),
      ),
    ).toBe(false);
  });
});
