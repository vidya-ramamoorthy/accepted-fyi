import { test, expect, assertPublicNav, assertJsonLd } from "../fixtures/base.fixture";

test.describe("UC Schools hub page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/uc-schools");
  });

  test("renders heading and navigation", async ({ page }) => {
    await assertPublicNav(page);
    await expect(
      page.getByRole("heading", { name: "University of California System" })
    ).toBeVisible();
  });

  test("renders system-wide aggregate stats", async ({ page }) => {
    await expect(page.getByText("Community Submissions")).toBeVisible();
  });

  test("renders decision timeline section", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "When Do UC Decisions Come Out?" })
    ).toBeVisible();
  });

  test("renders all 9 UC campuses section", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "All 9 UC Campuses" })
    ).toBeVisible();
  });

  test("renders UC admissions info section", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Why UC Admissions Are Different" })
    ).toBeVisible();
    await expect(page.getByText("No Early Decision or Early Action")).toBeVisible();
    await expect(page.getByText("Separate UC application")).toBeVisible();
    await expect(page.getByText("Test-Free (permanent policy)")).toBeVisible();
  });

  test("renders JSON-LD structured data", async ({ page }) => {
    await assertJsonLd(page);
  });

  test("renders breadcrumb back to colleges", async ({ page }) => {
    const breadcrumb = page.getByRole("link", { name: /Browse Colleges/i }).first();
    await expect(breadcrumb).toBeVisible();
    await expect(breadcrumb).toHaveAttribute("href", "/colleges");
  });

  test("renders Explore More cross-links", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Explore More" })).toBeVisible();
    await expect(page.getByRole("link", { name: "All California Colleges" })).toBeVisible();
    await expect(page.getByRole("link", { name: "MIT Admissions Data" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Chances Calculator" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Browse All Colleges" })).toBeVisible();
  });
});
