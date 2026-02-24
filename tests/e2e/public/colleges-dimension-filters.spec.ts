import { test, expect } from "../fixtures/base.fixture";

/**
 * Tests for FilterableSchoolGrid filters on dimension-scoped pages
 * (SAT, ACT, acceptance rate). Each page hides the filter for its own
 * dimension but exposes all other filters.
 */

test.describe("Colleges SAT page — filter interactions", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/colleges/sat/1400-1500");
    await expect(page.getByText(/Showing \d+ of \d+ schools/)).toBeVisible({ timeout: 10_000 });
  });

  test("SAT filter is hidden on SAT-scoped page", async ({ page }) => {
    await expect(page.getByLabel("Filter by SAT score")).not.toBeVisible();
  });

  test("state filter updates URL and filters results", async ({ page }) => {
    await page.getByLabel("Filter by state").selectOption("CA");

    await expect(page).toHaveURL(/state=CA/);
    await expect(page.getByRole("button", { name: "Clear filters" })).toBeVisible();
    await expect(page.getByText(/Showing \d+ of \d+ schools/)).toBeVisible();
  });

  test("acceptance rate filter works", async ({ page }) => {
    await page.getByLabel("Filter by acceptance rate").selectOption("under-10");

    await expect(page).toHaveURL(/acceptanceRate=under-10/);
    await expect(page.getByRole("button", { name: "Clear filters" })).toBeVisible();
  });

  test("ACT filter works", async ({ page }) => {
    await page.getByLabel("Filter by ACT score").selectOption("34-36");

    await expect(page).toHaveURL(/act=34-36/);
    await expect(page.getByRole("button", { name: "Clear filters" })).toBeVisible();
  });

  test("school type filter works", async ({ page }) => {
    await page.getByLabel("Filter by school type").selectOption("private");

    await expect(page).toHaveURL(/schoolType=private/);
    await expect(page.getByRole("button", { name: "Clear filters" })).toBeVisible();
  });

  test("clear filters resets all selections", async ({ page }) => {
    await page.getByLabel("Filter by state").selectOption("NY");
    await expect(page).toHaveURL(/state=NY/);

    await page.getByRole("button", { name: "Clear filters" }).click();
    await expect(page).not.toHaveURL(/state=/);
    await expect(page.getByRole("button", { name: "Clear filters" })).not.toBeVisible();
  });
});

test.describe("Colleges ACT page — filter interactions", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/colleges/act/30-33");
    await expect(page.getByText(/Showing \d+ of \d+ schools/)).toBeVisible({ timeout: 10_000 });
  });

  test("ACT filter is hidden on ACT-scoped page", async ({ page }) => {
    await expect(page.getByLabel("Filter by ACT score")).not.toBeVisible();
  });

  test("state filter updates URL and filters results", async ({ page }) => {
    await page.getByLabel("Filter by state").selectOption("TX");

    await expect(page).toHaveURL(/state=TX/);
    await expect(page.getByRole("button", { name: "Clear filters" })).toBeVisible();
    await expect(page.getByText(/Showing \d+ of \d+ schools/)).toBeVisible();
  });

  test("SAT filter works", async ({ page }) => {
    await page.getByLabel("Filter by SAT score").selectOption("1300-1400");

    await expect(page).toHaveURL(/sat=1300-1400/);
    await expect(page.getByRole("button", { name: "Clear filters" })).toBeVisible();
  });

  test("acceptance rate filter works", async ({ page }) => {
    await page.getByLabel("Filter by acceptance rate").selectOption("20-30");

    await expect(page).toHaveURL(/acceptanceRate=20-30/);
    await expect(page.getByRole("button", { name: "Clear filters" })).toBeVisible();
  });

  test("school type filter works", async ({ page }) => {
    await page.getByLabel("Filter by school type").selectOption("public");

    await expect(page).toHaveURL(/schoolType=public/);
    await expect(page.getByRole("button", { name: "Clear filters" })).toBeVisible();
  });

  test("clear filters resets all selections", async ({ page }) => {
    await page.getByLabel("Filter by acceptance rate").selectOption("30-50");
    await expect(page).toHaveURL(/acceptanceRate=30-50/);

    await page.getByRole("button", { name: "Clear filters" }).click();
    await expect(page).not.toHaveURL(/acceptanceRate=/);
    await expect(page.getByRole("button", { name: "Clear filters" })).not.toBeVisible();
  });
});

