import { describe, expect, it } from "vitest";

import {
  getObservabilityDrilldownDomainLabel,
  groupObservabilityDrilldowns,
} from "@/lib/observability/drilldowns";
import type { ObservabilityDrilldownDefinitionItem } from "@/lib/observability/types";

const definitions: ObservabilityDrilldownDefinitionItem[] = [
  {
    code: "messaging.sender",
    domain: "messaging",
    name: "Sender do WhatsApp",
    description: "",
    entity_type: "whatsapp_sender",
    path_template: "",
  },
  {
    code: "auth.user",
    domain: "auth",
    name: "Usuário de autenticação",
    description: "",
    entity_type: "user",
    path_template: "",
  },
  {
    code: "teams.team",
    domain: "teams",
    name: "Time",
    description: "",
    entity_type: "team",
    path_template: "",
  },
  {
    code: "messaging.provider_account",
    domain: "messaging",
    name: "Conta de provedor",
    description: "",
    entity_type: "provider_account",
    path_template: "",
  },
];

describe("observability drilldowns", () => {
  it("agrupa por domínio e respeita a ordem principal da aplicação", () => {
    expect(groupObservabilityDrilldowns(definitions)).toEqual([
      {
        domain: "auth",
        label: "Autenticação",
        items: [definitions[1]],
      },
      {
        domain: "teams",
        label: "Times",
        items: [definitions[2]],
      },
      {
        domain: "messaging",
        label: "Mensageria",
        items: [definitions[3], definitions[0]],
      },
    ]);
  });

  it("resolve o rótulo amigável do domínio", () => {
    expect(getObservabilityDrilldownDomainLabel("access")).toBe("Acesso");
    expect(getObservabilityDrilldownDomainLabel("custom")).toBe("custom");
  });
});
