import { test, expect, assertPublicNav, assertNotFoundResponse } from "../fixtures/base.fixture";

test.describe("Colleges combination pages (state + dimension)", () => {
  test.describe("State + SAT", () => {
    test("renders heading with state and SAT range", async ({ page }) => {
      await page.goto("/colleges/state/california/sat/1400-1500");
      await assertPublicNav(page);
      await expect(
        page.getByRole("heading", { name: /california colleges for 1400-1500 SAT/i })
      ).toBeVisible();
    });

    test("shows breadcrumb navigation with parent links", async ({ page }) => {
      await page.goto("/colleges/state/california/sat/1400-1500");
      // Breadcrumb should have links to /colleges and /colleges/state/california
      await expect(
        page.getByRole("link", { name: "Colleges" }).first()
      ).toBeVisible();
      await expect(
        page.getByRole("link", { name: "California" }).first()
      ).toBeVisible();
    });

    test("returns 404 for invalid state in combo", async ({ page }) => {
      const response = await page.goto("/colleges/state/not-a-state/sat/1400-1500");
      await assertNotFoundResponse(page, response);
    });

    test("returns 404 for invalid SAT range in combo", async ({ page }) => {
      const response = await page.goto("/colleges/state/california/sat/9999-10000");
      await assertNotFoundResponse(page, response);
    });
  });

  test.describe("State + Acceptance Rate", () => {
    test("renders heading with state and acceptance rate", async ({ page }) => {
      await page.goto("/colleges/state/california/acceptance-rate/under-10");
      await assertPublicNav(page);
      await expect(
        page.getByRole("heading", {
          name: /california colleges with under 10% acceptance rate/i,
        })
      ).toBeVisible();
    });

    test("returns 404 for invalid acceptance rate in combo", async ({ page }) => {
      const response = await page.goto(
        "/colleges/state/california/acceptance-rate/not-a-range"
      );
      await assertNotFoundResponse(page, response);
    });
  });
});
