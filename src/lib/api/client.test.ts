import { apiRequest } from "@/lib/api/client";

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
});
