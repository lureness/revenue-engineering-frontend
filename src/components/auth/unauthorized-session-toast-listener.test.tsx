import { act } from "react";

import { UnauthorizedSessionToastListener } from "@/components/auth/unauthorized-session-toast-listener";
import { dispatchAuthUnauthorizedEvent } from "@/lib/auth/events";
import { render, waitFor } from "@/test/test-utils";

const { usePathnameMock, useAuthMock, warningMock } = vi.hoisted(() => ({
  usePathnameMock: vi.fn(),
  useAuthMock: vi.fn(),
  warningMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: usePathnameMock,
}));

vi.mock("@/components/auth/auth-provider", () => ({
  useAuth: useAuthMock,
}));

vi.mock("sonner", () => ({
  toast: {
    warning: warningMock,
  },
}));

describe("UnauthorizedSessionToastListener", () => {
  beforeEach(() => {
    usePathnameMock.mockReset();
    useAuthMock.mockReset();
    warningMock.mockReset();
  });

  it("mostra um warning unico em rotas de workspace quando a sessao expira", async () => {
    usePathnameMock.mockReturnValue("/workspace/basixdigital");
    useAuthMock.mockReturnValue({ status: "authenticated" });

    render(<UnauthorizedSessionToastListener />);

    act(() => {
      dispatchAuthUnauthorizedEvent({
        status: 401,
        message: "invalid access token",
        requestId: "req_401",
        path: "/auth/me",
      });
      dispatchAuthUnauthorizedEvent({
        status: 401,
        message: "invalid access token",
        requestId: "req_402",
        path: "/landing-pages",
      });
    });

    await waitFor(() => {
      expect(warningMock).toHaveBeenCalledTimes(1);
    });

    expect(warningMock).toHaveBeenCalledWith("A sua sessão expirou.", {
      id: "workspace-unauthorized-session",
      description: "Entre novamente para continuar.",
    });
  });

  it("nao mostra toast em rotas publicas", async () => {
    usePathnameMock.mockReturnValue("/");
    useAuthMock.mockReturnValue({ status: "authenticated" });

    render(<UnauthorizedSessionToastListener />);

    act(() => {
      dispatchAuthUnauthorizedEvent({
        status: 401,
        message: "missing bearer token",
        requestId: "req_public",
        path: "/auth/me",
      });
    });

    await waitFor(() => {
      expect(warningMock).not.toHaveBeenCalled();
    });
  });

  it("nao mostra toast quando a sessao ja nao esta autenticada", async () => {
    usePathnameMock.mockReturnValue("/workspace/basixdigital");
    useAuthMock.mockReturnValue({ status: "unauthenticated" });

    render(<UnauthorizedSessionToastListener />);

    act(() => {
      dispatchAuthUnauthorizedEvent({
        status: 401,
        message: "missing bearer token",
        requestId: "req_workspace",
        path: "/landing-pages",
      });
    });

    await waitFor(() => {
      expect(warningMock).not.toHaveBeenCalled();
    });
  });
});