test.describe("Colleges acceptance rate page — filter interactions", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/colleges/acceptance-rate/under-10");
    await expect(page.getByText(/Showing \d+ of \d+ schools/)).toBeVisible({ timeout: 10_000 });
  });

  test("acceptance rate filter is hidden on acceptance-rate-scoped page", async ({ page }) => {
    await expect(page.getByLabel("Filter by acceptance rate")).not.toBeVisible();
  });

  test("state filter updates URL and filters results", async ({ page }) => {
    await page.getByLabel("Filter by state").selectOption("MA");

    await expect(page).toHaveURL(/state=MA/);
    await expect(page.getByRole("button", { name: "Clear filters" })).toBeVisible();
    await expect(page.getByText(/Showing \d+ of \d+ schools/)).toBeVisible();
  });

  test("SAT filter works", async ({ page }) => {
    await page.getByLabel("Filter by SAT score").selectOption("1500-1600");

    await expect(page).toHaveURL(/sat=1500-1600/);
    await expect(page.getByRole("button", { name: "Clear filters" })).toBeVisible();
  });

  test("ACT filter works", async ({ page }) => {
    await page.getByLabel("Filter by ACT score").selectOption("34-36");

    await expect(page).toHaveURL(/act=34-36/);
    await expect(page.getByRole("button", { name: "Clear filters" })).toBeVisible();
  });

  test("school type filter works", async ({ page }) => {
    await page.getByLabel("Filter by school type").selectOption("private");

    await expect(page).toHaveURL(/schoolType=private/);
    await expect(page.getByRole("button", { name: "Clear filters" })).toBeVisible();
  });

  test("multiple filters combine and clear correctly", async ({ page }) => {
    await page.getByLabel("Filter by state").selectOption("CA");
    await page.getByLabel("Filter by SAT score").selectOption("1500-1600");

    await expect(page).toHaveURL(/state=CA/);
    await expect(page).toHaveURL(/sat=1500-1600/);

    await page.getByRole("button", { name: "Clear filters" }).click();
    await expect(page).not.toHaveURL(/state=/);
    await expect(page).not.toHaveURL(/sat=/);
  });
});

test.describe("Combo pages — filter interactions", () => {
  test("state+SAT combo hides both state and SAT filters", async ({ page }) => {
    await page.goto("/colleges/state/california/sat/1400-1500");
    await expect(page.getByText(/Showing \d+ of \d+ schools/)).toBeVisible({ timeout: 10_000 });

    await expect(page.getByLabel("Filter by state")).not.toBeVisible();
    await expect(page.getByLabel("Filter by SAT score")).not.toBeVisible();

    // Other filters should still work
    await expect(page.getByLabel("Filter by acceptance rate")).toBeVisible();
    await expect(page.getByLabel("Filter by ACT score")).toBeVisible();
    await expect(page.getByLabel("Filter by school type")).toBeVisible();
  });

  test("state+SAT combo — acceptance rate filter works", async ({ page }) => {
    await page.goto("/colleges/state/california/sat/1400-1500");
    await expect(page.getByText(/Showing \d+ of \d+ schools/)).toBeVisible({ timeout: 10_000 });

    await page.getByLabel("Filter by acceptance rate").selectOption("under-10");
    await expect(page).toHaveURL(/acceptanceRate=under-10/);
    await expect(page.getByRole("button", { name: "Clear filters" })).toBeVisible();
  });

  test("state+acceptance-rate combo hides both state and acceptance rate filters", async ({ page }) => {
    await page.goto("/colleges/state/california/acceptance-rate/under-10");
    await expect(page.getByText(/Showing \d+ of \d+ schools/)).toBeVisible({ timeout: 10_000 });

    await expect(page.getByLabel("Filter by state")).not.toBeVisible();
    await expect(page.getByLabel("Filter by acceptance rate")).not.toBeVisible();

    // Other filters should still work
    await expect(page.getByLabel("Filter by SAT score")).toBeVisible();
    await expect(page.getByLabel("Filter by ACT score")).toBeVisible();
    await expect(page.getByLabel("Filter by school type")).toBeVisible();
  });

  test("state+acceptance-rate combo — SAT filter works", async ({ page }) => {
    await page.goto("/colleges/state/california/acceptance-rate/under-10");
    await expect(page.getByText(/Showing \d+ of \d+ schools/)).toBeVisible({ timeout: 10_000 });

    await page.getByLabel("Filter by SAT score").selectOption("1500-1600");
    await expect(page).toHaveURL(/sat=1500-1600/);
    await expect(page.getByRole("button", { name: "Clear filters" })).toBeVisible();
  });
});
