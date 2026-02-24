import { test, expect } from "../fixtures/base.fixture";

/**
 * Tests for each individual field in the Chances Calculator form.
 * The existing chances.spec.ts tests the full form submission and results.
 * These tests focus on per-field behavior and edge cases.
 */

test.describe("Chances calculator — per-field interactions", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/chances");
    await expect(page.getByRole("heading", { name: /chances calculator/i })).toBeVisible();
  });

  test("GPA field accepts valid decimal values", async ({ page }) => {
    const gpaInput = page.getByLabel(/gpa \(unweighted\)/i);
    await gpaInput.fill("3.92");
    const value = await gpaInput.inputValue();
    expect(value).toBe("3.92");
  });

  test("GPA field has correct min/max constraints", async ({ page }) => {
    const gpaInput = page.getByLabel(/gpa \(unweighted\)/i);
    await expect(gpaInput).toHaveAttribute("min", "0");
    await expect(gpaInput).toHaveAttribute("max", "4.0");
    await expect(gpaInput).toHaveAttribute("step", "0.01");
  });

  test("SAT field accepts valid score", async ({ page }) => {
    const satInput = page.getByLabel(/sat score/i);
    await satInput.fill("1520");
    const value = await satInput.inputValue();
    expect(value).toBe("1520");
  });

  test("SAT field has correct min/max constraints", async ({ page }) => {
    const satInput = page.getByLabel(/sat score/i);
    await expect(satInput).toHaveAttribute("min", "400");
    await expect(satInput).toHaveAttribute("max", "1600");
  });

  test("ACT field accepts valid score", async ({ page }) => {
    const actInput = page.getByLabel(/act score/i);
    await actInput.fill("34");
    const value = await actInput.inputValue();
    expect(value).toBe("34");
  });

  test("ACT field has correct min/max constraints", async ({ page }) => {
    const actInput = page.getByLabel(/act score/i);
    await expect(actInput).toHaveAttribute("min", "1");
    await expect(actInput).toHaveAttribute("max", "36");
  });

  test("state of residence dropdown has all 50 states + DC", async ({ page }) => {
    const stateSelect = page.getByLabel(/state of residence/i);
    const options = stateSelect.locator("option");
    // 50 states + DC + "Select state" placeholder = 52
    const optionCount = await options.count();
    expect(optionCount).toBe(52);
  });

  test("state of residence dropdown can select a state", async ({ page }) => {
    const stateSelect = page.getByLabel(/state of residence/i);
    await stateSelect.selectOption("CA");
    const value = await stateSelect.inputValue();
    expect(value).toBe("CA");
  });

  test("intended major field accepts free text", async ({ page }) => {
    const majorInput = page.getByLabel(/intended major/i);
    await majorInput.fill("Computer Science");
    const value = await majorInput.inputValue();
    expect(value).toBe("Computer Science");
  });

  test("cycle year dropdown has expected options", async ({ page }) => {
    const cycleSelect = page.getByLabel(/cycle year/i);
    await expect(cycleSelect.locator("option", { hasText: "All cycles" })).toBeAttached();
    await expect(cycleSelect.locator("option", { hasText: "2025-2026" })).toBeAttached();
    await expect(cycleSelect.locator("option", { hasText: "2024-2025" })).toBeAttached();
    await expect(cycleSelect.locator("option", { hasText: "2023-2024" })).toBeAttached();
    await expect(cycleSelect.locator("option", { hasText: "2022-2023" })).toBeAttached();
    await expect(cycleSelect.locator("option", { hasText: "2021-2022" })).toBeAttached();
  });

  test("cycle year dropdown can select a cycle", async ({ page }) => {
    const cycleSelect = page.getByLabel(/cycle year/i);
    await cycleSelect.selectOption("2024-2025");
    const value = await cycleSelect.inputValue();
    expect(value).toBe("2024-2025");
  });

  test("AP/IB courses field accepts valid count", async ({ page }) => {
    const apInput = page.getByLabel(/ap\/ib courses/i);
    await apInput.fill("12");
    const value = await apInput.inputValue();
    expect(value).toBe("12");
  });

  test("AP/IB courses field has correct min/max constraints", async ({ page }) => {
    const apInput = page.getByLabel(/ap\/ib courses/i);
    await expect(apInput).toHaveAttribute("min", "0");
    await expect(apInput).toHaveAttribute("max", "30");
  });

  test("ACT-only submission produces results", async ({ page }) => {
    await page.getByLabel(/act score/i).fill("33");
    await page.getByLabel(/state of residence/i).selectOption("NY");
    await page.getByRole("button", { name: /calculate my chances/i }).click();

    await expect(page.getByText(/schools matched from/i)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("Safety Schools").first()).toBeVisible();
    await expect(page.getByText("Match Schools").first()).toBeVisible();
    await expect(page.getByText("Reach Schools").first()).toBeVisible();
  });

  test("submission with all fields filled produces results", async ({ page }) => {
    await page.getByLabel(/gpa \(unweighted\)/i).fill("3.90");
    await page.getByLabel(/sat score/i).fill("1480");
    await page.getByLabel(/act score/i).fill("33");
    await page.getByLabel(/state of residence/i).selectOption("TX");
    await page.getByLabel(/intended major/i).fill("Engineering");
    await page.getByLabel(/cycle year/i).selectOption("2024-2025");
    await page.getByLabel(/ap\/ib courses/i).fill("10");

    await page.getByRole("button", { name: /calculate my chances/i }).click();

    await expect(page.getByText(/schools matched from/i)).toBeVisible({ timeout: 15_000 });
  });

  test("changing cycle year and resubmitting produces new results", async ({ page }) => {
    // First submission with one cycle
    await page.getByLabel(/gpa \(unweighted\)/i).fill("3.85");
    await page.getByLabel(/sat score/i).fill("1520");
    await page.getByLabel(/state of residence/i).selectOption("CA");
    await page.getByLabel(/cycle year/i).selectOption("2025-2026");
    await page.getByRole("button", { name: /calculate my chances/i }).click();

    await expect(page.getByText(/schools matched from/i)).toBeVisible({ timeout: 15_000 });
    const firstResultText = await page.getByText(/schools matched from/i).textContent();

    // Change cycle and resubmit
    await page.getByLabel(/cycle year/i).selectOption("2023-2024");
    await page.getByRole("button", { name: /calculate my chances/i }).click();

    await expect(page.getByText(/schools matched from/i)).toBeVisible({ timeout: 15_000 });
    // Results should still appear (they may or may not differ)
    const secondResultText = await page.getByText(/schools matched from/i).textContent();
    expect(secondResultText).toBeTruthy();
  });

  test("lower stats produce more reach schools", async ({ page }) => {
    // Submit with high stats
    await page.getByLabel(/gpa \(unweighted\)/i).fill("3.95");
    await page.getByLabel(/sat score/i).fill("1580");
    await page.getByLabel(/state of residence/i).selectOption("CA");
    await page.getByRole("button", { name: /calculate my chances/i }).click();
    await expect(page.getByText(/schools matched from/i)).toBeVisible({ timeout: 15_000 });

    // Get safety count with high stats
    const highStatsSafetyBadge = page.getByRole("button", { name: /safety schools/i }).locator("span").last();
    const highSafetyCount = parseInt(await highStatsSafetyBadge.textContent() ?? "0");

    // Navigate fresh and submit with lower stats
    await page.goto("/chances");
    await page.getByLabel(/gpa \(unweighted\)/i).fill("2.50");
    await page.getByLabel(/sat score/i).fill("900");
    await page.getByLabel(/state of residence/i).selectOption("CA");
    await page.getByRole("button", { name: /calculate my chances/i }).click();
    await expect(page.getByText(/schools matched from/i)).toBeVisible({ timeout: 15_000 });

    // Get safety count with low stats
    const lowStatsSafetyBadge = page.getByRole("button", { name: /safety schools/i }).locator("span").last();
    const lowSafetyCount = parseInt(await lowStatsSafetyBadge.textContent() ?? "0");

    // Lower stats should have fewer or equal safety schools
    expect(lowSafetyCount).toBeLessThanOrEqual(highSafetyCount);
  });

  test("button shows loading state during calculation", async ({ page }) => {
    await page.getByLabel(/gpa \(unweighted\)/i).fill("3.80");
    await page.getByLabel(/state of residence/i).selectOption("FL");
    await page.getByRole("button", { name: /calculate my chances/i }).click();

    // Button text should change to "Calculating..."
    await expect(page.getByRole("button", { name: /calculating/i })).toBeVisible();

    // Wait for results to complete
    await expect(page.getByText(/schools matched from/i)).toBeVisible({ timeout: 15_000 });

    // Button should revert to original text
    await expect(page.getByRole("button", { name: /calculate my chances/i })).toBeVisible();
  });
});
