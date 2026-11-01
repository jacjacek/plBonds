import { defineConfig, devices } from "@playwright/test"
export default defineConfig({
  testDir: "./tests/browser",
  use: { channel: process.env.PLAYWRIGHT_CHANNEL, baseURL: "http://127.0.0.1:3000", trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["iPhone 13"], defaultBrowserType: "chromium" } },
  ],
  webServer: {
    command: "python3 -m http.server 3000 --bind 127.0.0.1 --directory out",
    url: "http://127.0.0.1:3000", reuseExistingServer: false,
  },
})
