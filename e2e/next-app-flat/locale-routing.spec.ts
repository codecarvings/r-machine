import { expect, test } from "@playwright/test";

test.describe("Next.js flat strategy — locale routing", () => {
  test("serves English content at root by default", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Type-Safe i18n for Modern Applications" })).toBeVisible();
    await expect(page.getByText("Why R-Machine?")).toBeVisible();
    await expect(page.getByText("Type-Safe Translations")).toBeVisible();
    await expect(page.getByText("Minimal Runtime Cost")).toBeVisible();
  });

  test("serves localized content based on cookie", async ({ page }) => {
    await page.goto("/set-italian");

    await page.goto("/");
    await expect(page.getByRole("heading", { name: "i18n Type-Safe per Applicazioni Moderne" })).toBeVisible();
    await expect(page.getByText("Perché R-Machine?")).toBeVisible();
    await expect(page.getByText("Traduzioni Type-Safe")).toBeVisible();
    await expect(page.getByText("Minimo Costo Runtime")).toBeVisible();
  });

  test("switches locale via UI", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Type-Safe i18n for Modern Applications" })).toBeVisible();

    const switcher = page.locator("#locale-switcher-button");
    await expect(switcher).toBeVisible();
    await switcher.click();

    const italianOption = page.getByRole("menuitem", { name: "Italiano" });
    await expect(italianOption).toBeVisible();
    await italianOption.click();

    await expect(page.getByRole("heading", { name: "i18n Type-Safe per Applicazioni Moderne" })).toBeVisible();
  });

  test("serves content at nested static routes", async ({ page }) => {
    await page.goto("/example-static/page-1");
    await expect(page.getByText("Static Page 1")).toBeVisible();

    await page.goto("/set-italian");

    await page.goto("/example-static/page-1");
    await expect(page.getByText("Pagina Statica 1")).toBeVisible();
  });

  test("handles dynamic routes", async ({ page }) => {
    await page.goto("/example-dynamic");
    await expect(page.getByRole("link", { name: "Dynamic Item 1" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Dynamic Item 2" })).toBeVisible();

    await page.goto("/example-dynamic/slug-1");
    await expect(page.getByText("Dynamic Item 1")).toBeVisible();
    await expect(page.getByText("Back to list")).toBeVisible();
  });

  test("serves non-localized routes", async ({ page }) => {
    await page.goto("/hello-world");
    await expect(page.getByRole("heading", { name: "Hello, world!" })).toBeVisible();
  });

  test("API route sets locale cookie", async ({ page }) => {
    await page.goto("/set-italian");

    await page.goto("/");
    await expect(page.getByRole("heading", { name: "i18n Type-Safe per Applicazioni Moderne" })).toBeVisible();
  });
});
