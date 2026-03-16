import { describe, expect, it } from "vitest";

import {
  getContactSourceLabel,
  hasReachableContactChannel,
} from "@/lib/contacts/utils";

describe("contacts utils", () => {
  it("traduz a origem do contato", () => {
    expect(getContactSourceLabel("manual")).toBe("Manual");
    expect(getContactSourceLabel("import")).toBe("Importação");
    expect(getContactSourceLabel("inbound")).toBe("Inbound");
    expect(getContactSourceLabel("api")).toBe("API");
  });

  it("detecta se existe canal de contato válido", () => {
    expect(hasReachableContactChannel("ana@empresa.com", null)).toBe(true);
    expect(hasReachableContactChannel(null, "+5511999999999")).toBe(true);
    expect(hasReachableContactChannel("   ", "\n")).toBe(false);
  });
});
