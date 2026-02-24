import { test, expect, assertPublicNav, assertJsonLd, assertNotFoundResponse } from "../fixtures/base.fixture";

test.describe("School detail page", () => {
  test("renders heading and location for a known school", async ({ page }) => {
    // Navigate from school list to find a real school
    await page.goto("/schools");

    const firstSchoolLink = page.locator("main a").filter({ hasText: /,\s*[A-Z]{2}/ }).first();
    const hasSchools = await firstSchoolLink.count() > 0;

    if (!hasSchools) {
      test.skip();
      return;
    }

    await firstSchoolLink.click();
    await page.waitForURL(/\/schools\/.+/);

    await assertPublicNav(page);
    // School name heading should be visible
    const heading = page.locator("h1");
    await expect(heading).toBeVisible();
    // Location line is the <p> right after h1, containing "City, ST"
    const locationText = page.locator("h1 + p");
    await expect(locationText).toBeVisible();
  });

  test("back link returns to school list", async ({ page }) => {
    await page.goto("/schools");

    const firstSchoolLink = page.locator("main a").filter({ hasText: /,\s*[A-Z]{2}/ }).first();
    const hasSchools = await firstSchoolLink.count() > 0;

    if (!hasSchools) {
      test.skip();
      return;
    }

    await firstSchoolLink.click();
    await page.waitForURL(/\/schools\/.+/);

    const backLink = page.getByRole("link", { name: /back to schools/i });
    await expect(backLink).toBeVisible();
    await backLink.click();
    await page.waitForURL("/schools");
  });

  test("JSON-LD structured data is present", async ({ page }) => {
    await page.goto("/schools");

    const firstSchoolLink = page.locator("main a").filter({ hasText: /,\s*[A-Z]{2}/ }).first();
    const hasSchools = await firstSchoolLink.count() > 0;

    if (!hasSchools) {
      test.skip();
      return;
    }

    await firstSchoolLink.click();
    await page.waitForURL(/\/schools\/.+/);
    await assertJsonLd(page);
  });

  test("returns 404 for invalid slug", async ({ page }) => {
    const response = await page.goto("/schools/this-school-definitely-does-not-exist-xyz");
    await assertNotFoundResponse(page, response);
  });
});
