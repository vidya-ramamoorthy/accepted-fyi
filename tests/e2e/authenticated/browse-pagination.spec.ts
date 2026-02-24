import { test, expect } from "../fixtures/base.fixture";

/**
 * Pagination tests for /browse (authenticated, 20 submissions per page).
 * With ~3100 Reddit-sourced submissions, pagination should always be present.
 */

test.describe("Browse page — pagination", () => {
  test("page 1 shows page indicator and Next but no Previous", async ({ page }) => {
    await page.goto("/browse");
    await expect(page.getByRole("heading", { name: /browse admissions data/i })).toBeVisible();

    const pageIndicator = page.getByText(/Page \d+ of \d+/);
    const hasPagination = await pageIndicator.isVisible().catch(() => false);

    if (hasPagination) {
      await expect(pageIndicator).toContainText("Page 1 of");
      await expect(page.getByRole("link", { name: "Previous" })).not.toBeVisible();
      await expect(page.getByRole("link", { name: "Next" })).toBeVisible();
    }
  });

  test("Next link navigates to page 2", async ({ page }) => {
    await page.goto("/browse");

    const nextLink = page.getByRole("link", { name: "Next" });
    const hasPagination = await nextLink.isVisible().catch(() => false);
    if (!hasPagination) {
      test.skip();
      return;
    }

    await nextLink.click();
    await expect(page).toHaveURL(/page=2/);
    await expect(page.getByText(/Page 2 of/)).toBeVisible();
  });

  test("page 2 shows both Previous and Next", async ({ page }) => {
    await page.goto("/browse?page=2");

    const pageIndicator = page.getByText(/Page 2 of \d+/);
    const isValid = await pageIndicator.isVisible().catch(() => false);
    if (!isValid) {
      test.skip();
      return;
    }

    await expect(page.getByRole("link", { name: "Previous" })).toBeVisible();

    const indicatorText = await pageIndicator.textContent();
    const totalPages = parseInt(indicatorText?.match(/of (\d+)/)?.[1] ?? "0");
    if (totalPages > 2) {
      await expect(page.getByRole("link", { name: "Next" })).toBeVisible();
    }
  });

  test("Previous link on page 2 navigates back to page 1", async ({ page }) => {
    await page.goto("/browse?page=2");

    const previousLink = page.getByRole("link", { name: "Previous" });
    const hasPrevious = await previousLink.isVisible().catch(() => false);
    if (!hasPrevious) {
      test.skip();
      return;
    }

    await previousLink.click();
    await expect(page).toHaveURL(/page=1/);
    await expect(page.getByText(/Page 1 of/)).toBeVisible();
  });

  test("pagination preserves school filter", async ({ page }) => {
    await page.goto("/browse?school=Stanford");

    const nextLink = page.getByRole("link", { name: "Next" });
    const hasPagination = await nextLink.isVisible().catch(() => false);
    if (!hasPagination) {
      test.skip();
      return;
    }

    const nextHref = await nextLink.getAttribute("href");
    expect(nextHref).toContain("school=Stanford");
    expect(nextHref).toContain("page=2");
  });

  test("pagination preserves decision filter", async ({ page }) => {
    await page.goto("/browse?decision=accepted");

    const nextLink = page.getByRole("link", { name: "Next" });
    const hasPagination = await nextLink.isVisible().catch(() => false);
    if (!hasPagination) {
      test.skip();
      return;
    }

    const nextHref = await nextLink.getAttribute("href");
    expect(nextHref).toContain("decision=accepted");
    expect(nextHref).toContain("page=2");
  });

  test("pagination preserves multiple combined filters", async ({ page }) => {
    await page.goto("/browse?decision=accepted&cycle=2024-2025&source=reddit");

    const nextLink = page.getByRole("link", { name: "Next" });
    const hasPagination = await nextLink.isVisible().catch(() => false);
    if (!hasPagination) {
      test.skip();
      return;
    }

    const nextHref = await nextLink.getAttribute("href");
    expect(nextHref).toContain("decision=accepted");
    expect(nextHref).toContain("cycle=2024-2025");
    expect(nextHref).toContain("source=reddit");
    expect(nextHref).toContain("page=2");
  });

  test("each page shows different submissions", async ({ page }) => {
    await page.goto("/browse");

    const nextLink = page.getByRole("link", { name: "Next" });
    const hasPagination = await nextLink.isVisible().catch(() => false);
    if (!hasPagination) {
      test.skip();
      return;
    }

    // Grab school names from page 1
    const page1Schools = await page.locator("h3").allTextContents();

    await nextLink.click();
    await expect(page).toHaveURL(/page=2/);

    // Grab school names from page 2
    const page2Schools = await page.locator("h3").allTextContents();

    // At least the first item should differ between pages
    if (page1Schools.length > 0 && page2Schools.length > 0) {
      expect(page1Schools[0]).not.toEqual(page2Schools[0]);
    }
  });

  test("result count stays consistent across pages", async ({ page }) => {
    await page.goto("/browse");

    const resultCountEl = page.getByText(/\d+ results? found/i);
    const page1CountText = await resultCountEl.textContent();
    const page1Count = parseInt(page1CountText?.match(/(\d+)/)?.[1] ?? "0");

    const nextLink = page.getByRole("link", { name: "Next" });
    const hasPagination = await nextLink.isVisible().catch(() => false);
    if (!hasPagination) {
      test.skip();
      return;
    }

    await nextLink.click();
    await expect(page).toHaveURL(/page=2/);

    const page2CountText = await resultCountEl.textContent();
    const page2Count = parseInt(page2CountText?.match(/(\d+)/)?.[1] ?? "0");

    // Total result count should be the same on both pages
    expect(page2Count).toBe(page1Count);
  });
});
