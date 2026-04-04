const DEFAULT_AUTH_REDIRECT = "/workspace/[slug]";

export function resolveSafeRedirectPath(
  redirectTo?: string | null,
  fallback = DEFAULT_AUTH_REDIRECT,
) {
  if (!redirectTo) {
    return fallback;
  }

  if (!redirectTo.startsWith("/") || redirectTo.startsWith("//")) {
    return fallback;
  }

  return redirectTo;
}
