import { defineConfig, devices } from "@playwright/test";

const mockApiPort = 4101;
const appPort = 3101;
const mockApiBaseUrl = `http://127.0.0.1:${mockApiPort}/api/v1`;
const appBaseUrl = `http://127.0.0.1:${appPort}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: appBaseUrl,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
      },
    },
  ],
  webServer: [
    {
      command: `MOCK_BACKEND_PORT=${mockApiPort} node ./e2e/mock-backend-server.mjs`,
      port: mockApiPort,
      reuseExistingServer: false,
      timeout: 30_000,
    },
    {
      command: `API_BASE_URL=${mockApiBaseUrl} NEXT_PUBLIC_API_BASE_URL=${mockApiBaseUrl} npm run start -- --port ${appPort}`,
      port: appPort,
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
});
