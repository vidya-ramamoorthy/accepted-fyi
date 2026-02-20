import { describe, it, expect } from "vitest";
import { escapeLikePattern } from "@/lib/utils/escape-like";
import { sanitizeRedirectPath } from "@/lib/utils/auth-helpers";

describe("escapeLikePattern", () => {
  it("should escape percent signs", () => {
    expect(escapeLikePattern("100%")).toBe("100\\%");
  });

  it("should escape underscores", () => {
    expect(escapeLikePattern("user_name")).toBe("user\\_name");
  });

  it("should escape backslashes", () => {
    expect(escapeLikePattern("path\\to")).toBe("path\\\\to");
  });

  it("should escape multiple special characters", () => {
    expect(escapeLikePattern("%_\\")).toBe("\\%\\_\\\\");
  });

  it("should not modify strings without special characters", () => {
    expect(escapeLikePattern("Stanford University")).toBe("Stanford University");
  });

  it("should handle empty strings", () => {
    expect(escapeLikePattern("")).toBe("");
  });
});

describe("sanitizeRedirectPath", () => {
  it("should allow simple relative paths", () => {
    expect(sanitizeRedirectPath("/browse")).toBe("/browse");
    expect(sanitizeRedirectPath("/submit")).toBe("/submit");
    expect(sanitizeRedirectPath("/schools")).toBe("/schools");
  });

  it("should allow paths with query parameters", () => {
    expect(sanitizeRedirectPath("/browse?page=2")).toBe("/browse?page=2");
  });

  it("should block protocol-relative URLs", () => {
    expect(sanitizeRedirectPath("//evil.com")).toBe("/browse");
  });

  it("should block paths with @ (potential open redirect)", () => {
    expect(sanitizeRedirectPath("/browse@evil.com")).toBe("/browse");
  });

  it("should block absolute URLs", () => {
    expect(sanitizeRedirectPath("https://evil.com")).toBe("/browse");
  });

  it("should block paths that don't start with /", () => {
    expect(sanitizeRedirectPath("evil.com/browse")).toBe("/browse");
  });
});
