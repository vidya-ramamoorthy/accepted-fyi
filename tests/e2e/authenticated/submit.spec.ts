import { test, expect, assertDashboardNav } from "../fixtures/base.fixture";

test.describe("Submit page (authenticated)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/submit");
  });

  test("renders heading and description", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /submit your admission result/i })
    ).toBeVisible();
    await expect(
      page.getByText(/share your results to help others/i)
    ).toBeVisible();
  });

  test("renders dashboard navigation", async ({ page }) => {
    await assertDashboardNav(page);
  });

  test("renders core School & Decision fields", async ({ page }) => {
    await expect(page.getByText("School & Decision")).toBeVisible();
    await expect(page.getByLabel("School Name")).toBeVisible();
    await expect(page.getByLabel("Decision")).toBeVisible();
    await expect(page.getByLabel("Application Round")).toBeVisible();
    await expect(page.getByLabel("Admission Cycle")).toBeVisible();
    await expect(page.getByLabel("State of Residence")).toBeVisible();
  });

  test("renders core Your Stats fields", async ({ page }) => {
    await expect(page.getByText("Your Stats")).toBeVisible();
    await expect(page.getByLabel("GPA (Unweighted)")).toBeVisible();
    await expect(page.getByLabel("SAT Score")).toBeVisible();
    await expect(page.getByLabel("Intended Major")).toBeVisible();
    await expect(page.getByLabel("ACT Score")).toBeVisible();
  });

  test("decision dropdown has all four options", async ({ page }) => {
    const decisionSelect = page.getByLabel("Decision");
    await expect(decisionSelect.locator("option", { hasText: "Accepted" })).toBeAttached();
    await expect(decisionSelect.locator("option", { hasText: "Rejected" })).toBeAttached();
    await expect(decisionSelect.locator("option", { hasText: "Waitlisted" })).toBeAttached();
    await expect(decisionSelect.locator("option", { hasText: "Deferred" })).toBeAttached();
  });

  test("waitlist outcome appears only when Waitlisted is selected", async ({ page }) => {
    // Initially should not show waitlist outcome
    await expect(page.getByLabel("Waitlist Outcome")).not.toBeVisible();

    // Select Waitlisted
    await page.getByLabel("Decision").selectOption("waitlisted");
    await expect(page.getByLabel("Waitlist Outcome")).toBeVisible();

    // Switch back to Accepted — waitlist outcome should disappear
    await page.getByLabel("Decision").selectOption("accepted");
    await expect(page.getByLabel("Waitlist Outcome")).not.toBeVisible();
  });

  test("More Details section is collapsible", async ({ page }) => {
    // Initially collapsed — optional fields not visible
    await expect(page.getByLabel("GPA (Weighted)")).not.toBeVisible();

    // Click to expand
    const moreDetailsButton = page.getByRole("button", { name: /more details/i });
    await expect(moreDetailsButton).toBeVisible();
    await moreDetailsButton.click();

    // Optional fields should now be visible
    await expect(page.getByLabel("GPA (Weighted)")).toBeVisible();
    await expect(page.getByLabel("High School Type")).toBeVisible();
    await expect(page.getByLabel("AP Courses")).toBeVisible();
    await expect(page.getByLabel("IB Courses")).toBeVisible();
    await expect(page.getByLabel("Honors Courses")).toBeVisible();
    await expect(page.getByLabel("Area Type")).toBeVisible();
    await expect(page.getByLabel("Extracurriculars (comma-separated)")).toBeVisible();
    await expect(page.getByLabel("Scholarship Offered")).toBeVisible();
    await expect(page.getByLabel("Will You Attend?")).toBeVisible();

    // Click again to collapse
    await moreDetailsButton.click();
    await expect(page.getByLabel("GPA (Weighted)")).not.toBeVisible();
  });

  test("honeypot field is hidden from view", async ({ page }) => {
    // The honeypot input exists in DOM but is positioned off-screen (left: -9999px)
    const honeypotInput = page.locator("input#website");
    await expect(honeypotInput).toBeAttached();
    await expect(honeypotInput).not.toBeInViewport();
  });

  test("submit button is visible and enabled", async ({ page }) => {
    const submitButton = page.getByRole("button", { name: /submit your result/i });
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toBeEnabled();
  });

  // NOTE: We intentionally do NOT submit the form to avoid polluting real data.
  // The form submission flow is covered by unit tests and the API route tests.
});
