import { test, expect, assertPublicNav, assertNotFoundResponse } from "../fixtures/base.fixture";

test.describe("Colleges by SAT range page", () => {
  test("renders heading with SAT range", async ({ page }) => {
    await page.goto("/colleges/sat/1400-1500");
    await assertPublicNav(page);
    await expect(
      page.getByRole("heading", { name: /colleges for 1400-1500 SAT/i })
    ).toBeVisible();
  });

  test("shows matching school count", async ({ page }) => {
    await page.goto("/colleges/sat/1400-1500");
    await expect(
      page.getByText(/\d+ schools where a 1400-1500 SAT score is competitive/i)
    ).toBeVisible();
  });

  test("back link goes to colleges hub", async ({ page }) => {
    await page.goto("/colleges/sat/1400-1500");
    const backLink = page.getByRole("link", { name: /browse colleges/i }).first();
    await expect(backLink).toHaveAttribute("href", "/colleges");
  });

  test("renders cross-links to other SAT ranges", async ({ page }) => {
    await page.goto("/colleges/sat/1400-1500");
    const crossLinksSection = page.locator("section").filter({ hasText: "Other SAT Score Ranges" });
    await expect(crossLinksSection).toBeVisible();
    await expect(crossLinksSection.getByRole("link", { name: "1500-1600" })).toBeVisible();
    await expect(crossLinksSection.getByRole("link", { name: "1300-1400" })).toBeVisible();
  });

  test("returns 404 for invalid SAT range", async ({ page }) => {
    const response = await page.goto("/colleges/sat/9999-10000");
    await assertNotFoundResponse(page, response);
  });
});
