import { expect, test } from "@playwright/test";

test.describe("Next.js path strategy (no proxy) — locale routing", () => {
  test("redirects root to default locale", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/en/);
    await expect(page.getByRole("heading", { name: "Type-Safe i18n for Modern Applications" })).toBeVisible();
  });

  test("renders English content at /en", async ({ page }) => {
    await page.goto("/en");
    await expect(page.getByRole("heading", { name: "Type-Safe i18n for Modern Applications" })).toBeVisible();
    await expect(page.getByText("Why R-Machine?")).toBeVisible();
    await expect(page.getByText("Type-Safe Translations")).toBeVisible();
    await expect(page.getByText("Minimal Runtime Cost")).toBeVisible();
  });

  test("renders Italian content at /it-it", async ({ page }) => {
    await page.goto("/it-it");
    await expect(page.getByRole("heading", { name: "i18n Type-Safe per Applicazioni Moderne" })).toBeVisible();
    await expect(page.getByText("Perché R-Machine?")).toBeVisible();
    await expect(page.getByText("Traduzioni Type-Safe")).toBeVisible();
    await expect(page.getByText("Minimo Costo Runtime")).toBeVisible();
  });

  test("switches locale via UI", async ({ page }) => {
    await page.goto("/en");
    await expect(page.getByRole("heading", { name: "Type-Safe i18n for Modern Applications" })).toBeVisible();

    const switcher = page.locator("#locale-switcher-button");
    await expect(switcher).toBeVisible();
    await switcher.click();

    const italianOption = page.getByRole("menuitem", { name: "Italiano" });
    await expect(italianOption).toBeVisible();
    await italianOption.click();

    await expect(page).toHaveURL(/\/it-it/);
    await expect(page.getByRole("heading", { name: "i18n Type-Safe per Applicazioni Moderne" })).toBeVisible();
  });

  test("uses untranslated paths for both locales", async ({ page }) => {
    await page.goto("/en/example-static/page-1");
    await expect(page.getByText("Static Page 1")).toBeVisible();

    await page.goto("/it-it/example-static/page-1");
    await expect(page.getByText("Pagina Statica 1")).toBeVisible();
  });

  test("handles dynamic routes", async ({ page }) => {
    await page.goto("/en/example-dynamic");
    await expect(page.getByRole("link", { name: "Dynamic Item 1" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Dynamic Item 2" })).toBeVisible();

    await page.goto("/en/example-dynamic/slug-1");
    await expect(page.getByText("Dynamic Item 1")).toBeVisible();
    await expect(page.getByText("Back to list")).toBeVisible();
  });

  test("serves non-localized routes", async ({ page }) => {
    await page.goto("/hello-world");
    await expect(page.getByRole("heading", { name: "Hello, world!" })).toBeVisible();
    expect(page.url()).not.toMatch(/\/(en|it-it)\/hello-world/);
  });

  test("API route sets locale cookie", async ({ page }) => {
    await page.goto("/set-italian");

    await page.goto("/");
    await expect(page).toHaveURL(/\/it-it/);
    await expect(page.getByRole("heading", { name: "i18n Type-Safe per Applicazioni Moderne" })).toBeVisible();
  });
});
