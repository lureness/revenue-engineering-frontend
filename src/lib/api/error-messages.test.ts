import { ApiClientError } from "@/lib/api/client";
import { formatApiErrorMessage } from "@/lib/api/error-messages";

describe("formatApiErrorMessage", () => {
  it("traduz detalhes conhecidos do backend", () => {
    const error = new ApiClientError({
      status: 401,
      message: "invalid credentials",
      requestId: "req_123",
      detail: {
        detail: "invalid credentials",
      },
    });

    expect(formatApiErrorMessage(error)).toEqual({
      title: "E-mail ou senha inválidos.",
    });
  });

  it("usa fallback por status para detalhes desconhecidos", () => {
    const error = new ApiClientError({
      status: 409,
      message: "unknown conflict",
      requestId: "req_456",
      detail: {
        detail: "unknown conflict",
      },
    });

    expect(formatApiErrorMessage(error)).toEqual({
      title: "Já existe um conflito com os dados informados.",
    });
  });

  it("permite um título de fallback customizado", () => {
    const error = new ApiClientError({
      status: 502,
      message: "provider unavailable",
      requestId: "req_789",
      detail: {
        detail: "provider unavailable",
      },
    });

    expect(
      formatApiErrorMessage(error, {
        fallbackTitle: "Não foi possível enviar o e-mail agora.",
      }),
    ).toEqual({
      title: "Não foi possível enviar o e-mail agora.",
      description: "Tente novamente em instantes.",
    });
  });
});
