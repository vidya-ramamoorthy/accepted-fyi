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
    await expect(statsSection.getByText("Admission Cycles")).toBeVisible();
    await expect(statsSection.getByText("States Covered")).toBeVisible();
  });

  test("renders how-it-works section with three steps", async ({ page }) => {
    await expect(page.getByText("How it works")).toBeVisible();
    await expect(page.getByText("Sign in with Google")).toBeVisible();
    await expect(page.getByText("Submit your admission result")).toBeVisible();
    await expect(page.getByRole("heading", { name: "See what everyone else got" })).toBeVisible();
  });

  test("renders sample data preview cards", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Here's what you'll unlock" })).toBeVisible();
    const previewSection = page.locator("section").filter({ hasText: "Here's what you'll unlock" });
    await expect(previewSection.getByRole("heading", { name: "Stanford University" })).toBeVisible();
    await expect(previewSection.getByRole("heading", { name: "MIT", exact: true })).toBeVisible();
    await expect(previewSection.getByRole("heading", { name: "UC Berkeley" })).toBeVisible();
    await expect(previewSection.getByRole("heading", { name: "University of Michigan" })).toBeVisible();
  });

  test("renders feature cards", async ({ page }) => {
    await expect(page.getByText("Filter by Everything")).toBeVisible();
    await expect(page.getByText("Official Stats + Real Outcomes")).toBeVisible();
    await expect(page.getByText("100% Anonymous")).toBeVisible();
  });

  test("renders what students are asking section", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /what students are asking/i })
    ).toBeVisible();
    await expect(page.getByText("What GPA do I need for UCLA?")).toBeVisible();
    await expect(page.getByText("Did anyone with a 1400 SAT get into Stanford?")).toBeVisible();
    await expect(page.getByText("The answers are inside.")).toBeVisible();
  });

  test("CTA links point to /login", async ({ page }) => {
    const submitResultLink = page.getByRole("link", { name: /submit your result & see others/i });
    await expect(submitResultLink).toHaveAttribute("href", "/login");

    const bottomCtaLink = page.getByRole("link", { name: /submit your result — it's free/i });
    await expect(bottomCtaLink).toHaveAttribute("href", "/login");
  });

  test("Browse Schools link points to /schools", async ({ page }) => {
    const heroLinks = page.locator("section").first();
    const browseLink = heroLinks.getByRole("link", { name: /browse schools/i });
    await expect(browseLink).toHaveAttribute("href", "/schools");
  });

  test("renders footer with branding", async ({ page }) => {
    const footer = page.locator("footer");
    await expect(footer.getByText("accepted")).toBeVisible();
    await expect(footer.getByText("Real admission results")).toBeVisible();
  });
});
