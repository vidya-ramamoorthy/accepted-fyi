import { test, expect } from "@playwright/test";

// These tests use an EMPTY storage state to simulate an unauthenticated user.
// They verify that all dashboard routes redirect to /login.
test.use({ storageState: { cookies: [], origins: [] } });

const PROTECTED_ROUTES = ["/dashboard", "/browse", "/submit", "/chances"];

for (const route of PROTECTED_ROUTES) {
  test(`${route} redirects to /login when unauthenticated`, async ({ page }) => {
    await page.goto(route);
    await expect(page).toHaveURL(/\/login/);
  });
}
