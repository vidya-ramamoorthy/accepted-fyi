import { test, expect, assertPublicNav } from "../fixtures/base.fixture";

test.describe("Schools list page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/schools");
  });

  test("renders heading and navigation", async ({ page }) => {
    await assertPublicNav(page);
    await expect(page.getByRole("heading", { name: "Schools" })).toBeVisible();
  });

  test("renders search form with inputs and button", async ({ page }) => {
    const searchForm = page.locator("form");
    await expect(searchForm.getByPlaceholder("Search schools...")).toBeVisible();
    await expect(searchForm.getByPlaceholder("State (e.g., CA)")).toBeVisible();
    await expect(searchForm.getByRole("button", { name: "Search" })).toBeVisible();
  });

  test("search filters persist in URL params", async ({ page }) => {
    await page.getByPlaceholder("Search schools...").fill("MIT");
    await page.getByRole("button", { name: "Search" }).click();

    await page.waitForURL(/q=MIT/);
    expect(page.url()).toContain("q=MIT");
  });

  test("state filter persists in URL params", async ({ page }) => {
    await page.getByPlaceholder("State (e.g., CA)").fill("CA");
    await page.getByRole("button", { name: "Search" }).click();

    await page.waitForURL(/state=CA/i);
  });

  test("clear filters link appears when filters are active", async ({ page }) => {
    await page.goto("/schools?q=Stanford");
    await expect(page.getByRole("link", { name: "Clear" })).toBeVisible();
  });

  test("clear link is not visible with no filters", async ({ page }) => {
    await expect(page.getByRole("link", { name: "Clear" })).not.toBeVisible();
  });

  test("shows results or empty state", async ({ page }) => {
    // Page should either show school cards (links) or an empty state message
    const schoolLinks = page.locator("a").filter({ hasText: /,\s*[A-Z]{2}/ });
    const emptyState = page.getByText(/no schools match|be the first to contribute/i);

    const hasSchools = await schoolLinks.count() > 0;
    const hasEmptyState = await emptyState.isVisible().catch(() => false);

    expect(hasSchools || hasEmptyState).toBe(true);
  });

  test("no-match search shows empty state", async ({ page }) => {
    await page.getByPlaceholder("Search schools...").fill("xyznonexistentschool999");
    await page.getByRole("button", { name: "Search" }).click();

    await expect(page.getByText(/no schools match your search/i)).toBeVisible();
  });
});
