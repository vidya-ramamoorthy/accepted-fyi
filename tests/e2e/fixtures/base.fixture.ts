import { test as base, expect, type Page } from "@playwright/test";

/**
 * Assert the public-facing navigation bar is visible (homepage, schools, colleges pages).
 * Schools and colleges pages use a client-rendered NavbarAuthSection that shows a loading
 * skeleton before resolving to "Sign In" (unauthenticated) or dashboard links (authenticated).
 * The logo is always server-rendered. For the auth section, we wait for client hydration.
 */
export async function assertPublicNav(page: Page) {
  const nav = page.locator("nav");
  await expect(nav).toBeVisible();
  await expect(nav.getByText("accepted")).toBeVisible();
  // NavbarAuthSection renders client-side — wait for "Sign In" to appear after hydration
  await expect(nav.getByRole("link", { name: /sign in/i })).toBeVisible({ timeout: 10_000 });
}

/**
 * Assert the authenticated dashboard navigation bar is visible.
 * Includes Dashboard, Browse, Schools, Chances links and Submit CTA.
 */
export async function assertDashboardNav(page: Page) {
  const nav = page.locator("nav");
  await expect(nav).toBeVisible();
  await expect(nav.getByText("accepted")).toBeVisible();
  await expect(nav.getByRole("link", { name: /submit/i })).toBeVisible();
}

/**
 * Assert that JSON-LD structured data is present on the page.
 */
export async function assertJsonLd(page: Page) {
  const jsonLdScript = page.locator('script[type="application/ld+json"]');
  await expect(jsonLdScript).toBeAttached();
}

/**
 * Assert the page returned a 404 / "Not Found" response.
 * Next.js dev mode may render not-found page with 200 status,
 * so we check the HTTP status, visible text, or page title.
 */
export async function assertNotFoundResponse(page: Page, response: Awaited<ReturnType<Page["goto"]>>) {
  const status = response?.status() ?? 0;
  if (status === 404) {
    expect(status).toBe(404);
    return;
  }
  // Check visible text first, fall back to page title
  const visibleNotFound = await page.getByText(/not found/i).isVisible().catch(() => false);
  if (visibleNotFound) {
    return;
  }
  const title = await page.title();
  expect(title.toLowerCase()).toContain("not found");
}

export { base as test, expect };
