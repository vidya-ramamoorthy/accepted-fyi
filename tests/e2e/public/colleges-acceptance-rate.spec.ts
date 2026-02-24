import { test, expect, assertPublicNav, assertNotFoundResponse } from "../fixtures/base.fixture";

test.describe("Colleges by acceptance rate page", () => {
  test("renders heading with acceptance rate range", async ({ page }) => {
    await page.goto("/colleges/acceptance-rate/under-10");
    await assertPublicNav(page);
    await expect(
      page.getByRole("heading", { name: /colleges with under 10% acceptance rate/i })
    ).toBeVisible();
  });

  test("shows matching school count", async ({ page }) => {
    await page.goto("/colleges/acceptance-rate/under-10");
    await expect(
      page.getByText(/\d+ schools with acceptance rates/i)
    ).toBeVisible();
  });

  test("back link goes to colleges hub", async ({ page }) => {
    await page.goto("/colleges/acceptance-rate/under-10");
    const backLink = page.getByRole("link", { name: /browse colleges/i }).first();
    await expect(backLink).toHaveAttribute("href", "/colleges");
  });

  test("renders cross-links to other acceptance rate ranges", async ({ page }) => {
    await page.goto("/colleges/acceptance-rate/under-10");
    const crossLinksSection = page.locator("section").filter({
      hasText: "Other Acceptance Rate Ranges",
    });
    await expect(crossLinksSection).toBeVisible();
    await expect(crossLinksSection.getByRole("link", { name: "10-20%" })).toBeVisible();
    await expect(crossLinksSection.getByRole("link", { name: "Over 70%" })).toBeVisible();
  });

  test("returns 404 for invalid acceptance rate range", async ({ page }) => {
    const response = await page.goto("/colleges/acceptance-rate/not-a-range");
    await assertNotFoundResponse(page, response);
  });
});
