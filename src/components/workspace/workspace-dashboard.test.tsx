import { WorkspaceDashboard } from "@/components/workspace/workspace-dashboard";
import { ApiClientError } from "@/lib/api/client";
import { render, screen, waitFor } from "@/test/test-utils";

const { getLandingPagesMock, getWorkspaceDashboardDataMock } = vi.hoisted(
  () => ({
    getLandingPagesMock: vi.fn(),
    getWorkspaceDashboardDataMock: vi.fn(),
  }),
);

vi.mock("@/lib/lp/api", () => ({
  getLandingPages: getLandingPagesMock,
}));

vi.mock("@/lib/workspace/api", () => ({
  getWorkspaceDashboardData: getWorkspaceDashboardDataMock,
}));

function createUnauthorizedApiError(message = "missing bearer token") {
  return new ApiClientError({
    status: 401,
    message,
    requestId: "req_401",
    detail: { detail: message },
  });
}

describe("WorkspaceDashboard", () => {
  beforeEach(() => {
    getLandingPagesMock.mockReset();
    getWorkspaceDashboardDataMock.mockReset();
  });

  it("nao exibe erro local nem faz console.error quando landing pages retorna 401", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    getWorkspaceDashboardDataMock.mockResolvedValue({
      teamsCount: 3,
      contactsCount: 12,
      agentsCount: 1,
      surveysCount: 2,
      sendersCount: 1,
      providerAccountsCount: 1,
      conversationsCount: 4,
    });
    getLandingPagesMock.mockRejectedValue(
      createUnauthorizedApiError("missing bearer token"),
    );

    render(<WorkspaceDashboard tenantSlug="basixdigital" />);

    await waitFor(() => {
      expect(screen.getByText("Times")).toBeInTheDocument();
    });

    expect(
      screen.queryByText("Não foi possível carregar os dados do workspace."),
    ).not.toBeInTheDocument();
    expect(consoleErrorSpy).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it("nao exibe erro local nem faz console.error quando o resumo do workspace retorna 401", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    getWorkspaceDashboardDataMock.mockRejectedValue(
      createUnauthorizedApiError("invalid access token"),
    );
    getLandingPagesMock.mockResolvedValue([]);

    render(<WorkspaceDashboard tenantSlug="basixdigital" />);

    await waitFor(() => {
      expect(screen.getByText("Times")).toBeInTheDocument();
    });

    expect(
      screen.queryByText("Não foi possível carregar os dados do workspace."),
    ).not.toBeInTheDocument();
    expect(consoleErrorSpy).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
});
