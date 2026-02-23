import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock next/server
vi.mock("next/server", () => {
  class MockNextRequest {
    public headers: Map<string, string>;
    public method: string;
    public url: string;
    public nextUrl: { pathname: string; searchParams: URLSearchParams };
    private bodyContent: string | null;

    constructor(url: string, options?: { method?: string; headers?: Record<string, string>; body?: string }) {
      this.url = url;
      this.method = options?.method ?? "GET";
      this.headers = new Map(Object.entries(options?.headers ?? {}));
      const parsed = new URL(url);
      this.nextUrl = { pathname: parsed.pathname, searchParams: parsed.searchParams };
      this.bodyContent = options?.body ?? null;
    }

    async json() {
      if (!this.bodyContent) throw new Error("No body");
      return JSON.parse(this.bodyContent);
    }
  }

  return {
    NextRequest: MockNextRequest,
    NextResponse: {
      json: (body: unknown, init?: { status?: number; headers?: Record<string, string> }) => ({
        body,
        status: init?.status ?? 200,
        headers: new Map(Object.entries(init?.headers ?? {})),
        async json() { return body; },
      }),
    },
  };
});

// Mock next/cache
vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
}));

// Mock Supabase
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

// Mock rate limiting
vi.mock("@/lib/ratelimit", () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ allowed: true }),
  getClientIp: vi.fn().mockReturnValue("127.0.0.1"),
  flagRateLimiter: null,
}));

// Mock logger
vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock flag queries
vi.mock("@/lib/db/queries/flags", () => ({
  createFlag: vi.fn(),
  hasUserFlaggedSubmission: vi.fn(),
  isOwnSubmission: vi.fn(),
}));

// Mock user queries
vi.mock("@/lib/db/queries/users", () => ({
  findOrCreateUser: vi.fn(),
}));

// Mock auth helpers
vi.mock("@/lib/utils/auth-helpers", () => ({
  extractUserProfileData: vi.fn().mockReturnValue({
    authUserId: "auth-user-1",
    email: "test@test.com",
    displayName: "Test User",
  }),
}));

import { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createFlag, hasUserFlaggedSubmission, isOwnSubmission } from "@/lib/db/queries/flags";
import { findOrCreateUser } from "@/lib/db/queries/users";

// Helper to set up authenticated user
function setupAuthenticatedUser() {
  const mockUser = { id: "auth-user-1", email: "test@test.com" };
  vi.mocked(createSupabaseServerClient).mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
    },
  } as never);

  vi.mocked(findOrCreateUser).mockResolvedValue({
    id: "profile-user-1",
    authUserId: "auth-user-1",
    email: "test@test.com",
    displayName: "Test User",
    hasSubmitted: true,
    verificationTier: "bronze",
    eduEmail: null,
    eduEmailVerified: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as never);
}

describe("Flag API route - POST /api/submissions/[id]/flag", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 when user is not authenticated", async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      },
    } as never);

    const { POST } = await import("@/app/api/submissions/[id]/flag/route");

    const submissionId = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
    const request = new NextRequest(
      `http://localhost/api/submissions/${submissionId}/flag`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reason: "Inaccurate data" }),
      }
    );

    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it("should return 400 when reason is missing", async () => {
    setupAuthenticatedUser();

    const { POST } = await import("@/app/api/submissions/[id]/flag/route");

    const submissionId = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
    const request = new NextRequest(
      `http://localhost/api/submissions/${submissionId}/flag`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      }
    );

    const response = await POST(request);
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body.error).toContain("Reason is required");
  });

  it("should return 400 when reason is empty string", async () => {
    setupAuthenticatedUser();

    const { POST } = await import("@/app/api/submissions/[id]/flag/route");

    const submissionId = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
    const request = new NextRequest(
      `http://localhost/api/submissions/${submissionId}/flag`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reason: "" }),
      }
    );

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("should return 400 when reason exceeds 500 characters", async () => {
    setupAuthenticatedUser();

    const { POST } = await import("@/app/api/submissions/[id]/flag/route");

    const submissionId = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
    const longReason = "x".repeat(501);
    const request = new NextRequest(
      `http://localhost/api/submissions/${submissionId}/flag`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reason: longReason }),
      }
    );

    const response = await POST(request);
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body.error).toContain("500 characters");
  });

  it("should return 400 when submission ID is not a valid UUID", async () => {
    setupAuthenticatedUser();

    const { POST } = await import("@/app/api/submissions/[id]/flag/route");

    const request = new NextRequest(
      `http://localhost/api/submissions/not-a-uuid/flag`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reason: "Spam" }),
      }
    );

    const response = await POST(request);
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body.error).toContain("Invalid submission ID");
  });

  it("should return 403 when flagging own submission", async () => {
    setupAuthenticatedUser();
    vi.mocked(isOwnSubmission).mockResolvedValue(true);

    const { POST } = await import("@/app/api/submissions/[id]/flag/route");

    const submissionId = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
    const request = new NextRequest(
      `http://localhost/api/submissions/${submissionId}/flag`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reason: "Inaccurate data" }),
      }
    );

    const response = await POST(request);
    expect(response.status).toBe(403);

    const body = await response.json();
    expect(body.error).toContain("cannot flag your own");
  });

  it("should return 409 when submission already flagged by user", async () => {
    setupAuthenticatedUser();
    vi.mocked(isOwnSubmission).mockResolvedValue(false);
    vi.mocked(hasUserFlaggedSubmission).mockResolvedValue(true);

    const { POST } = await import("@/app/api/submissions/[id]/flag/route");

    const submissionId = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
    const request = new NextRequest(
      `http://localhost/api/submissions/${submissionId}/flag`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reason: "Inaccurate data" }),
      }
    );

    const response = await POST(request);
    expect(response.status).toBe(409);

    const body = await response.json();
    expect(body.error).toContain("already flagged");
  });

  it("should return 201 on successful flag creation", async () => {
    setupAuthenticatedUser();
    vi.mocked(isOwnSubmission).mockResolvedValue(false);
    vi.mocked(hasUserFlaggedSubmission).mockResolvedValue(false);
    vi.mocked(createFlag).mockResolvedValue({ flagCount: 1, submissionStatus: "visible" });

    const { POST } = await import("@/app/api/submissions/[id]/flag/route");

    const submissionId = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
    const request = new NextRequest(
      `http://localhost/api/submissions/${submissionId}/flag`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reason: "Inaccurate data" }),
      }
    );

    const response = await POST(request);
    expect(response.status).toBe(201);

    const body = await response.json();
    expect(body.flagCount).toBe(1);
    expect(body.status).toBe("visible");
  });

  it("should return flagged status when auto-hide threshold reached", async () => {
    setupAuthenticatedUser();
    vi.mocked(isOwnSubmission).mockResolvedValue(false);
    vi.mocked(hasUserFlaggedSubmission).mockResolvedValue(false);
    vi.mocked(createFlag).mockResolvedValue({ flagCount: 3, submissionStatus: "flagged" });

    const { POST } = await import("@/app/api/submissions/[id]/flag/route");

    const submissionId = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
    const request = new NextRequest(
      `http://localhost/api/submissions/${submissionId}/flag`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reason: "Spam/fake submission" }),
      }
    );

    const response = await POST(request);
    expect(response.status).toBe(201);

    const body = await response.json();
    expect(body.flagCount).toBe(3);
    expect(body.status).toBe("flagged");
  });
});
