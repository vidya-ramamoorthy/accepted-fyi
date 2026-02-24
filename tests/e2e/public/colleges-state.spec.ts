import { test, expect, assertPublicNav, assertNotFoundResponse } from "../fixtures/base.fixture";

test.describe("Colleges by state page", () => {
  test("renders heading with state name", async ({ page }) => {
    await page.goto("/colleges/state/california");
    await assertPublicNav(page);
    await expect(
      page.getByRole("heading", { name: /colleges in california/i })
    ).toBeVisible();
  });

  test("shows school count for the state", async ({ page }) => {
    await page.goto("/colleges/state/california");
    await expect(
      page.getByText(/\d+ colleges and universities in california/i)
    ).toBeVisible();
  });

  test("renders aggregate stats cards", async ({ page }) => {
    await page.goto("/colleges/state/california");
    await expect(page.getByText("Total Schools")).toBeVisible();
    await expect(page.getByText("Public / Private")).toBeVisible();
  });

  test("back link goes to colleges hub", async ({ page }) => {
    await page.goto("/colleges/state/california");
    const backLink = page.getByRole("link", { name: /browse colleges/i }).first();
    await expect(backLink).toHaveAttribute("href", "/colleges");
  });

  test("renders cross-links to other states", async ({ page }) => {
    await page.goto("/colleges/state/california");
    const otherStatesSection = page.locator("section").filter({ hasText: "Other States" });
    await expect(otherStatesSection).toBeVisible();
    // California page should link to other states but not itself
    await expect(otherStatesSection.getByRole("link", { name: "New York" })).toBeVisible();
  });

  test("returns 404 for invalid state slug", async ({ page }) => {
    const response = await page.goto("/colleges/state/not-a-real-state");
    await assertNotFoundResponse(page, response);
  });
});
