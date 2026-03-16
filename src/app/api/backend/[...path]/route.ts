import { type NextRequest, NextResponse } from "next/server";

import {
  ACCESS_TOKEN_COOKIE_NAME,
  type AuthCookiePayload,
  clearAuthCookies,
  REFRESH_TOKEN_COOKIE_NAME,
  writeAuthCookies,
} from "@/lib/auth/cookies";
import { serverEnv } from "@/lib/env.server";

const LOGIN_ROUTE = "/auth/login";
const LOGOUT_ROUTE = "/auth/logout";
const REFRESH_ROUTE = "/auth/refresh";
const CHANGE_PASSWORD_ROUTE = "/auth/change-password";
const TEAM_INVITE_REGISTER_ROUTE = "/team-invites/register";

const PUBLIC_AUTH_ROUTES = new Set([
  "/health",
  "/auth/bootstrap",
  LOGIN_ROUTE,
  "/auth/resend-verification-email",
  "/auth/verify-email",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/team-invites/resolve",
  TEAM_INVITE_REGISTER_ROUTE,
]);

const SESSION_RESPONSE_ROUTES = new Set([
  LOGIN_ROUTE,
  REFRESH_ROUTE,
  TEAM_INVITE_REGISTER_ROUTE,
]);

type RouteContext = {
  params: Promise<{
    path: string[];
  }>;
};

type PreparedBody = {
  body?: BodyInit;
  contentType?: string;
};

function shouldUseSecureAuthCookies(request: NextRequest) {
  const forwardedProto = request.headers
    .get("x-forwarded-proto")
    ?.split(",")[0]
    ?.trim();

  if (forwardedProto) {
    return forwardedProto === "https";
  }

  return request.nextUrl.protocol === "https:";
}

function buildBackendUrl(path: string, search: string) {
  return `${serverEnv.backendApiBaseUrl}${path}${search}`;
}

function isJsonContentType(contentType: string | null) {
  return Boolean(contentType?.includes("application/json"));
}

function isTextContentType(contentType: string | null) {
  return Boolean(
    contentType?.startsWith("text/") ||
      contentType?.includes("application/x-www-form-urlencoded"),
  );
}

async function readRequestBody(request: NextRequest): Promise<PreparedBody> {
  if (request.method === "GET" || request.method === "HEAD") {
    return {};
  }

  const contentType = request.headers.get("content-type");

  if (isJsonContentType(contentType) || isTextContentType(contentType)) {
    return {
      body: await request.text(),
      contentType: contentType ?? undefined,
    };
  }

  if (contentType?.includes("multipart/form-data")) {
    return {
      body: await request.formData(),
    };
  }

  if (!contentType) {
    const textBody = await request.text();

    if (!textBody) {
      return {};
    }

    return {
      body: textBody,
    };
  }

  return {
    body: await request.arrayBuffer(),
    contentType,
  };
}

function buildForwardHeaders({
  request,
  accessToken,
  contentType,
}: {
  request: NextRequest;
  accessToken?: string;
  contentType?: string;
}) {
  const headers = new Headers();
  const accept = request.headers.get("accept");

  if (accept) {
    headers.set("Accept", accept);
  } else {
    headers.set("Accept", "application/json");
  }

  if (contentType) {
    headers.set("Content-Type", contentType);
  }

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  return headers;
}

async function forwardToBackend({
  request,
  path,
  preparedBody,
  accessToken,
}: {
  request: NextRequest;
  path: string;
  preparedBody: PreparedBody;
  accessToken?: string;
}) {
  return fetch(buildBackendUrl(path, request.nextUrl.search), {
    method: request.method,
    headers: buildForwardHeaders({
      request,
      accessToken,
      contentType: preparedBody.contentType,
    }),
    body: preparedBody.body,
    cache: "no-store",
  });
}

async function refreshAccessToken(refreshToken: string) {
  return fetch(buildBackendUrl(REFRESH_ROUTE, ""), {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      refresh_token: refreshToken,
    }),
    cache: "no-store",
  });
}

