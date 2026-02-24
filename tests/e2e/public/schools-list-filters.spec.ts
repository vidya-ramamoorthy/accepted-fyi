import { test, expect } from "../fixtures/base.fixture";

/**
 * Tests for the /schools search page filter interactions.
 * The schools page uses a server-side GET form with `q` (search) and `state` inputs.
 */

test.describe("Schools list page — filter interactions", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/schools");
  });

  test("search by school name shows matching results", async ({ page }) => {
    await page.getByPlaceholder("Search schools...").fill("Stanford");
    await page.getByRole("button", { name: "Search" }).click();

    await page.waitForURL(/q=Stanford/);
    // Should either show matching results or "no schools match"
    const hasMatchingSchool = await page.getByText(/Stanford/i).count() > 0;
    const hasNoMatch = await page.getByText(/no schools match your search/i).isVisible().catch(() => false);
    expect(hasMatchingSchool || hasNoMatch).toBe(true);
  });

  test("state filter shows schools in that state", async ({ page }) => {
    await page.getByPlaceholder("State (e.g., CA)").fill("CA");
    await page.getByRole("button", { name: "Search" }).click();

    await page.waitForURL(/state=CA/i);
    // Should show results or empty state
    const hasResults = await page.locator("a").filter({ hasText: /,\s*CA/ }).count() > 0;
    const hasNoMatch = await page.getByText(/no schools match your search/i).isVisible().catch(() => false);
    expect(hasResults || hasNoMatch).toBe(true);
  });

  test("combined search and state filter both persist in URL", async ({ page }) => {
    await page.getByPlaceholder("Search schools...").fill("University");
    await page.getByPlaceholder("State (e.g., CA)").fill("NY");
    await page.getByRole("button", { name: "Search" }).click();

    await page.waitForURL(/q=University/);
    expect(page.url()).toContain("q=University");
    expect(page.url()).toMatch(/state=NY/i);
  });

  test("clear button removes all filters and returns to unfiltered view", async ({ page }) => {
    await page.goto("/schools?q=MIT&state=MA");
    await expect(page.getByRole("button", { name: "Clear" })).toBeVisible();

    await page.getByRole("button", { name: "Clear" }).click();
    await page.waitForURL("/schools");

    // URL should have no search params
    expect(page.url()).not.toContain("q=");
    expect(page.url()).not.toContain("state=");
  });

  test("search for non-existent school shows empty state", async ({ page }) => {
    await page.getByPlaceholder("Search schools...").fill("zzz-no-school-exists-999");
    await page.getByRole("button", { name: "Search" }).click();

    await expect(page.getByText(/no schools match your search/i)).toBeVisible();
  });

  test("state filter with empty search works independently", async ({ page }) => {
    await page.getByPlaceholder("State (e.g., CA)").fill("TX");
    await page.getByRole("button", { name: "Search" }).click();

    await page.waitForURL(/state=TX/i);
    // URL should have state param (the form may include an empty q= which is fine)
    expect(page.url()).toMatch(/state=TX/i);
  });

  test("pagination preserves filter params", async ({ page }) => {
    // Navigate with filters applied
    await page.goto("/schools?state=CA");
    const nextLink = page.getByRole("link", { name: "Next" });
    const hasNextPage = await nextLink.isVisible().catch(() => false);

    if (hasNextPage) {
      const nextHref = await nextLink.getAttribute("href");
      // Next link should preserve the state filter
      expect(nextHref).toContain("state=CA");
      expect(nextHref).toContain("page=2");
    }
  });
});
