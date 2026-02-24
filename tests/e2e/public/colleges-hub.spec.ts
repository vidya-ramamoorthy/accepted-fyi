import { test, expect, assertPublicNav } from "../fixtures/base.fixture";

test.describe("Colleges hub page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/colleges");
  });

  test("renders heading and navigation", async ({ page }) => {
    await assertPublicNav(page);
    await expect(
      page.getByRole("heading", { name: "Browse Colleges" })
    ).toBeVisible();
  });

  test("renders all four browse sections", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "By State" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "By SAT Score" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "By ACT Score" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "By Acceptance Rate" })).toBeVisible();
  });

  test("renders 50+ state links", async ({ page }) => {
    const stateSection = page.locator("section").filter({ hasText: "By State" }).first();
    const stateLinks = stateSection.getByRole("link");
    const count = await stateLinks.count();
    // 50 US states (+ DC if included)
    expect(count).toBeGreaterThanOrEqual(50);
  });

  test("state links point to correct URLs", async ({ page }) => {
    const californiaLink = page.getByRole("link", { name: "California" }).first();
    await expect(californiaLink).toHaveAttribute("href", "/colleges/state/california");
  });

  test("SAT range links are present", async ({ page }) => {
    const satSection = page.locator("section").filter({ hasText: "By SAT Score" });
    await expect(satSection.getByRole("link", { name: "1500-1600" })).toBeVisible();
    await expect(satSection.getByRole("link", { name: "1400-1500" })).toBeVisible();
    await expect(satSection.getByRole("link", { name: "Below 900" })).toBeVisible();
  });

  test("ACT range links are present", async ({ page }) => {
    const actSection = page.locator("section").filter({ hasText: "By ACT Score" });
    await expect(actSection.getByRole("link", { name: "34-36" })).toBeVisible();
    await expect(actSection.getByRole("link", { name: "Below 18" })).toBeVisible();
  });

  test("acceptance rate range links are present", async ({ page }) => {
    const arSection = page.locator("section").filter({ hasText: "By Acceptance Rate" });
    await expect(arSection.getByRole("link", { name: "Under 10%" })).toBeVisible();
    await expect(arSection.getByRole("link", { name: "Over 70%" })).toBeVisible();
  });

  test("renders popular combinations section", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Popular Combinations" })).toBeVisible();
    await expect(page.getByRole("link", { name: "California" }).nth(1)).toBeVisible();
  });
});
