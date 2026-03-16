import { type NextRequest, NextResponse } from "next/server";

import { REFRESH_TOKEN_COOKIE_NAME } from "@/lib/auth/cookies";
import { resolveAuthRedirectForPath } from "@/lib/auth/route-access";

export function proxy(request: NextRequest) {
  const redirectTo = resolveAuthRedirectForPath({
    pathname: request.nextUrl.pathname,
    search: request.nextUrl.search,
    hasSession: Boolean(request.cookies.get(REFRESH_TOKEN_COOKIE_NAME)?.value),
  });

  if (!redirectTo) {
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL(redirectTo, request.url));
}

export const config = {
  matcher: [
    "/app/:path*",
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
  ],
};
