import { expect, test } from "@playwright/test";

test.describe("React showcase — gear-driven views & locale", () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage so each test starts with the default locale + view
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.goto("/");
  });

  test("renders the intro view in English by default", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "The router is a gear" })).toBeVisible();
  });

  test("navigates between views via the gear-driven sidebar", async ({ page }) => {
    await page.getByRole("button", { name: "OuterGear", exact: true }).click();
    await expect(page.getByRole("heading", { name: "OuterGear — reactive state" })).toBeVisible();

    await page.getByRole("button", { name: "Vertex", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Vertex + VertexFrame" })).toBeVisible();
  });

  test("switches to Italian", async ({ page }) => {
    await page.getByRole("button", { name: /English/i }).click();
    await page.getByRole("menuitem", { name: "Italiano" }).click();
    await expect(page.getByRole("heading", { name: "Il router è un gear" })).toBeVisible();
  });

  test("persists locale on reload", async ({ page }) => {
    await page.getByRole("button", { name: /English/i }).click();
    await page.getByRole("menuitem", { name: "Italiano" }).click();
    await expect(page.getByRole("heading", { name: "Il router è un gear" })).toBeVisible();

    await page.reload();
    await expect(page.getByRole("heading", { name: "Il router è un gear" })).toBeVisible();
  });

  test("loads an async shell with Suspense", async ({ page }) => {
    await page.getByRole("button", { name: "Async + Suspense", exact: true }).click();
    // The async shell awaits ~1.5s; the consumer suspends, then resolves.
    await expect(page.getByText("Loaded asynchronously")).toBeVisible({ timeout: 10_000 });
  });
});
