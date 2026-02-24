import { test as setup, expect } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

const AUTH_STATE_PATH = path.join(__dirname, ".auth", "user.json");
const MAX_AGE_MS = 12 * 60 * 60 * 1000; // 12 hours

setup("authenticate via Google OAuth", async ({ page }) => {
  // Re-use existing auth state if it's fresh and has valid cookies
  if (fs.existsSync(AUTH_STATE_PATH)) {
    const stat = fs.statSync(AUTH_STATE_PATH);
    const ageMs = Date.now() - stat.mtimeMs;

    if (ageMs < MAX_AGE_MS) {
      const authState = JSON.parse(fs.readFileSync(AUTH_STATE_PATH, "utf-8"));
      const hasSupabaseCookies = authState.cookies?.some(
        (cookie: { name: string }) =>
          cookie.name.includes("sb-") || cookie.name.includes("supabase")
      );

      if (hasSupabaseCookies) {
        // eslint-disable-next-line no-console
        console.log("Re-using existing auth state (< 12h old with valid cookies).");
        return;
      }
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
