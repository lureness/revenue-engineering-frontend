import { Button } from "@/components/ui/button";
import { render, screen } from "@/test/test-utils";

describe("Button", () => {
  it("renderiza o texto com nome acessível", () => {
    render(<Button>Salvar alterações</Button>);

    expect(
      screen.getByRole("button", { name: "Salvar alterações" }),
    ).toBeVisible();
  });
});
