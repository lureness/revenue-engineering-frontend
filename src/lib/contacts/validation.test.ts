import {
  buildContactPayload,
  getContactSourceLabel,
  hasReachableContactChannel,
} from "@/lib/contacts/validation";

describe("contacts validation", () => {
  it("detecta quando existe ao menos um canal de contato", () => {
    expect(
      hasReachableContactChannel({
        email: "guilherme@basixdigital.com.br",
        phoneNumber: "",
      }),
    ).toBe(true);
    expect(
      hasReachableContactChannel({
        email: "   ",
        phoneNumber: "   ",
      }),
    ).toBe(false);
  });

  it("monta o payload limpo para a API", () => {
    expect(
      buildContactPayload({
        name: "  Guilherme Moreira  ",
        email: "  guilherme@basixdigital.com.br  ",
        phoneNumber: "  ",
        source: "manual",
      }),
    ).toEqual({
      name: "Guilherme Moreira",
      email: "guilherme@basixdigital.com.br",
      phone_number: null,
      source: "manual",
    });
  });

  it("traduz a origem do contato", () => {
    expect(getContactSourceLabel("manual")).toBe("Manual");
    expect(getContactSourceLabel("inbound")).toBe("Inbound");
  });
});
