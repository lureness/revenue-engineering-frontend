import { describe, expect, it } from "vitest";

import { isValidEmail, isValidPasswordLength } from "@/lib/auth/validation";

describe("auth validation", () => {
  it("accepts valid email formats", () => {
    expect(isValidEmail("owner@empresa.com")).toBe(true);
  });

  it("rejects invalid email formats", () => {
    expect(isValidEmail("owner")).toBe(false);
  });

  it("requires at least eight characters for passwords", () => {
    expect(isValidPasswordLength("1234567")).toBe(false);
    expect(isValidPasswordLength("12345678")).toBe(true);
  });
});
