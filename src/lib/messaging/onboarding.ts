export type ProviderSetupStep = "provider_account" | "sender" | "ready";

export function resolveProviderSetupStep(args: {
  hasProviderAccount: boolean;
  hasSender: boolean;
}): ProviderSetupStep {
  if (!args.hasProviderAccount) {
    return "provider_account";
  }

  if (!args.hasSender) {
    return "sender";
  }

  return "ready";
}
