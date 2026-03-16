import { apiRequest } from "@/lib/api/client";
import { AUTH_UNAUTHORIZED_EVENT } from "@/lib/auth/events";

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
    const listener = vi.fn();
    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, listener);

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ detail: "invalid access token" }), {
          status: 401,
          headers: {
            "content-type": "application/json",
          },
        }),
      ),
    );

    await expect(apiRequest("/auth/me")).rejects.toThrow();
    expect(listener).toHaveBeenCalledTimes(1);

    window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, listener);
  });
});
