import type { ObservabilityDrilldownDefinitionItem } from "@/lib/observability/types";

const DOMAIN_LABELS: Record<string, string> = {
  access: "Acesso",
  auth: "Autenticação",
  messaging: "Mensageria",
  teams: "Times",
};

const DOMAIN_ORDER = ["auth", "access", "teams", "messaging"] as const;

export type ObservabilityDrilldownGroup = {
  domain: string;
  label: string;
  items: ObservabilityDrilldownDefinitionItem[];
};

export function getObservabilityDrilldownDomainLabel(domain: string) {
  return DOMAIN_LABELS[domain] ?? domain;
}

export function groupObservabilityDrilldowns(
  definitions: ObservabilityDrilldownDefinitionItem[],
) {
  const grouped = new Map<string, ObservabilityDrilldownDefinitionItem[]>();

  for (const definition of definitions) {
    const bucket = grouped.get(definition.domain) ?? [];
    bucket.push(definition);
    grouped.set(definition.domain, bucket);
  }

  return [...grouped.entries()]
    .sort(([leftDomain], [rightDomain]) => {
      const leftIndex = DOMAIN_ORDER.indexOf(
        leftDomain as (typeof DOMAIN_ORDER)[number],
      );
      const rightIndex = DOMAIN_ORDER.indexOf(
        rightDomain as (typeof DOMAIN_ORDER)[number],
      );

      if (leftIndex !== -1 || rightIndex !== -1) {
        return (
          (leftIndex === -1 ? Number.MAX_SAFE_INTEGER : leftIndex) -
          (rightIndex === -1 ? Number.MAX_SAFE_INTEGER : rightIndex)
        );
      }

      return leftDomain.localeCompare(rightDomain, "pt-BR");
    })
    .map(([domain, items]) => ({
      domain,
      label: getObservabilityDrilldownDomainLabel(domain),
      items: items.sort((left, right) =>
        left.name.localeCompare(right.name, "pt-BR"),
      ),
    })) satisfies ObservabilityDrilldownGroup[];
}
