import { type APIRequestContext, expect, test } from "@playwright/test";

const APP_URL = "http://127.0.0.1:3101";
const MOCK_API_URL = "http://127.0.0.1:4101";

const ACCESS_COOKIE_NAME = "lureness.access-token";
const REFRESH_COOKIE_NAME = "lureness.refresh-token";

async function resetMockBackend(request: APIRequestContext) {
  await request.post(`${MOCK_API_URL}/__reset`);
}

test.beforeEach(async ({ request }) => {
  await resetMockBackend(request);
});

test("redirects unauthenticated access from protected routes", async ({
  page,
}) => {
  await page.goto("/app/user");

  await expect(page).toHaveURL(/\/login\?redirectTo=%2Fapp%2Fuser/);
  await expect(page.getByLabel("E-mail")).toBeVisible();
});

test("redirects authenticated users away from public-only auth routes", async ({
  page,
}) => {
  await page.context().addCookies([
    {
      name: REFRESH_COOKIE_NAME,
      value: "valid-refresh-token",
      url: APP_URL,
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);

  await page.goto("/login");

  await expect(page).toHaveURL("/app");
  await expect(page.getByLabel("Abrir menu do usuário")).toBeVisible();
});

test("logs in and keeps the session after a reload", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill("owner@lureness.test");
  await page.getByLabel("Senha").fill("super-secret-password");
  await page.getByRole("button", { name: "Entrar" }).click();

  await expect(page).toHaveURL("/app");
  await expect(page.getByLabel("Abrir menu do usuário")).toBeVisible();
  await page.getByLabel("Abrir menu do usuário").click();
  await expect(page.getByText("owner@lureness.test")).toBeVisible();

  await page.reload();

  await expect(page).toHaveURL("/app");
  await page.getByLabel("Abrir menu do usuário").click();
  await expect(page.getByText("owner@lureness.test")).toBeVisible();
});

test("refreshes the session automatically when the access cookie expires", async ({
  page,
}) => {
  await page.context().addCookies([
    {
      name: ACCESS_COOKIE_NAME,
      value: "expired-access-token",
      url: APP_URL,
      httpOnly: true,
      sameSite: "Lax",
    },
    {
      name: REFRESH_COOKIE_NAME,
      value: "valid-refresh-token",
      url: APP_URL,
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);

  await page.goto("/app");

  await expect(page).toHaveURL("/app");
  await expect(page.getByLabel("Abrir menu do usuário")).toBeVisible();
});

test("submits forgot-password and shows the confirmation state", async ({
  page,
}) => {
  await page.goto("/forgot-password");
  await page.getByLabel("E-mail").fill("owner@lureness.test");
  await page.getByRole("button", { name: "Enviar link" }).click();

  await expect(page.getByText("Confira a sua caixa de entrada")).toBeVisible();
});

test("verifies the email token from the public route", async ({ page }) => {
  await page.goto("/verify-email?token=verify-token");

  await expect(page.getByText("E-mail verificado com sucesso.")).toBeVisible();
});

test("resets the password and allows login with the new secret", async ({
  page,
}) => {
  await page.goto("/reset-password?token=reset-token");
  await page.locator("#reset-password-new").fill("nova-senha-123");
  await page.locator("#reset-password-confirm").fill("nova-senha-123");
  await page.getByRole("button", { name: "Salvar nova senha" }).click();

  await expect(page.getByText("Senha atualizada")).toBeVisible();

  await page.goto("/login");
  await page.getByLabel("E-mail").fill("owner@lureness.test");
  await page.getByLabel("Senha").fill("nova-senha-123");
  await page.getByRole("button", { name: "Entrar" }).click();

  await expect(page).toHaveURL("/app");
});

test("changes the password inside the app and forces a new login", async ({
  page,
}) => {
  await page.context().addCookies([
    {
      name: ACCESS_COOKIE_NAME,
      value: "valid-access-token",
      url: APP_URL,
      httpOnly: true,
      sameSite: "Lax",
    },
    {
      name: REFRESH_COOKIE_NAME,
      value: "valid-refresh-token",
      url: APP_URL,
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);

  await page.goto("/app/user");
  await page.locator("#current-password").fill("super-secret-password");
  await page.locator("#new-password").fill("troca-segura-456");
  await page.locator("#new-password-confirm").fill("troca-segura-456");
  await page.getByRole("button", { name: "Salvar nova senha" }).click();

  await expect(page).toHaveURL(/\/login\?reason=password-changed/);
  await expect(page.getByLabel("E-mail")).toBeVisible();
});
