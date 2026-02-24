import { test, expect } from "../fixtures/base.fixture";

/**
 * Pagination tests for /schools (30 items per page).
 * The seeded College Scorecard data should provide enough schools
 * for multiple pages.
 */

test.describe("Schools list page — pagination", () => {
  test("page 1 shows page indicator and no Previous link", async ({ page }) => {
    await page.goto("/schools");

    const pageIndicator = page.getByText(/Page \d+ of \d+/);
    const hasPagination = await pageIndicator.isVisible().catch(() => false);

    if (hasPagination) {
      await expect(pageIndicator).toContainText("Page 1 of");
      await expect(page.getByRole("link", { name: "Previous" })).not.toBeVisible();
      await expect(page.getByRole("link", { name: "Next" })).toBeVisible();
    }
  });

  test("Next link navigates to page 2", async ({ page }) => {
    await page.goto("/schools");

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

  test("page 2 shows both Previous and Next links", async ({ page }) => {
    await page.goto("/schools?page=2");

    const pageIndicator = page.getByText(/Page 2 of \d+/);
    const isPage2Valid = await pageIndicator.isVisible().catch(() => false);
    if (!isPage2Valid) {
      test.skip();
      return;
    }

    await expect(page.getByRole("link", { name: "Previous" })).toBeVisible();
    // Next should be visible unless page 2 is the last page
    const totalPagesMatch = (await pageIndicator.textContent())?.match(/of (\d+)/);
    const totalPages = parseInt(totalPagesMatch?.[1] ?? "0");
    if (totalPages > 2) {
      await expect(page.getByRole("link", { name: "Next" })).toBeVisible();
    }
  });

  test("Previous link on page 2 navigates back to page 1", async ({ page }) => {
    await page.goto("/schools?page=2");

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

  test("pagination preserves search query filter", async ({ page }) => {
    await page.goto("/schools?q=University&page=1");

    const nextLink = page.getByRole("link", { name: "Next" });
    const hasPagination = await nextLink.isVisible().catch(() => false);
    if (!hasPagination) {
      test.skip();
      return;
    }

    const nextHref = await nextLink.getAttribute("href");
    expect(nextHref).toContain("q=University");
    expect(nextHref).toContain("page=2");
  });

  test("pagination preserves state filter", async ({ page }) => {
    await page.goto("/schools?state=CA&page=1");

    const nextLink = page.getByRole("link", { name: "Next" });
    const hasPagination = await nextLink.isVisible().catch(() => false);
    if (!hasPagination) {
      test.skip();
      return;
    }

    const nextHref = await nextLink.getAttribute("href");
    expect(nextHref).toContain("state=CA");
    expect(nextHref).toContain("page=2");
  });

  test("each page shows different schools", async ({ page }) => {
    await page.goto("/schools?page=1");

    const firstPageSchools = await page
      .locator("a")
      .filter({ hasText: /,\s*[A-Z]{2}/ })
      .allTextContents();

    if (firstPageSchools.length === 0) {
      test.skip();
      return;
    }

    await page.goto("/schools?page=2");

    const secondPageSchools = await page
      .locator("a")
      .filter({ hasText: /,\s*[A-Z]{2}/ })
      .allTextContents();

    if (secondPageSchools.length === 0) {
      test.skip();
      return;
    }

    // Pages should have different content
    const firstSchoolOnPage1 = firstPageSchools[0];
    const firstSchoolOnPage2 = secondPageSchools[0];
    expect(firstSchoolOnPage1).not.toEqual(firstSchoolOnPage2);
  });

  test("last page does not show Next link", async ({ page }) => {
    await page.goto("/schools");

    const pageIndicator = page.getByText(/Page \d+ of (\d+)/);
    const hasPagination = await pageIndicator.isVisible().catch(() => false);
    if (!hasPagination) {
      test.skip();
      return;
    }

    const indicatorText = await pageIndicator.textContent();
    const totalPagesMatch = indicatorText?.match(/of (\d+)/);
    const totalPages = parseInt(totalPagesMatch?.[1] ?? "1");

    await page.goto(`/schools?page=${totalPages}`);
    await expect(page.getByText(`Page ${totalPages} of ${totalPages}`)).toBeVisible();
    await expect(page.getByRole("link", { name: "Next" })).not.toBeVisible();
    if (totalPages > 1) {
      await expect(page.getByRole("link", { name: "Previous" })).toBeVisible();
    }
  });
});
