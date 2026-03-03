import { expect, test } from "@playwright/test";

test.describe("Next.js path strategy — locale routing", () => {
  test("serves default locale at root without redirect", async ({ page }) => {
    const response = await page.goto("/");
    // The default locale (en) is served implicitly at the root — no /en prefix
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { name: "Type-Safe i18n for Modern Applications" })).toBeVisible();
  });

  test("renders English content at /en", async ({ page }) => {
    await page.goto("/en");
    await expect(page.getByRole("heading", { name: "Type-Safe i18n for Modern Applications" })).toBeVisible();
    await expect(page.getByText("Why R-Machine?")).toBeVisible();
    await expect(page.getByText("Type-Safe Translations")).toBeVisible();
    await expect(page.getByText("Minimal Runtime Cost")).toBeVisible();
  });

  test("renders Italian content at /it", async ({ page }) => {
    await page.goto("/it");
    await expect(page.getByRole("heading", { name: "i18n Type-Safe per Applicazioni Moderne" })).toBeVisible();
    await expect(page.getByText("Perché R-Machine?")).toBeVisible();
    await expect(page.getByText("Traduzioni Type-Safe")).toBeVisible();
    await expect(page.getByText("Minimo Costo Runtime")).toBeVisible();
  });

  test("switches locale via UI", async ({ page }) => {
    await page.goto("/en");
    await expect(page.getByRole("heading", { name: "Type-Safe i18n for Modern Applications" })).toBeVisible();

    // Wait for the locale switcher to be hydrated, then open the dropdown
    const switcher = page.locator("#locale-switcher-button");
    await expect(switcher).toBeVisible();
    await switcher.click();

    // Wait for the dropdown to appear and select Italian
    const italianOption = page.getByRole("menuitem", { name: "Italiano" });
    await expect(italianOption).toBeVisible();
    await italianOption.click();

    // Should navigate to /it with Italian content
    await expect(page).toHaveURL(/\/it/);
    await expect(page.getByRole("heading", { name: "i18n Type-Safe per Applicazioni Moderne" })).toBeVisible();
  });

  test("translates paths per locale", async ({ page }) => {
    // English path
    await page.goto("/en/example-static/page-1");
    await expect(page.getByText("Static Page 1")).toBeVisible();

    // Italian translated path
    await page.goto("/it/esempio-statico/pagina-1");
    await expect(page.getByText("Pagina Statica 1")).toBeVisible();
  });

  test("handles dynamic routes", async ({ page }) => {
    await page.goto("/en/example-dynamic");
    // The title is inside a CardTitle (div), check for the slug links instead
    await expect(page.getByRole("link", { name: "Dynamic Item 1" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Dynamic Item 2" })).toBeVisible();

    // Navigate to a specific slug
    await page.goto("/en/example-dynamic/slug-1");
    await expect(page.getByText("Dynamic Item 1")).toBeVisible();
    await expect(page.getByText("Back to list")).toBeVisible();
  });

  test("serves non-localized routes", async ({ page }) => {
    await page.goto("/hello-world");
    await expect(page.getByRole("heading", { name: "Hello, world!" })).toBeVisible();
    // URL should NOT contain a locale prefix
    expect(page.url()).not.toMatch(/\/(en|it)\/hello-world/);
  });

  test("API route sets locale cookie", async ({ page, context }) => {
    // Visit the set-italian API route
    await page.goto("/set-italian");

    // Now navigating to root should redirect to Italian
    await page.goto("/");
    await expect(page).toHaveURL(/\/it/);
    await expect(page.getByRole("heading", { name: "i18n Type-Safe per Applicazioni Moderne" })).toBeVisible();
  });
});
