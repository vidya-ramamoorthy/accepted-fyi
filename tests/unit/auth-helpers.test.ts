import { describe, it, expect } from "vitest";
import { extractUserProfileData, sanitizeRedirectPath } from "@/lib/utils/auth-helpers";
import type { User } from "@supabase/supabase-js";

function createMockAuthUser(overrides: Partial<User> = {}): User {
  return {
    id: "auth-user-123",
    email: "test@example.com",
    user_metadata: {
      full_name: "Test User",
    },
    app_metadata: {},
    aud: "authenticated",
    created_at: "2025-01-01T00:00:00Z",
    ...overrides,
  } as User;
}

describe("extractUserProfileData", () => {
  it("should extract all fields from a complete auth user", () => {
    const authUser = createMockAuthUser();

    const profileData = extractUserProfileData(authUser);

    expect(profileData.authUserId).toBe("auth-user-123");
    expect(profileData.email).toBe("test@example.com");
    expect(profileData.displayName).toBe("Test User");
  });

  it("should use email as fallback when full_name is missing", () => {
    const authUser = createMockAuthUser({
      user_metadata: {},
    });

    const profileData = extractUserProfileData(authUser);

    expect(profileData.displayName).toBe("test@example.com");
  });

  it("should use 'Anonymous' when both full_name and email are missing", () => {
    const authUser = createMockAuthUser({
      email: undefined,
      user_metadata: {},
    });

    const profileData = extractUserProfileData(authUser);

    expect(profileData.displayName).toBe("Anonymous");
    expect(profileData.email).toBe("");
  });

  it("should handle null email gracefully", () => {
    const authUser = createMockAuthUser({
      email: undefined,
      user_metadata: { full_name: "No Email User" },
    });

    const profileData = extractUserProfileData(authUser);

    expect(profileData.email).toBe("");
    expect(profileData.displayName).toBe("No Email User");
  });

  it("should preserve the auth user id exactly", () => {
    const authUser = createMockAuthUser({
      id: "550e8400-e29b-41d4-a716-446655440000",
    });

    const profileData = extractUserProfileData(authUser);

    expect(profileData.authUserId).toBe("550e8400-e29b-41d4-a716-446655440000");
  });
});

describe("sanitizeRedirectPath (auth callback security)", () => {
  it("should allow valid dashboard paths", () => {
    expect(sanitizeRedirectPath("/browse")).toBe("/browse");
    expect(sanitizeRedirectPath("/submit")).toBe("/submit");
    expect(sanitizeRedirectPath("/dashboard")).toBe("/dashboard");
  });

  it("should allow nested paths", () => {
    expect(sanitizeRedirectPath("/schools/details")).toBe("/schools/details");
  });

  it("should allow paths with query strings", () => {
    expect(sanitizeRedirectPath("/browse?school=MIT&page=2")).toBe(
      "/browse?school=MIT&page=2"
    );
  });

  it("should block protocol-relative URLs to prevent open redirect", () => {
    expect(sanitizeRedirectPath("//evil.com")).toBe("/browse");
    expect(sanitizeRedirectPath("//evil.com/browse")).toBe("/browse");
  });

  it("should block URLs containing @ to prevent user info exploits", () => {
    expect(sanitizeRedirectPath("/browse@evil.com")).toBe("/browse");
    expect(sanitizeRedirectPath("/@admin")).toBe("/browse");
  });

  it("should block absolute URLs", () => {
    expect(sanitizeRedirectPath("https://evil.com")).toBe("/browse");
    expect(sanitizeRedirectPath("http://evil.com/browse")).toBe("/browse");
    expect(sanitizeRedirectPath("javascript:alert(1)")).toBe("/browse");
  });

  it("should block paths not starting with /", () => {
    expect(sanitizeRedirectPath("evil.com")).toBe("/browse");
    expect(sanitizeRedirectPath("browse")).toBe("/browse");
  });

  it("should default to /browse for empty string", () => {
    expect(sanitizeRedirectPath("")).toBe("/browse");
  });
});