async function buildPassthroughResponse(response: Response) {
  const headers = new Headers();
  const contentType = response.headers.get("content-type");
  const requestId = response.headers.get("x-request-id");

  if (contentType) {
    headers.set("content-type", contentType);
  }

  if (requestId) {
    headers.set("x-request-id", requestId);
  }

  if (
    response.status === 204 ||
    response.status === 205 ||
    response.status === 304
  ) {
    return new NextResponse(null, {
      status: response.status,
      headers,
    });
  }

  return new NextResponse(await response.text(), {
    status: response.status,
    headers,
  });
}

async function buildSessionResponse(response: Response, secure: boolean) {
  const payload = (await response.json()) as AuthCookiePayload & {
    tenant: unknown;
    user: unknown;
  };
  const nextResponse = NextResponse.json(
    {
      tenant: payload.tenant,
      user: payload.user,
    },
    {
      status: response.status,
    },
  );

  writeAuthCookies(nextResponse.cookies, payload, {
    secure,
  });

  return nextResponse;
}

async function handleProxy(request: NextRequest, context: RouteContext) {
  const { path: routePath } = await context.params;
  const path = `/${routePath.join("/")}`;
  const shouldUseSecureCookies = shouldUseSecureAuthCookies(request);
  const preparedBody = await readRequestBody(request);
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE_NAME)?.value;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE_NAME)?.value;
  const isPublicRoute = PUBLIC_AUTH_ROUTES.has(path);

  if (path === LOGOUT_ROUTE) {
    const logoutResponse = refreshToken
      ? await fetch(buildBackendUrl(LOGOUT_ROUTE, ""), {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            refresh_token: refreshToken,
          }),
          cache: "no-store",
        })
      : new Response(null, {
          status: 204,
        });

    const nextResponse = await buildPassthroughResponse(logoutResponse);
    clearAuthCookies(nextResponse.cookies);
    return nextResponse;
  }

  let backendResponse = await forwardToBackend({
    request,
    path,
    preparedBody,
    accessToken: isPublicRoute ? undefined : accessToken,
  });
  let refreshedPayload: AuthCookiePayload | null = null;

  if (
    backendResponse.status === 401 &&
    !isPublicRoute &&
    path !== REFRESH_ROUTE &&
    refreshToken
  ) {
    const refreshResponse = await refreshAccessToken(refreshToken);

    if (refreshResponse.ok) {
      refreshedPayload = (await refreshResponse.json()) as AuthCookiePayload;
      backendResponse = await forwardToBackend({
        request,
        path,
        preparedBody,
        accessToken: refreshedPayload.access_token,
      });
    } else {
      const unauthorizedResponse =
        await buildPassthroughResponse(backendResponse);
      clearAuthCookies(unauthorizedResponse.cookies);
      return unauthorizedResponse;
    }
  }

  if (SESSION_RESPONSE_ROUTES.has(path)) {
    if (!backendResponse.ok) {
      const nextResponse = await buildPassthroughResponse(backendResponse);

      if (backendResponse.status === 401) {
        clearAuthCookies(nextResponse.cookies);
      }

      return nextResponse;
    }

    return buildSessionResponse(backendResponse, shouldUseSecureCookies);
  }

  const nextResponse = await buildPassthroughResponse(backendResponse);

  if (refreshedPayload) {
    writeAuthCookies(nextResponse.cookies, refreshedPayload, {
      secure: shouldUseSecureCookies,
    });
  }

  if (path === CHANGE_PASSWORD_ROUTE && backendResponse.ok) {
    clearAuthCookies(nextResponse.cookies);
  }

  if (backendResponse.status === 401) {
    clearAuthCookies(nextResponse.cookies);
  }

  return nextResponse;
}

export async function GET(request: NextRequest, context: RouteContext) {
  return handleProxy(request, context);
}

export async function POST(request: NextRequest, context: RouteContext) {
  return handleProxy(request, context);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  return handleProxy(request, context);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return handleProxy(request, context);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return handleProxy(request, context);
}
