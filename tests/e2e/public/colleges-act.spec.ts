import { test, expect, assertPublicNav, assertNotFoundResponse } from "../fixtures/base.fixture";

test.describe("Colleges by ACT range page", () => {
  test("renders heading with ACT range", async ({ page }) => {
    await page.goto("/colleges/act/30-33");
    await assertPublicNav(page);
    await expect(
      page.getByRole("heading", { name: /colleges for 30-33 ACT/i })
    ).toBeVisible();
  });

  test("shows matching school count", async ({ page }) => {
    await page.goto("/colleges/act/30-33");
    await expect(
      page.getByText(/\d+ schools where a 30-33 ACT score is competitive/i)
    ).toBeVisible();
  });

  test("back link goes to colleges hub", async ({ page }) => {
    await page.goto("/colleges/act/30-33");
    const backLink = page.getByRole("link", { name: /browse colleges/i }).first();
    await expect(backLink).toHaveAttribute("href", "/colleges");
  });

  test("renders cross-links to other ACT ranges", async ({ page }) => {
    await page.goto("/colleges/act/30-33");
    const crossLinksSection = page.locator("section").filter({ hasText: "Other ACT Score Ranges" });
    await expect(crossLinksSection).toBeVisible();
    await expect(crossLinksSection.getByRole("link", { name: "34-36" })).toBeVisible();
    await expect(crossLinksSection.getByRole("link", { name: "26-29" })).toBeVisible();
  });

  test("returns 404 for invalid ACT range", async ({ page }) => {
    const response = await page.goto("/colleges/act/99-100");
    await assertNotFoundResponse(page, response);
  });
});
