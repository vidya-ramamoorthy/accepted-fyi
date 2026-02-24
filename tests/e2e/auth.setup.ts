import { test as setup, expect } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

const AUTH_STATE_PATH = path.join(__dirname, ".auth", "user.json");

setup("authenticate via Google OAuth", async ({ page, context }) => {
  // Try re-using existing auth state by loading cookies and validating the session
  if (fs.existsSync(AUTH_STATE_PATH)) {
    const authState = JSON.parse(fs.readFileSync(AUTH_STATE_PATH, "utf-8"));
    const hasSupabaseCookies = authState.cookies?.some(
      (cookie: { name: string }) =>
        cookie.name.includes("sb-") || cookie.name.includes("supabase")
    );

    if (hasSupabaseCookies) {
      // Load saved cookies into the browser context
      await context.addCookies(authState.cookies);

      // Navigate to a protected page — the middleware will refresh the
      // access token using the refresh token if it's expired. The browser
      // stores the refreshed cookies from the Set-Cookie response headers.
      await page.goto("/dashboard");

      // Check if we landed on an authenticated page (not redirected to login)
      const isAuthenticated = await page
        .waitForURL(/\/(dashboard|browse|submit|chances)/, { timeout: 10_000 })
        .then(() => true)
        .catch(() => false);

      if (isAuthenticated) {
        // eslint-disable-next-line no-console
        console.log("Existing auth state is valid (session refreshed if needed).");
        // Save the refreshed state so subsequent tests get fresh tokens
        await page.context().storageState({ path: AUTH_STATE_PATH });
        return;
      }

      // eslint-disable-next-line no-console
      console.log("Existing auth state expired (refresh token invalid). Need manual sign-in.");
    }
  }

  // No valid state — open login page and pause for manual Google sign-in
  await page.goto("/login");
  await expect(page.getByRole("button", { name: /continue with google/i })).toBeVisible();

  // eslint-disable-next-line no-console
  console.log("\n=== MANUAL AUTH REQUIRED ===");
  // eslint-disable-next-line no-console
  console.log("1. Click 'Continue with Google' in the browser");
  // eslint-disable-next-line no-console
  console.log("2. Complete Google sign-in");
  // eslint-disable-next-line no-console
  console.log("3. Wait for redirect to /dashboard");
  // eslint-disable-next-line no-console
  console.log("4. Press 'Resume' in the Playwright inspector\n");

  await page.pause();

  // After manual sign-in, verify we landed on the dashboard
  await expect(page).toHaveURL(/\/(dashboard|browse|submit|chances)/, { timeout: 30_000 });

  // Persist auth state for subsequent tests
  await page.context().storageState({ path: AUTH_STATE_PATH });
});
