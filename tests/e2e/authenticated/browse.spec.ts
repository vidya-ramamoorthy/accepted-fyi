import { test, expect, assertDashboardNav } from "../fixtures/base.fixture";

test.describe("Browse page (authenticated)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/browse");
  });

  test("renders heading with result count", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /browse admissions data/i })
    ).toBeVisible();
    // Should show "X result(s) found"
    await expect(
      page.getByText(/\d+ results? found/i)
    ).toBeVisible();
  });

  test("renders dashboard navigation", async ({ page }) => {
    await assertDashboardNav(page);
  });

  test("renders Add Result CTA", async ({ page }) => {
    const addResultLink = page.getByRole("link", { name: /add result/i });
    await expect(addResultLink).toBeVisible();
    await expect(addResultLink).toHaveAttribute("href", "/submit");
  });

  test("renders filter controls", async ({ page }) => {
    // SubmissionFilters component should be present
    await expect(page.getByLabel("School")).toBeVisible();
    await expect(page.getByLabel("Decision")).toBeVisible();
    await expect(page.getByLabel("Cycle")).toBeVisible();
    await expect(page.getByLabel("State")).toBeVisible();
    await expect(page.getByLabel("Major")).toBeVisible();
    await expect(page.getByLabel("Data Source")).toBeVisible();
    await expect(page.getByRole("button", { name: "Apply Filters" })).toBeVisible();
  });

  test("shows submission cards or empty state", async ({ page }) => {
    const hasCards = await page.locator(".rounded-xl").filter({ hasText: /accepted|rejected|waitlisted|deferred/i }).count() > 0;
    const hasEmptyState = await page.getByText(/no submissions match your filters/i).isVisible().catch(() => false);

    expect(hasCards || hasEmptyState).toBe(true);
  });

  test("data source filter includes Reddit option", async ({ page }) => {
    const sourceSelect = page.getByLabel("Data Source");
    await expect(sourceSelect.locator("option", { hasText: "Reddit" })).toBeAttached();
  });

  test("data source filter does not include removed sources", async ({ page }) => {
    const sourceSelect = page.getByLabel("Data Source");
    await expect(sourceSelect.locator("option", { hasText: "College Confidential" })).not.toBeAttached();
    await expect(sourceSelect.locator("option", { hasText: "Public Scraped" })).not.toBeAttached();
  });
});
