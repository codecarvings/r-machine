import { defineConfig } from "@playwright/test";

const hostResolverRules = "MAP english.test 127.0.0.1, MAP italiano.test 127.0.0.1";

export default defineConfig({
  testDir: ".",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  ...(process.env.CI ? { workers: 1 } : {}),
  reporter: process.env.CI ? "github" : "html",
  use: {
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "react",
      testMatch: "react/**/*.spec.ts",
      use: { baseURL: "http://localhost:4173" },
    },
    {
      name: "next-app-origin",
      testMatch: "next-app-origin/**/*.spec.ts",
      use: {
        baseURL: "http://english.test:3000",
        launchOptions: {
          args: [`--host-resolver-rules=${hostResolverRules}`],
        },
      },
    },
    {
      name: "next-app-path",
      testMatch: "next-app-path/**/*.spec.ts",
      use: { baseURL: "http://localhost:3001" },
    },
    {
      name: "next-app-path-no-proxy",
      testMatch: "next-app-path-no-proxy/**/*.spec.ts",
      use: { baseURL: "http://localhost:3002" },
    },
    {
      name: "next-app-flat",
      testMatch: "next-app-flat/**/*.spec.ts",
      use: { baseURL: "http://localhost:3003" },
    },
  ],
  webServer: [
    {
      command: "pnpm --filter @r-machine/examples-react preview --port 4173",
      port: 4173,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: "pnpm --filter @r-machine/examples-next-with-app-origin-strategy start --port 3000",
      port: 3000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: "pnpm --filter @r-machine/examples-next-with-app-path-strategy start --port 3001",
      port: 3001,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: "pnpm --filter @r-machine/examples-next-with-app-path-strategy-no-proxy start --port 3002",
      port: 3002,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: "pnpm --filter @r-machine/examples-next-with-app-flat-strategy start --port 3003",
      port: 3003,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
