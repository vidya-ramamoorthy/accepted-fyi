import type { User } from "@supabase/supabase-js";

/**
 * Extracts user profile data from a Supabase auth user object.
 * Used consistently across callbacks, API routes, and server components
 * to avoid duplicating the field-mapping logic.
 */
export function extractUserProfileData(authUser: User) {
  return {
    authUserId: authUser.id,
    email: authUser.email ?? "",
    displayName:
      authUser.user_metadata?.full_name ?? authUser.email ?? "Anonymous",
  };
}

/**
 * Validates that a redirect path is safe (relative, no open redirect).
 */
export function sanitizeRedirectPath(redirectTo: string): string {
  if (
    redirectTo.startsWith("/") &&
    !redirectTo.startsWith("//") &&
    !redirectTo.includes("@")
  ) {
    return redirectTo;
  }
  return "/browse";
}
