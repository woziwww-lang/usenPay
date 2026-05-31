import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  use: {
    baseURL: "http://127.0.0.1:3100",
    trace: "on-first-retry",
  },
  webServer: [
    {
      command: "pnpm --filter @usen-pay/bff start",
      env: {
        PORT: "8788",
      },
      port: 8788,
      reuseExistingServer: false,
    },
    {
      command: "pnpm --filter @usen-pay/web exec vite --host 0.0.0.0 --port 3100",
      env: {
        VITE_API_PROXY_TARGET: "http://127.0.0.1:8788",
      },
      port: 3100,
      reuseExistingServer: false,
    },
  ],
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"], browserName: "chromium" } },
  ],
});
