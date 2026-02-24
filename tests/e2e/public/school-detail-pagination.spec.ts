import { test, expect } from "../fixtures/base.fixture";

/**
 * Pagination tests for /schools/[slug] (20 submissions per page).
 * Schools with many Reddit-sourced submissions (Stanford, MIT, etc.)
 * should have multiple pages.
 */

test.describe("School detail page — pagination", () => {
  // Use a popular school that likely has 20+ submissions from Reddit ingestion
  const POPULAR_SCHOOL_SLUGS = ["stanford-university", "massachusetts-institute-of-technology"];

  /**
   * Navigate to a popular school that has pagination.
   * Returns true if pagination is present, false otherwise.
   */
  async function navigateToSchoolWithPagination(page: import("@playwright/test").Page): Promise<boolean> {
    for (const slug of POPULAR_SCHOOL_SLUGS) {
      await page.goto(`/schools/${slug}`);
      const pageIndicator = page.getByText(/Page \d+ of \d+/);
      const hasPagination = await pageIndicator.isVisible().catch(() => false);
      if (hasPagination) return true;
    }
    return false;
  }

  test("page 1 shows submissions and page indicator", async ({ page }) => {
    const hasPagination = await navigateToSchoolWithPagination(page);
    if (!hasPagination) {
      test.skip();
      return;
    }

    await expect(page.getByText(/Page 1 of/)).toBeVisible();
    await expect(page.getByRole("link", { name: "Previous" })).not.toBeVisible();
    await expect(page.getByRole("link", { name: "Next" })).toBeVisible();
  });

  test("Next link navigates to page 2", async ({ page }) => {
    const hasPagination = await navigateToSchoolWithPagination(page);
    if (!hasPagination) {
      test.skip();
      return;
    }

    await page.getByRole("link", { name: "Next" }).click();
    await expect(page).toHaveURL(/page=2/);
    await expect(page.getByText(/Page 2 of/)).toBeVisible();
  });

  test("page 2 shows Previous link", async ({ page }) => {
    const hasPagination = await navigateToSchoolWithPagination(page);
    if (!hasPagination) {
      test.skip();
      return;
    }

    await page.getByRole("link", { name: "Next" }).click();
    await expect(page).toHaveURL(/page=2/);
    await expect(page.getByRole("link", { name: "Previous" })).toBeVisible();
  });

  test("Previous link on page 2 goes back to page 1", async ({ page }) => {
    const hasPagination = await navigateToSchoolWithPagination(page);
    if (!hasPagination) {
      test.skip();
      return;
    }

    await page.getByRole("link", { name: "Next" }).click();
    await expect(page).toHaveURL(/page=2/);

    await page.getByRole("link", { name: "Previous" }).click();
    await expect(page).toHaveURL(/page=1/);
    await expect(page.getByText(/Page 1 of/)).toBeVisible();
  });

  test("page 1 and page 2 show different submissions", async ({ page }) => {
    const hasPagination = await navigateToSchoolWithPagination(page);
    if (!hasPagination) {
      test.skip();
      return;
    }

    // Get first submission's text content on page 1
    const submissionCards = page.locator("[class*='rounded-xl'][class*='border']").filter({ hasText: /GPA|SAT|ACT/ });
    const page1FirstCard = await submissionCards.first().textContent();

    await page.getByRole("link", { name: "Next" }).click();
    await expect(page).toHaveURL(/page=2/);

    const page2FirstCard = await submissionCards.first().textContent();
    expect(page1FirstCard).not.toEqual(page2FirstCard);
  });
});
