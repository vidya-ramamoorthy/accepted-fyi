import { test, expect, assertPublicNav } from "../fixtures/base.fixture";

test.describe("Homepage", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("renders hero section with tagline", async ({ page }) => {
    await expect(
      page.getByText("The Levels.fyi for college admissions")
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /see what it actually takes to get in/i })
    ).toBeVisible();
  });

  test("renders public navigation", async ({ page }) => {
    await assertPublicNav(page);
    await expect(
      page.locator("nav").getByRole("link", { name: /browse schools/i })
    ).toBeVisible();
  });

  test("renders stats bar with four counters", async ({ page }) => {
    const statsSection = page.locator("section").filter({ hasText: "States Covered" });
    await expect(statsSection.getByText("Submissions")).toBeVisible();
    await expect(statsSection.getByText("Schools Tracked")).toBeVisible();
    await expect(statsSection.getByText("Data Fields")).toBeVisible();
    await expect(statsSection.getByText("States Covered")).toBeVisible();
  });

  test("renders how-it-works section with three steps", async ({ page }) => {
    await expect(page.getByText("How it works")).toBeVisible();
    await expect(page.getByText("Sign in with Google")).toBeVisible();
    await expect(page.getByText("Submit your results")).toBeVisible();
    await expect(page.getByText("Browse all data")).toBeVisible();
  });

  test("renders sample data preview cards", async ({ page }) => {
    await expect(page.getByText("Real data preview")).toBeVisible();
    const previewSection = page.locator("section").filter({ hasText: "Real data preview" });
    await expect(previewSection.getByText("Stanford University")).toBeVisible();
    await expect(previewSection.getByText("MIT")).toBeVisible();
    await expect(previewSection.getByText("UC Berkeley")).toBeVisible();
    await expect(previewSection.getByText("University of Michigan")).toBeVisible();
  });

  test("renders feature cards", async ({ page }) => {
    await expect(page.getByText("Filter by Everything")).toBeVisible();
    await expect(page.getByText("Official + Community Data")).toBeVisible();
    await expect(page.getByText("Completely Anonymous")).toBeVisible();
  });

  test("CTA links point to /login", async ({ page }) => {
    const shareResultsLink = page.getByRole("link", { name: /share your results/i });
    await expect(shareResultsLink).toHaveAttribute("href", "/login");

    const getStartedLink = page.getByRole("link", { name: /get started/i });
    await expect(getStartedLink).toHaveAttribute("href", "/login");
  });

  test("Browse Schools link points to /schools", async ({ page }) => {
    const heroLinks = page.locator("section").first();
    const browseLink = heroLinks.getByRole("link", { name: /browse schools/i });
    await expect(browseLink).toHaveAttribute("href", "/schools");
  });

  test("renders footer with branding", async ({ page }) => {
    const footer = page.locator("footer");
    await expect(footer.getByText("accepted")).toBeVisible();
    await expect(footer.getByText("Real college admissions data")).toBeVisible();
  });
});
