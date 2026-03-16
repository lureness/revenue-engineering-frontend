import { describe, expect, it } from "vitest";

import {
  getMessageCounterpartyLabel,
  getProviderAccountDisplayName,
  getProviderStatusLabel,
  getSenderDisplayName,
  getSenderStatusLabel,
} from "@/lib/messaging/format";
import type {
  ProviderAccountItem,
  WhatsAppSenderItem,
} from "@/lib/messaging/types";

const PROVIDER_ACCOUNT: ProviderAccountItem = {
  id: "provider-1",
  tenant_id: "tenant-1",
  created_by_user_id: "user-1",
  provider: "twilio",
  mode: "managed",
  status: "active",
  account_sid: "AC123",
  api_key_sid: "SK123",
  secret_ref: "secret-ref",
  configuration: {
    friendly_name: "Basix Twilio",
  },
  created_at: "2026-03-16T10:00:00Z",
  updated_at: "2026-03-16T10:00:00Z",
};

const WHATSAPP_SENDER: WhatsAppSenderItem = {
  id: "sender-1",
  tenant_id: "tenant-1",
  provider_account_id: "provider-1",
  created_by_user_id: "user-1",
  sender_sid: null,
  sender_id: "whatsapp:+5511999999999",
  phone_number: "+5511999999999",
  messaging_service_sid: null,
  waba_id: null,
  display_name: "Basix Operação",
  status: "pending_verification",
  is_default: true,
  configuration: null,
  verified_at: null,
  last_inbound_at: null,
  last_outbound_at: null,
  created_at: "2026-03-16T10:00:00Z",
  updated_at: "2026-03-16T10:00:00Z",
};

describe("messaging format helpers", () => {
  it("uses provider friendly name when available", () => {
    expect(getProviderAccountDisplayName(PROVIDER_ACCOUNT)).toBe(
      "Basix Twilio",
    );
  });

  it("formats provider and sender status labels", () => {
    expect(getProviderStatusLabel("active")).toBe("Ativa");
    expect(getSenderStatusLabel("pending_verification")).toBe(
      "Aguardando verificação",
    );
  });

  it("returns sender display name with fallback", () => {
    expect(getSenderDisplayName(WHATSAPP_SENDER)).toBe("Basix Operação");
    expect(
      getSenderDisplayName({ ...WHATSAPP_SENDER, display_name: null }),
    ).toBe("+5511999999999");
  });

  it("formats message counterparty by direction", () => {
    expect(
      getMessageCounterpartyLabel({
        direction: "inbound",
        sender: "+5511000000000",
        recipient: "whatsapp:+5511999999999",
      }),
    ).toBe("+5511000000000");

    expect(
      getMessageCounterpartyLabel({
        direction: "outbound",
        sender: "whatsapp:+5511999999999",
        recipient: "+5511000000000",
      }),
    ).toBe("+5511000000000");
  });
});
