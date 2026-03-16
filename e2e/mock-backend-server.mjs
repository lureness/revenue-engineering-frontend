import { createServer } from "node:http";

const PORT = Number(process.env.MOCK_BACKEND_PORT ?? 4101);
const JSON_HEADERS = {
  "Content-Type": "application/json",
};

const OWNER_EMAIL = "owner@lureness.test";
const PENDING_EMAIL = "pending@lureness.test";
const INITIAL_PASSWORD = "super-secret-password";

const VALID_ACCESS_TOKEN = "valid-access-token";
const EXPIRED_ACCESS_TOKEN = "expired-access-token";
const ROTATED_ACCESS_TOKEN = "rotated-access-token";
const VALID_REFRESH_TOKEN = "valid-refresh-token";
const ROTATED_REFRESH_TOKEN = "rotated-refresh-token";
const VERIFY_TOKEN = "verify-token";
const RESET_TOKEN = "reset-token";

function createInitialState() {
  return {
    passwords: new Map([
      [OWNER_EMAIL, INITIAL_PASSWORD],
      [PENDING_EMAIL, INITIAL_PASSWORD],
    ]),
    verified: new Map([
      [OWNER_EMAIL, true],
      [PENDING_EMAIL, false],
    ]),
  };
}

let state = createInitialState();

function sendJson(response, status, payload) {
  response.writeHead(status, JSON_HEADERS);
  response.end(JSON.stringify(payload));
}

function sendEmpty(response, status = 204) {
  response.writeHead(status);
  response.end();
}

function getSessionPayload(
  email,
  accessToken = VALID_ACCESS_TOKEN,
  refreshToken = VALID_REFRESH_TOKEN,
) {
  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    token_type: "bearer",
    expires_in: 3600,
    refresh_expires_in: 604800,
    tenant: {
      id: "tenant_01",
      name: "Lureness Labs",
      slug: "lureness-labs",
    },
    user: {
      id: "user_01",
      tenant_id: "tenant_01",
      email,
      email_verified_at: state.verified.get(email)
        ? "2026-03-16T12:00:00.000Z"
        : null,
      role: "owner",
      is_active: true,
    },
  };
}

async function readJson(request) {
  let rawBody = "";

  for await (const chunk of request) {
    rawBody += chunk;
  }

  if (!rawBody) {
    return {};
  }

  try {
    return JSON.parse(rawBody);
  } catch {
    return {};
  }
}

function getBearerToken(request) {
  const header = request.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    return null;
  }

  return header.slice("Bearer ".length);
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", `http://127.0.0.1:${PORT}`);

  if (request.method === "POST" && url.pathname === "/__reset") {
    state = createInitialState();
    sendEmpty(response);
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/v1/health") {
    sendJson(response, 200, { status: "ok" });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/v1/auth/login") {
    const body = await readJson(request);
    const email = String(body.email ?? "")
      .trim()
      .toLowerCase();
    const password = String(body.password ?? "");

    if (
      !state.passwords.has(email) ||
      state.passwords.get(email) !== password
    ) {
      sendJson(response, 401, {
        detail: "invalid credentials",
      });
      return;
    }

    if (!state.verified.get(email)) {
      sendJson(response, 401, {
        detail: "email address is not verified",
      });
      return;
    }

    sendJson(
      response,
      200,
      getSessionPayload(email, VALID_ACCESS_TOKEN, VALID_REFRESH_TOKEN),
    );
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/v1/auth/me") {
    const token = getBearerToken(request);

    if (!token) {
      sendJson(response, 401, {
        detail: "missing bearer token",
      });
      return;
    }

    if (token === EXPIRED_ACCESS_TOKEN) {
      sendJson(response, 401, {
        detail: "invalid access token",
      });
      return;
    }

    if (token === VALID_ACCESS_TOKEN || token === ROTATED_ACCESS_TOKEN) {
      sendJson(response, 200, {
        tenant: getSessionPayload(OWNER_EMAIL).tenant,
        user: getSessionPayload(OWNER_EMAIL).user,
      });
      return;
    }

    sendJson(response, 401, {
      detail: "invalid access token",
    });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/v1/auth/refresh") {
    const body = await readJson(request);
    const refreshToken = String(body.refresh_token ?? "");

    if (
      refreshToken === VALID_REFRESH_TOKEN ||
      refreshToken === ROTATED_REFRESH_TOKEN
    ) {
      sendJson(
        response,
        200,
        getSessionPayload(
          OWNER_EMAIL,
          ROTATED_ACCESS_TOKEN,
          ROTATED_REFRESH_TOKEN,
        ),
      );
      return;
    }

    sendJson(response, 401, {
      detail: "invalid refresh token",
    });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/v1/auth/logout") {
    sendEmpty(response);
    return;
  }

  if (
    request.method === "POST" &&
    url.pathname === "/api/v1/auth/forgot-password"
  ) {
    sendEmpty(response);
    return;
  }

  if (
    request.method === "POST" &&
    url.pathname === "/api/v1/auth/verify-email"
  ) {
    const body = await readJson(request);

    if (body.token !== VERIFY_TOKEN) {
      sendJson(response, 400, {
        detail: "invalid or expired verification token",
      });
      return;
    }

    state.verified.set(PENDING_EMAIL, true);
    sendEmpty(response);
    return;
  }

  if (
    request.method === "POST" &&
    url.pathname === "/api/v1/auth/reset-password"
  ) {
    const body = await readJson(request);

    if (body.token !== RESET_TOKEN) {
      sendJson(response, 400, {
        detail: "invalid or expired reset token",
      });
      return;
    }

    state.passwords.set(OWNER_EMAIL, String(body.new_password ?? ""));
    sendEmpty(response);
    return;
  }

  if (
    request.method === "POST" &&
    url.pathname === "/api/v1/auth/change-password"
  ) {
    const token = getBearerToken(request);
    const body = await readJson(request);

    if (token !== VALID_ACCESS_TOKEN && token !== ROTATED_ACCESS_TOKEN) {
      sendJson(response, 401, {
        detail: "invalid access token",
      });
      return;
    }

    if (
      String(body.current_password ?? "") !== state.passwords.get(OWNER_EMAIL)
    ) {
      sendJson(response, 401, {
        detail: "invalid current password",
      });
      return;
    }

    state.passwords.set(OWNER_EMAIL, String(body.new_password ?? ""));
    sendEmpty(response);
    return;
  }

  if (
    request.method === "POST" &&
    url.pathname === "/api/v1/auth/resend-verification-email"
  ) {
    sendEmpty(response);
    return;
  }

  sendJson(response, 404, {
    detail: "not found",
  });
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Mock auth backend listening on http://127.0.0.1:${PORT}`);
});
