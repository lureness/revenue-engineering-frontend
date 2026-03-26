import { ProviderSetupBanner } from "@/components/messaging/provider-setup-banner";
import { render, screen } from "@/test/test-utils";

const { useAuthMock, useProviderSetupMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
  useProviderSetupMock: vi.fn(),
}));

vi.mock("@/components/auth/auth-provider", () => ({
  useAuth: useAuthMock,
}));

vi.mock("@/components/messaging/provider-setup-provider", () => ({
  useProviderSetup: useProviderSetupMock,
}));

describe("ProviderSetupBanner", () => {
  beforeEach(() => {
    useAuthMock.mockReset();
    useProviderSetupMock.mockReset();
  });

  it("mostra claramente que falta sender quando a conta Meta ja esta conectada", () => {
    useAuthMock.mockReturnValue({
      tenant: {
        slug: "basixdigital",
      },
    });
    useProviderSetupMock.mockReturnValue({
      canShow: true,
      currentStep: "sender",
      hasProviderAccount: true,
      hasSender: false,
      isLoading: false,
    });

    render(<ProviderSetupBanner />);

    expect(
      screen.getByText("Cadastre o primeiro sender do WhatsApp"),
    ).toBeInTheDocument();
    expect(screen.getByText("1/2 etapas concluídas")).toBeInTheDocument();
    expect(
      screen.getByText("Provider de mensageria conectado"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Cadastrar sender do WhatsApp"),
    ).toBeInTheDocument();
    expect(screen.getByText("Concluído")).toBeInTheDocument();
    expect(screen.getByText("Pendente")).toBeInTheDocument();
  });

  it("nao renderiza o banner quando o onboarding ja terminou", () => {
    useAuthMock.mockReturnValue({
      tenant: {
        slug: "basixdigital",
      },
    });
    useProviderSetupMock.mockReturnValue({
      canShow: false,
      currentStep: "ready",
      hasProviderAccount: true,
      hasSender: true,
      isLoading: false,
    });

    const { container } = render(<ProviderSetupBanner />);

    expect(container).toBeEmptyDOMElement();
  });
});
