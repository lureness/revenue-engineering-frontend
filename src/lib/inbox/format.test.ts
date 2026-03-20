import {
  getInboxChannelLabel,
  getInboxConversationDisplayName,
  getInboxConversationPreview,
  getInboxConversationStatusLabel,
  getInboxMessageDirectionLabel,
  getInboxMessageTimestamp,
} from "@/lib/inbox/format";

describe("inbox format helpers", () => {
  it("traduz canal, status e direção conhecidos", () => {
    expect(getInboxChannelLabel("whatsapp")).toBe("WhatsApp");
    expect(getInboxConversationStatusLabel("open")).toBe("Aberta");
    expect(getInboxMessageDirectionLabel("outbound")).toBe("Saída");
  });

  it("usa fallbacks de identificação e prévia quando faltam campos", () => {
    expect(
      getInboxConversationDisplayName({
        contact_name: null,
        contact_email: "contato@example.com",
        contact_phone_number: null,
      }),
    ).toBe("contato@example.com");

    expect(
      getInboxConversationPreview({
        last_message_preview: null,
        subject: "Assunto de fallback",
      } as never),
    ).toBe("Assunto de fallback");
  });

  it("escolhe o melhor timestamp disponível da mensagem", () => {
    expect(
      getInboxMessageTimestamp({
        received_at: "2026-03-20T12:00:00Z",
        sent_at: "2026-03-20T11:00:00Z",
        created_at: "2026-03-20T10:00:00Z",
      } as never),
    ).toBe("2026-03-20T12:00:00Z");
  });
});
