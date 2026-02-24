import { test, expect } from "../fixtures/base.fixture";

test.describe("Submit page — client-side validation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/submit");
  });

  test("shows error when school name is empty", async ({ page }) => {
    // Fill state and leave school name empty
    await page.getByLabel("State of Residence").fill("CA");
    await page.getByRole("button", { name: /submit your result/i }).click();

    await expect(page.getByText("School name is required")).toBeVisible();
    // Should NOT have started submitting
    await expect(
      page.getByRole("button", { name: /submit your result/i })
    ).toBeVisible();
  });

  test("shows error when state of residence is empty", async ({ page }) => {
    // Fill school name but leave state empty
    await page.getByLabel("School Name").fill("Stanford University");
    await page.getByRole("button", { name: /submit your result/i }).click();

    await expect(page.getByText("State of residence is required")).toBeVisible();
  });

  test("shows error for invalid admission cycle format", async ({ page }) => {
    await page.getByLabel("School Name").fill("Stanford University");
    await page.getByLabel("State of Residence").fill("CA");
    // Clear the default and type an invalid format
    await page.getByLabel("Admission Cycle").clear();
    await page.getByLabel("Admission Cycle").fill("2025");
    await page.getByRole("button", { name: /submit your result/i }).click();

    await expect(
      page.getByText("Admission cycle must be in YYYY-YYYY format")
    ).toBeVisible();
  });

  test("shows error when GPA exceeds 4.0", async ({ page }) => {
    await page.getByLabel("School Name").fill("Stanford University");
    await page.getByLabel("State of Residence").fill("CA");
    await page.getByLabel("GPA (Unweighted)").fill("4.5");
    await page.getByRole("button", { name: /submit your result/i }).click();

    await expect(page.getByText("GPA must be between 0 and 4.0")).toBeVisible();
  });

  test("shows error when SAT exceeds 1600", async ({ page }) => {
    await page.getByLabel("School Name").fill("Stanford University");
    await page.getByLabel("State of Residence").fill("CA");
    await page.getByLabel("SAT Score").fill("1700");
    await page.getByRole("button", { name: /submit your result/i }).click();

    await expect(
      page.getByText("SAT score must be between 400 and 1600")
    ).toBeVisible();
  });

  test("shows error when ACT exceeds 36", async ({ page }) => {
    await page.getByLabel("School Name").fill("Stanford University");
    await page.getByLabel("State of Residence").fill("CA");
    await page.getByLabel("ACT Score").fill("40");
    await page.getByRole("button", { name: /submit your result/i }).click();

    await expect(
      page.getByText("ACT score must be between 1 and 36")
    ).toBeVisible();
  });

  test("valid form shows no inline errors and proceeds to submitting", async ({ page }) => {
    await page.getByLabel("School Name").fill("Stanford University");
    await page.getByLabel("State of Residence").fill("CA");
    // Admission cycle defaults to 2025-2026, which is valid
    await page.getByLabel("GPA (Unweighted)").fill("3.85");
    await page.getByLabel("SAT Score").fill("1520");
    await page.getByRole("button", { name: /submit your result/i }).click();

    // Should transition to submitting state (button text changes)
    await expect(
      page.getByRole("button", { name: /submitting/i })
    ).toBeVisible();

    // No validation error messages should be visible
    await expect(page.getByText("School name is required")).not.toBeVisible();
    await expect(page.getByText("State of residence is required")).not.toBeVisible();
  });
});

test.describe("Chances page — client-side validation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/chances");
  });

  test("shows error when no stats are provided", async ({ page }) => {
    // Select state but leave GPA/SAT/ACT empty
    await page.getByLabel(/state of residence/i).selectOption("CA");
    await page.getByRole("button", { name: /calculate my chances/i }).click();

    await expect(
      page.getByText("At least one stat is required")
    ).toBeVisible();
  });

  test("shows error when state is not selected", async ({ page }) => {
    // Fill GPA but leave state empty
    await page.getByLabel(/gpa \(unweighted\)/i).fill("3.5");
    await page.getByRole("button", { name: /calculate my chances/i }).click();

    await expect(
      page.getByText("State of residence is required")
    ).toBeVisible();
  });

  test("shows error when GPA exceeds 4.0", async ({ page }) => {
    await page.getByLabel(/gpa \(unweighted\)/i).fill("4.5");
    await page.getByLabel(/state of residence/i).selectOption("CA");
    await page.getByRole("button", { name: /calculate my chances/i }).click();

    await expect(
      page.getByText("GPA must be between 0 and 4.0")
    ).toBeVisible();
  });

  test("shows error when SAT is below 400", async ({ page }) => {
    await page.getByLabel(/sat score/i).fill("300");
    await page.getByLabel(/state of residence/i).selectOption("CA");
    await page.getByRole("button", { name: /calculate my chances/i }).click();

    await expect(
      page.getByText("SAT score must be between 400 and 1600")
    ).toBeVisible();
  });

  test("shows error when ACT exceeds 36", async ({ page }) => {
    await page.getByLabel(/act score/i).fill("40");
    await page.getByLabel(/state of residence/i).selectOption("CA");
    await page.getByRole("button", { name: /calculate my chances/i }).click();

    await expect(
      page.getByText("ACT score must be between 1 and 36")
    ).toBeVisible();
  });

  test("valid form shows no errors and proceeds to loading", async ({ page }) => {
    await page.getByLabel(/gpa \(unweighted\)/i).fill("3.5");
    await page.getByLabel(/state of residence/i).selectOption("CA");
    await page.getByRole("button", { name: /calculate my chances/i }).click();

    // Should transition to loading state
    await expect(
      page.getByRole("button", { name: /calculating/i })
    ).toBeVisible();

    // No validation errors should be visible
    await expect(page.getByText("At least one stat is required")).not.toBeVisible();
    await expect(page.getByText("State of residence is required")).not.toBeVisible();
    await expect(page.getByText("GPA must be between")).not.toBeVisible();
  });
});
