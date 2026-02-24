import { test, expect } from "../fixtures/base.fixture";

test.describe("Cross-page navigation smoke tests", () => {
  test("homepage → schools → detail → back to schools", async ({ page }) => {
    // Start at homepage
    await page.goto("/");

    // Click "Browse Schools" link in hero
    await page.getByRole("link", { name: /browse schools/i }).first().click();
    await expect(page).toHaveURL("/schools");
    await expect(page.getByRole("heading", { name: "Schools" })).toBeVisible();

    // Click the first school link (if any schools exist)
    const firstSchoolLink = page.locator("main a").filter({ hasText: /,\s*[A-Z]{2}/ }).first();
    const hasSchools = await firstSchoolLink.count() > 0;

    if (hasSchools) {
      await firstSchoolLink.click();
      await expect(page).toHaveURL(/\/schools\/.+/);
      await expect(page.locator("h1")).toBeVisible();

      // Navigate back via "Back to Schools" link
      await page.getByRole("link", { name: /back to schools/i }).click();
      await expect(page).toHaveURL("/schools");
    }
  });

  test("colleges hub → state page → back via breadcrumb", async ({ page }) => {
    await page.goto("/colleges");

    // Click California
    await page.getByRole("link", { name: "California" }).first().click();
    await expect(page).toHaveURL("/colleges/state/california");
    await expect(
      page.getByRole("heading", { name: /colleges in california/i })
    ).toBeVisible();

    // Navigate back via breadcrumb link
    const backLink = page.getByRole("link", { name: /browse colleges/i }).first();
    await backLink.click();
    await expect(page).toHaveURL("/colleges");
  });

  test("colleges hub → SAT range → back", async ({ page }) => {
    await page.goto("/colleges");

    await page.getByRole("link", { name: "1500-1600" }).first().click();
    await expect(page).toHaveURL("/colleges/sat/1500-1600");
    await expect(
      page.getByRole("heading", { name: /1500-1600 SAT/i })
    ).toBeVisible();

    const backLink = page.getByRole("link", { name: /browse colleges/i }).first();
    await backLink.click();
    await expect(page).toHaveURL("/colleges");
  });

  test("homepage nav Sign In → login page", async ({ page }) => {
    await page.goto("/");
    await page.locator("nav").getByRole("link", { name: /sign in/i }).click();
    await expect(page).toHaveURL("/login");
    await expect(
      page.getByRole("button", { name: /continue with google/i })
    ).toBeVisible();
  });
});
