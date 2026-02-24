import { test, expect } from "../fixtures/base.fixture";

/**
 * Tests for SubmissionFilters interactions on the /browse page (authenticated).
 * Each filter field is tested for URL param updates and result changes.
 *
 * Note: School, State, and Major inputs now have autocomplete dropdowns.
 * After filling these fields, we press Escape to close the dropdown before
 * clicking "Apply Filters", since the dropdown can intercept button clicks.
 */

test.describe("Browse page — filter interactions", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/browse");
    await expect(page.getByRole("heading", { name: /browse admissions data/i })).toBeVisible();
    await expect(page.getByText(/\d+ results? found/i)).toBeVisible();
  });

  test("school search filter updates URL after Apply", async ({ page }) => {
    await page.getByLabel("School").fill("Stanford");
    await page.getByLabel("School").press("Escape");
    await page.getByRole("button", { name: "Apply Filters" }).click();

    await expect(page).toHaveURL(/school=Stanford/);
  });

  test("decision dropdown filter updates URL after Apply", async ({ page }) => {
    await page.getByLabel("Decision").selectOption("accepted");
    await page.getByRole("button", { name: "Apply Filters" }).click();

    await expect(page).toHaveURL(/decision=accepted/);
  });

  test("cycle dropdown filter updates URL after Apply", async ({ page }) => {
    await page.getByLabel("Cycle").selectOption("2024-2025");
    await page.getByRole("button", { name: "Apply Filters" }).click();

    await expect(page).toHaveURL(/cycle=2024-2025/);
  });

  test("state filter updates URL after Apply", async ({ page }) => {
    await page.getByLabel("State").fill("CA");
    await page.getByLabel("State").press("Escape");
    await page.getByRole("button", { name: "Apply Filters" }).click();

    await expect(page).toHaveURL(/state=CA/);
  });

  test("major filter updates URL after Apply", async ({ page }) => {
    await page.getByLabel("Major").fill("Computer Science");
    await page.getByLabel("Major").press("Escape");
    await page.getByRole("button", { name: "Apply Filters" }).click();

    await expect(page).toHaveURL(/major=Computer/);
  });

  test("data source dropdown filter updates URL after Apply", async ({ page }) => {
    await page.getByLabel("Data Source").selectOption("reddit");
    await page.getByRole("button", { name: "Apply Filters" }).click();

    await expect(page).toHaveURL(/source=reddit/);
  });

  test("Enter key in school input applies filters", async ({ page }) => {
    await page.getByLabel("School").fill("MIT");
    await page.getByLabel("School").press("Escape");
    await page.getByLabel("School").press("Enter");

    await expect(page).toHaveURL(/school=MIT/);
  });

  test("Enter key in state input applies filters", async ({ page }) => {
    await page.getByLabel("State").fill("NY");
    await page.getByLabel("State").press("Escape");
    await page.getByLabel("State").press("Enter");

    await expect(page).toHaveURL(/state=NY/);
  });

  test("Enter key in major input applies filters", async ({ page }) => {
    await page.getByLabel("Major").fill("Biology");
    await page.getByLabel("Major").press("Escape");
    await page.getByLabel("Major").press("Enter");

    await expect(page).toHaveURL(/major=Biology/);
  });

  test("multiple filters combine in URL", async ({ page }) => {
    await page.getByLabel("School").fill("UCLA");
    await page.getByLabel("School").press("Escape");
    await page.getByLabel("Decision").selectOption("accepted");
    await page.getByLabel("Cycle").selectOption("2025-2026");
    await page.getByRole("button", { name: "Apply Filters" }).click();

    await expect(page).toHaveURL(/school=UCLA/);
    await expect(page).toHaveURL(/decision=accepted/);
    await expect(page).toHaveURL(/cycle=2025-2026/);
  });

  test("Clear all button removes all filters and resets URL", async ({ page }) => {
    // Apply some filters first
    await page.getByLabel("School").fill("Harvard");
    await page.getByLabel("School").press("Escape");
    await page.getByLabel("Decision").selectOption("rejected");
    await page.getByRole("button", { name: "Apply Filters" }).click();
    await expect(page).toHaveURL(/school=Harvard/);

    // Clear all
    await page.getByRole("button", { name: "Clear all" }).click();
    await page.waitForURL("/browse");

    // URL should be clean
    expect(page.url()).not.toContain("school=");
    expect(page.url()).not.toContain("decision=");

    // Inputs should be reset
    const schoolValue = await page.getByLabel("School").inputValue();
    expect(schoolValue).toBe("");
  });

  test("Clear all button is not visible with no active filters", async ({ page }) => {
    await expect(page.getByRole("button", { name: "Clear all" })).not.toBeVisible();
  });

  test("non-matching school filter shows empty state", async ({ page }) => {
    await page.getByLabel("School").fill("zzz-no-match-999");
    await page.getByLabel("School").press("Escape");
    await page.getByRole("button", { name: "Apply Filters" }).click();

    await expect(page.getByText(/no submissions match your filters/i)).toBeVisible();
  });

  test("decision options include all valid values", async ({ page }) => {
    const decisionSelect = page.getByLabel("Decision");
    await expect(decisionSelect.locator("option", { hasText: "All Decisions" })).toBeAttached();
    await expect(decisionSelect.locator("option", { hasText: "Accepted" })).toBeAttached();
    await expect(decisionSelect.locator("option", { hasText: "Rejected" })).toBeAttached();
    await expect(decisionSelect.locator("option", { hasText: "Waitlisted" })).toBeAttached();
    await expect(decisionSelect.locator("option", { hasText: "Deferred" })).toBeAttached();
  });

  test("cycle options include expected values", async ({ page }) => {
    const cycleSelect = page.getByLabel("Cycle");
    await expect(cycleSelect.locator("option", { hasText: "All Cycles" })).toBeAttached();
    await expect(cycleSelect.locator("option", { hasText: "2025-2026" })).toBeAttached();
    await expect(cycleSelect.locator("option", { hasText: "2024-2025" })).toBeAttached();
    await expect(cycleSelect.locator("option", { hasText: "2023-2024" })).toBeAttached();
  });

  test("state input auto-uppercases text", async ({ page }) => {
    await page.getByLabel("State").fill("ca");
    const stateValue = await page.getByLabel("State").inputValue();
    expect(stateValue).toBe("CA");
  });

  test("state input accepts full state names for autocomplete search", async ({ page }) => {
    await page.getByLabel("State").fill("CALIFORNIA");
    const stateValue = await page.getByLabel("State").inputValue();
    expect(stateValue).toBe("CALIFORNIA");
  });

  test("filter results update the result count", async ({ page }) => {
    const initialCountText = await page.getByText(/\d+ results? found/i).textContent();

    await page.getByLabel("Decision").selectOption("accepted");
    await page.getByRole("button", { name: "Apply Filters" }).click();

    await expect(page.getByText(/\d+ results? found/i)).toBeVisible();
    const filteredCountText = await page.getByText(/\d+ results? found/i).textContent();

    // The count should be present (may or may not differ depending on data)
    expect(filteredCountText).toBeTruthy();
    // If there's data, filtered count should be <= initial count
    const initialCount = parseInt(initialCountText!.match(/(\d+)/)?.[1] ?? "0");
    const filteredCount = parseInt(filteredCountText!.match(/(\d+)/)?.[1] ?? "0");
    expect(filteredCount).toBeLessThanOrEqual(initialCount);
  });
});
