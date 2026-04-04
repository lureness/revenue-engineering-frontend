export const PUBLIC_ONLY_AUTH_ROUTES = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
] as const;

export const PROTECTED_APP_ROUTE_PREFIXES = ["/workspace"] as const;

export function isProtectedAppRoute(pathname: string) {
  return PROTECTED_APP_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function isPublicOnlyAuthRoute(pathname: string) {
  return PUBLIC_ONLY_AUTH_ROUTES.includes(
    pathname as (typeof PUBLIC_ONLY_AUTH_ROUTES)[number],
  );
}

export function resolveAuthRedirectForPath({
  pathname,
  search = "",
  hasSession,
}: {
  pathname: string;
  search?: string;
  hasSession: boolean;
}) {
  if (isProtectedAppRoute(pathname) && !hasSession) {
    const redirectTo = `${pathname}${search}`;
    const query = new URLSearchParams({
      redirectTo,
    });

    return `/login?${query.toString()}`;
  }

  return null;
}
