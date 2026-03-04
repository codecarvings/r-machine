import { expect, test } from "@playwright/test";

const EN_ORIGIN = "http://english.test:3000";
const IT_ORIGIN = "http://italiano.test:3000";

test.describe("Next.js origin strategy — locale routing", () => {
  test("serves English content on english.test", async ({ page }) => {
    await page.goto(`${EN_ORIGIN}/`);
    await expect(page.getByRole("heading", { name: "Type-Safe i18n for Modern Applications" })).toBeVisible();
    await expect(page.getByText("Why R-Machine?")).toBeVisible();
  });

  test("serves Italian content on italiano.test", async ({ page }) => {
    await page.goto(`${IT_ORIGIN}/`);
    await expect(page.getByRole("heading", { name: "i18n Type-Safe per Applicazioni Moderne" })).toBeVisible();
    await expect(page.getByText("Perché R-Machine?")).toBeVisible();
  });

  test("switches locale by navigating to the other origin", async ({ page }) => {
    await page.goto(`${EN_ORIGIN}/`);
    await expect(page.getByRole("heading", { name: "Type-Safe i18n for Modern Applications" })).toBeVisible();

    // Open the locale switcher and select Italian
    const switcher = page.locator("#locale-switcher-button");
    await expect(switcher).toBeVisible();
    await switcher.click();

    const italianOption = page.getByRole("menuitem", { name: "Italiano" });
    await expect(italianOption).toBeVisible();
    await italianOption.click();

    // Should navigate to italiano.test with Italian content
    await expect(page).toHaveURL(new RegExp(IT_ORIGIN.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    await expect(page.getByRole("heading", { name: "i18n Type-Safe per Applicazioni Moderne" })).toBeVisible();
  });

  test("serves non-localized routes on both origins", async ({ page }) => {
    await page.goto(`${EN_ORIGIN}/hello-world`);
    await expect(page.getByRole("heading", { name: "Hello, world!" })).toBeVisible();

    await page.goto(`${IT_ORIGIN}/hello-world`);
    await expect(page.getByRole("heading", { name: "Hello, world!" })).toBeVisible();
  });
});
