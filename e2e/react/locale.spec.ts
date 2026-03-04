import { expect, test } from "@playwright/test";

test.describe("React app — locale", () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage so each test starts with the default locale
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.goto("/");
  });

  test("renders English content by default", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Type-Safe i18n for Modern Applications" })).toBeVisible();
    await expect(page.getByText("Why R-Machine?")).toBeVisible();
    await expect(page.getByText("Type-Safe Translations")).toBeVisible();
    await expect(page.getByText("Minimal Runtime Cost")).toBeVisible();
  });

  test("switches to Italian", async ({ page }) => {
    // Open the locale switcher dropdown and select Italian
    await page.getByRole("button", { name: /English/i }).click();
    await page.getByRole("menuitem", { name: "Italiano" }).click();

    // Wait for the locale switch (200ms delay + re-render)
    await expect(page.getByRole("heading", { name: "i18n Type-Safe per Applicazioni Moderne" })).toBeVisible();
    await expect(page.getByText("Perché R-Machine?")).toBeVisible();
    await expect(page.getByText("Traduzioni Type-Safe")).toBeVisible();
    await expect(page.getByText("Minimo Costo Runtime")).toBeVisible();
  });

  test("persists locale on reload", async ({ page }) => {
    // Switch to Italian
    await page.getByRole("button", { name: /English/i }).click();
    await page.getByRole("menuitem", { name: "Italiano" }).click();
    await expect(page.getByRole("heading", { name: "i18n Type-Safe per Applicazioni Moderne" })).toBeVisible();

    // Reload and verify it stays in Italian
    await page.reload();
    await expect(page.getByRole("heading", { name: "i18n Type-Safe per Applicazioni Moderne" })).toBeVisible();
  });

  test("loads async Box3 resource", async ({ page }) => {
    // Box3 is loaded asynchronously with a 2-second delay
    await expect(page.getByText("React Integration")).toBeVisible({ timeout: 10_000 });
  });
});
