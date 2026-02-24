import { test, expect, assertDashboardNav } from "../fixtures/base.fixture";

test.describe("Dashboard page (authenticated)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard");
  });

  test("renders dashboard heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /my dashboard/i })
    ).toBeVisible();
  });

  test("renders dashboard navigation", async ({ page }) => {
    await assertDashboardNav(page);
  });

  test("shows Add Result button linking to /submit", async ({ page }) => {
    const addResultLink = page.getByRole("link", { name: /add result/i });
    await expect(addResultLink).toBeVisible();
    await expect(addResultLink).toHaveAttribute("href", "/submit");
  });

  test("shows submissions list or empty state", async ({ page }) => {
    const hasSubmissions = await page.locator(".rounded-xl").filter({ hasText: /accepted|rejected|waitlisted|deferred/i }).count() > 0;
    const hasEmptyState = await page.getByText(/no submissions yet/i).isVisible().catch(() => false);

    expect(hasSubmissions || hasEmptyState).toBe(true);
  });

  test("dashboard nav links are accessible", async ({ page }) => {
    // Desktop nav links (hidden on mobile but still in DOM)
    await expect(page.getByRole("link", { name: "Dashboard" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Browse" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Schools" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Chances" }).first()).toBeVisible();
  });
});
