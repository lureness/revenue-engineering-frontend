import { type RenderOptions, render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { PropsWithChildren, ReactElement } from "react";

function TestProviders({ children }: PropsWithChildren) {
  return children;
}

function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) {
  return render(ui, {
    wrapper: TestProviders,
    ...options,
  });
}

export * from "@testing-library/react";
export { renderWithProviders as render, userEvent };
