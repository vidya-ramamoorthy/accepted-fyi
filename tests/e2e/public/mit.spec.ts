import { test, expect, assertPublicNav, assertJsonLd } from "../fixtures/base.fixture";

test.describe("MIT admissions page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/mit");
  });

  test("renders heading and navigation", async ({ page }) => {
    await assertPublicNav(page);
    await expect(
      page.getByRole("heading", { name: "MIT Admissions Data" })
    ).toBeVisible();
  });

  test("renders Pi Day decision callout", async ({ page }) => {
    await expect(page.getByText("Pi Day Decisions")).toBeVisible();
    await expect(page.getByText("March 14")).toBeVisible();
  });

  test("renders official data section when available", async ({ page }) => {
    // The section may or may not render depending on seeded data
    const officialSection = page.getByText("Official Data");
    const isVisible = await officialSection.isVisible().catch(() => false);
    if (isVisible) {
      await expect(page.getByText("Acceptance Rate").first()).toBeVisible();
    }
  });

  test("renders community data section", async ({ page }) => {
    await expect(page.getByText("Community Data")).toBeVisible();
    await expect(page.getByText("Total Submissions")).toBeVisible();
    await expect(page.getByText("Crowdsourced Accept Rate")).toBeVisible();
  });

  test("renders recent submissions heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /Recent Submissions/ })
    ).toBeVisible();
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
    await expect(page.getByRole("link", { name: "UC System Hub" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Chances Calculator" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Browse All Colleges" })).toBeVisible();
  });
});
