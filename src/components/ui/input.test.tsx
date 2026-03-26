import { useState } from "react";
import userEvent from "@testing-library/user-event";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { SignupForm } from "@/components/auth/signup-form";
import { Input } from "@/components/ui/input";
import { render, screen } from "@/test/test-utils";

function ControlledInputExample() {
  const [value, setValue] = useState("");

  return (
    <Input
      aria-label="Nome"
      value={value}
      onChange={(event) => setValue(event.target.value)}
    />
  );
}

function ControlledInputInDialogExample() {
  const [value, setValue] = useState("");

  return (
    <Dialog open>
      <DialogContent>
        <Input
          aria-label="Nome em dialog"
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
      </DialogContent>
    </Dialog>
  );
}

describe("Input", () => {
  it("permite digitar espacos em campos controlados", async () => {
    const user = userEvent.setup();

    render(<ControlledInputExample />);

    const input = screen.getByRole("textbox", { name: "Nome" });
    await user.type(input, "Ana Maria");

    expect(input).toHaveValue("Ana Maria");
  });

  it("permite digitar espacos em campos controlados dentro de dialog", async () => {
    const user = userEvent.setup();

    render(<ControlledInputInDialogExample />);

    const input = screen.getByRole("textbox", { name: "Nome em dialog" });
    await user.type(input, "Ana Maria");

    expect(input).toHaveValue("Ana Maria");
  });

  it("permite digitar espacos em um formulario real da aplicacao", async () => {
    const user = userEvent.setup();

    render(<SignupForm />);

    const input = screen.getByRole("textbox", {
      name: "Nome do workspace",
    });
    await user.type(input, "Basix Digital");

    expect(input).toHaveValue("Basix Digital");
  });
});
