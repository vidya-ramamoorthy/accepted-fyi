import { test, expect } from "../fixtures/base.fixture";

test.describe("Login page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("renders branding and description", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /accepted/i })
    ).toBeVisible();
    await expect(
      page.getByText(/real admissions data from real students/i)
    ).toBeVisible();
  });

  test("renders Google sign-in button that is enabled", async ({ page }) => {
    const googleButton = page.getByRole("button", { name: /continue with google/i });
    await expect(googleButton).toBeVisible();
    await expect(googleButton).toBeEnabled();
  });

  test("does not show error state on initial load", async ({ page }) => {
    // Error messages have border-red-500 styling
    const errorBanner = page.locator('[class*="border-red-500"]');
    await expect(errorBanner).not.toBeVisible();
  });

  test("renders privacy disclaimer", async ({ page }) => {
    await expect(
      page.getByText(/by signing in, you agree to share your admissions data/i)
    ).toBeVisible();
  });
});
