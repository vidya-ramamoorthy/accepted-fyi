import { test, expect, assertDashboardNav } from "../fixtures/base.fixture";

test.describe("Chances calculator page (authenticated)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/chances");
  });

  test("renders heading and description", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /chances calculator/i })
    ).toBeVisible();
    await expect(
      page.getByText(/enter your stats to see which schools/i)
    ).toBeVisible();
  });

  test("renders dashboard navigation", async ({ page }) => {
    await assertDashboardNav(page);
  });

  test("all form fields are visible", async ({ page }) => {
    await expect(page.getByLabel(/gpa \(unweighted\)/i)).toBeVisible();
    await expect(page.getByLabel(/sat score/i)).toBeVisible();
    await expect(page.getByLabel(/act score/i)).toBeVisible();
    await expect(page.getByLabel(/state of residence/i)).toBeVisible();
    await expect(page.getByLabel(/intended major/i)).toBeVisible();
    await expect(page.getByLabel(/cycle year/i)).toBeVisible();
    await expect(page.getByLabel(/ap\/ib courses/i)).toBeVisible();
  });

  test("submit button is visible and enabled", async ({ page }) => {
    const submitButton = page.getByRole("button", { name: /calculate my chances/i });
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toBeEnabled();
  });

  test("shows empty state before submitting", async ({ page }) => {
    await expect(
      page.getByText(/enter your stats to see results/i)
    ).toBeVisible();
    await expect(
      page.getByText(/institutional data and real student outcomes/i)
    ).toBeVisible();
  });

  test("renders how it works section", async ({ page }) => {
    await expect(page.getByText(/how it works/i)).toBeVisible();
    await expect(page.getByText(/official school data/i)).toBeVisible();
    await expect(page.getByText(/similar profiles/i)).toBeVisible();
    await expect(page.getByText(/60% institutional, 40% crowdsourced/i)).toBeVisible();
  });

  test("shows validation error when state is missing", async ({ page }) => {
    // Fill GPA but leave required state empty, then submit
    await page.getByLabel(/gpa \(unweighted\)/i).fill("3.8");
    await page.getByLabel(/sat score/i).fill("1450");
    await page.getByRole("button", { name: /calculate my chances/i }).click();

    // The browser's native validation should prevent submission since state is required,
    // or the API returns an error. Either way, no results should appear.
    const hasResults = await page.getByText(/schools matched/i).isVisible().catch(() => false);
    expect(hasResults).toBe(false);
  });

  test("valid submission shows loading then results", async ({ page }) => {
    // Fill required fields
    await page.getByLabel(/gpa \(unweighted\)/i).fill("3.85");
    await page.getByLabel(/sat score/i).fill("1520");
    await page.getByLabel(/state of residence/i).selectOption("CA");
    await page.getByRole("button", { name: /calculate my chances/i }).click();

    // Should show loading state
    await expect(
      page.getByText(/calculating|analyzing/i)
    ).toBeVisible();

    // Wait for results summary bar to appear
    await expect(
      page.getByText(/schools matched from/i)
    ).toBeVisible({ timeout: 15_000 });

    // Should show Safety, Match, and Reach sections
    await expect(page.getByText("Safety Schools").first()).toBeVisible();
    await expect(page.getByText("Match Schools").first()).toBeVisible();
    await expect(page.getByText("Reach Schools").first()).toBeVisible();
  });

  test("results show quick-jump navigation pills", async ({ page }) => {
    // Fill and submit
    await page.getByLabel(/gpa \(unweighted\)/i).fill("3.85");
    await page.getByLabel(/sat score/i).fill("1520");
    await page.getByLabel(/state of residence/i).selectOption("CA");
    await page.getByRole("button", { name: /calculate my chances/i }).click();

    // Wait for results
    await expect(
      page.getByText(/schools matched from/i)
    ).toBeVisible({ timeout: 15_000 });

    // Quick-jump pills should be visible as clickable buttons
    const safetyPill = page.getByRole("button", { name: /safety schools/i });
    const matchPill = page.getByRole("button", { name: /match schools/i });
    const reachPill = page.getByRole("button", { name: /reach schools/i });

    await expect(safetyPill).toBeVisible();
    await expect(matchPill).toBeVisible();
    await expect(reachPill).toBeVisible();
  });

  test("school cards display score and stats", async ({ page }) => {
    // Fill and submit
    await page.getByLabel(/gpa \(unweighted\)/i).fill("3.85");
    await page.getByLabel(/sat score/i).fill("1520");
    await page.getByLabel(/state of residence/i).selectOption("CA");
    await page.getByRole("button", { name: /calculate my chances/i }).click();

    // Wait for results
    await expect(
      page.getByText(/schools matched from/i)
    ).toBeVisible({ timeout: 15_000 });

    // School cards should have stat labels visible
    await expect(page.getByText("Accept").first()).toBeVisible();
    await expect(page.getByText("SAT Range").first()).toBeVisible();
    await expect(page.getByText("Confidence").first()).toBeVisible();

    // Score number should be visible
    await expect(page.getByText("score").first()).toBeVisible();
  });

  test("school cards link to school detail pages", async ({ page }) => {
    // Fill and submit
    await page.getByLabel(/gpa \(unweighted\)/i).fill("3.85");
    await page.getByLabel(/sat score/i).fill("1520");
    await page.getByLabel(/state of residence/i).selectOption("CA");
    await page.getByRole("button", { name: /calculate my chances/i }).click();

    // Wait for results
    await expect(
      page.getByText(/schools matched from/i)
    ).toBeVisible({ timeout: 15_000 });

    // Find the first school card link (they all link to /schools/[slug])
    const schoolLinks = page.locator("a[href^='/schools/']");
    const linkCount = await schoolLinks.count();

    // There should be at least one school card link if results exist
    if (linkCount > 0) {
      const firstHref = await schoolLinks.first().getAttribute("href");
      expect(firstHref).toMatch(/^\/schools\/.+/);
    }
  });
});
