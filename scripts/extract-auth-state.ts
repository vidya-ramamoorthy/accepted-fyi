/**
 * Extract auth state from an existing browser session for Playwright tests.
 *
 * Usage:
 *   1. Sign in to localhost:3000 in your regular browser
 *   2. Run: npx tsx scripts/extract-auth-state.ts
 *   3. A Firefox window opens → navigate to localhost:3000 if needed
 *   4. The script saves cookies to tests/e2e/.auth/user.json
 *
 * Why Firefox? Google blocks sign-in from Playwright-controlled Chrome/Chromium.
 * Firefox is not blocked. Once you sign in via Firefox, the Supabase session
 * cookies are saved and reused by all Playwright test projects.
 */

import { firefox } from "playwright";
import * as fs from "fs";
import * as path from "path";

const AUTH_STATE_PATH = path.join(__dirname, "..", "tests", "e2e", ".auth", "user.json");

async function extractAuthState() {
  console.log("Launching Firefox (Google allows sign-in from Firefox)...");
  console.log("");

  const browser = await firefox.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto("http://localhost:3000/login");

  console.log("=== SIGN IN STEPS ===");
  console.log("1. Click 'Continue with Google' in the Firefox window");
  console.log("2. Complete the Google sign-in");
  console.log("3. Wait until you see the dashboard");
  console.log("");
  console.log("Waiting for redirect to dashboard...");

  // Wait for the user to complete sign-in and land on an authenticated page
  await page.waitForURL(/\/(dashboard|browse|submit|chances)/, { timeout: 120_000 });

  console.log("Sign-in detected! Saving auth state...");

  // Ensure directory exists
  const authDir = path.dirname(AUTH_STATE_PATH);
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  await context.storageState({ path: AUTH_STATE_PATH });
  await browser.close();

  console.log(`Auth state saved to: ${AUTH_STATE_PATH}`);
  console.log("You can now run: npx playwright test tests/e2e/authenticated/ --headed");
}

extractAuthState().catch((error) => {
  console.error("Failed:", error.message);
  process.exit(1);
});
