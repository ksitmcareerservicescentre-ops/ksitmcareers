import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/modules",
  testMatch: "ui.checks.ts",
  workers: 1,
  reporter: "list",
  use: { channel: "chrome" },
  projects: [
    {
      name: "desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 1000 },
      },
    },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
});
