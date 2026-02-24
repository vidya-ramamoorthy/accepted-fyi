import { test, expect } from "../fixtures/base.fixture";

test.describe("Colleges state page — FilterableSchoolGrid filters", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/colleges/state/california");
    // Wait for client hydration so filters are interactive
    await expect(page.getByText(/Showing \d+ of \d+ schools/)).toBeVisible({ timeout: 10_000 });
  });

  test("acceptance rate filter updates URL and reduces results", async ({ page }) => {
    const countText = page.getByText(/Showing \d+ of \d+ schools/);
    const initialText = await countText.textContent();

    await page.getByLabel("Filter by acceptance rate").selectOption("under-10");

    await expect(page).toHaveURL(/acceptanceRate=under-10/);
    await expect(page.getByRole("button", { name: "Clear filters" })).toBeVisible();

    const filteredText = await countText.textContent();
    // Filtered count should differ from total (or at least URL updated)
    expect(filteredText).not.toEqual(initialText);
  });

  test("SAT score filter updates URL and filters results", async ({ page }) => {
    await page.getByLabel("Filter by SAT score").selectOption("1400-1500");

    await expect(page).toHaveURL(/sat=1400-1500/);
    await expect(page.getByRole("button", { name: "Clear filters" })).toBeVisible();
    await expect(page.getByText(/Showing \d+ of \d+ schools/)).toBeVisible();
  });

  test("ACT score filter updates URL and filters results", async ({ page }) => {
    await page.getByLabel("Filter by ACT score").selectOption("30-33");

    await expect(page).toHaveURL(/act=30-33/);
    await expect(page.getByRole("button", { name: "Clear filters" })).toBeVisible();
    await expect(page.getByText(/Showing \d+ of \d+ schools/)).toBeVisible();
  });

  test("school type filter updates URL and filters results", async ({ page }) => {
    await page.getByLabel("Filter by school type").selectOption("public");

    await expect(page).toHaveURL(/schoolType=public/);
    await expect(page.getByRole("button", { name: "Clear filters" })).toBeVisible();
    await expect(page.getByText(/Showing \d+ of \d+ schools/)).toBeVisible();
  });

  test("state filter is hidden on state-scoped pages", async ({ page }) => {
    // On /colleges/state/california, the state filter should not be visible
    const stateFilter = page.getByLabel("Filter by state");
    await expect(stateFilter).not.toBeVisible();
  });

  test("multiple filters combine correctly", async ({ page }) => {
    await page.getByLabel("Filter by acceptance rate").selectOption("under-10");
    await page.getByLabel("Filter by school type").selectOption("private");

    await expect(page).toHaveURL(/acceptanceRate=under-10/);
    await expect(page).toHaveURL(/schoolType=private/);
    await expect(page.getByText(/Showing \d+ of \d+ schools/)).toBeVisible();
  });

  test("clear filters resets all filters and removes URL params", async ({ page }) => {
    // Apply a filter first
    await page.getByLabel("Filter by SAT score").selectOption("1500-1600");
    await expect(page).toHaveURL(/sat=1500-1600/);

    // Clear
    await page.getByRole("button", { name: "Clear filters" }).click();

    // URL should no longer have filter params
    await expect(page).not.toHaveURL(/sat=/);
    await expect(page.getByRole("button", { name: "Clear filters" })).not.toBeVisible();
  });

  test("restrictive filter shows no-match empty state", async ({ page }) => {
    // Apply very restrictive filters that likely yield zero results
    await page.getByLabel("Filter by acceptance rate").selectOption("under-10");
    await page.getByLabel("Filter by school type").selectOption("community_college");

    // Should show either "0 of X" or the "No schools match" message
    const noMatchVisible = await page.getByText(/no schools match your filters/i).isVisible().catch(() => false);
    const zeroCount = await page.getByText(/Showing 0 of \d+ schools/).isVisible().catch(() => false);

    expect(noMatchVisible || zeroCount).toBe(true);
  });

  test("filter persists after page navigation via URL params", async ({ page }) => {
    await page.getByLabel("Filter by acceptance rate").selectOption("10-20");
    await expect(page).toHaveURL(/acceptanceRate=10-20/);

    // Reload page with same URL
    await page.reload();
    await expect(page.getByText(/Showing \d+ of \d+ schools/)).toBeVisible({ timeout: 10_000 });

    // Filter should still be selected
    const selectedValue = await page.getByLabel("Filter by acceptance rate").inputValue();
    expect(selectedValue).toBe("10-20");
  });
});
