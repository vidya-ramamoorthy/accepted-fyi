import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock next/server
vi.mock("next/server", () => {
  class MockNextRequest {
    public headers: Map<string, string>;
    public method: string;
    public url: string;
    public nextUrl: { pathname: string; searchParams: URLSearchParams };

    constructor(url: string, options?: { method?: string; headers?: Record<string, string> }) {
      this.url = url;
      this.method = options?.method ?? "GET";
      this.headers = new Map(Object.entries(options?.headers ?? {}));
      const parsed = new URL(url);
      this.nextUrl = { pathname: parsed.pathname, searchParams: parsed.searchParams };
    }

    async json() { throw new Error("No body"); }
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

// Mock Supabase auth
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

// Mock rate limiting — allow all requests
vi.mock("@/lib/ratelimit", () => ({
  apiReadRateLimiter: null,
  ipReadRateLimiter: null,
  checkRateLimit: vi.fn().mockResolvedValue({ allowed: true }),
  getClientIp: vi.fn().mockReturnValue("127.0.0.1"),
}));

// Mock logger
vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

// Mock the database module
vi.mock("@/lib/db/index", () => ({
  getDb: vi.fn(),
}));

// Mock the config module
vi.mock("@/lib/config", () => ({
  getServerConfig: vi.fn().mockReturnValue({
    database: { url: "postgres://localhost/test" },
    supabase: { url: "https://test.supabase.co", anonKey: "key" },
    redis: null,
  }),
  getPublicConfig: vi.fn().mockReturnValue({
    supabase: { url: "https://test.supabase.co", anonKey: "key" },
  }),
}));

import { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getDb } from "@/lib/db/index";

function mockAuthenticatedUser() {
  vi.mocked(createSupabaseServerClient).mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "user-123", email: "test@example.com" } },
        error: null,
      }),
    },
  } as never);
}

function mockUnauthenticatedUser() {
  vi.mocked(createSupabaseServerClient).mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: null },
        error: null,
      }),
    },
  } as never);
}

describe("GET /api/analytics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 when unauthenticated", async () => {
    mockUnauthenticatedUser();

    vi.resetModules();
    const { GET } = await import("@/app/api/analytics/route");
    const request = new NextRequest("https://accepted.fyi/api/analytics");
    const response = await GET(request);

    expect(response.status).toBe(401);
  });

  it("should return analytics metrics when authenticated", async () => {
    mockAuthenticatedUser();

    const mockExecute = vi.fn()
      .mockResolvedValueOnce([{
        totalUsers: 150,
        usersWithSubmissions: 80,
        usersLast7Days: 25,
        usersLast30Days: 65,
      }])
      .mockResolvedValueOnce([{
        totalSubmissions: 500,
        userSubmissions: 200,
        redditSubmissions: 300,
        submissionsLast7Days: 45,
        submissionsLast30Days: 120,
      }])
      .mockResolvedValueOnce([
        { decision: "accepted", count: 200 },
        { decision: "rejected", count: 180 },
        { decision: "waitlisted", count: 80 },
        { decision: "deferred", count: 40 },
      ])
      .mockResolvedValueOnce([
        { schoolName: "MIT", submissionCount: 25 },
        { schoolName: "Stanford University", submissionCount: 20 },
      ]);

    vi.mocked(getDb).mockReturnValue({ execute: mockExecute } as never);

    vi.resetModules();
    vi.doMock("@/lib/db/index", () => ({
      getDb: vi.fn().mockReturnValue({ execute: mockExecute }),
    }));
    vi.doMock("@/lib/config", () => ({
      getServerConfig: vi.fn().mockReturnValue({
        database: { url: "postgres://localhost/test" },
        supabase: { url: "https://test.supabase.co", anonKey: "key" },
        redis: null,
      }),
      getPublicConfig: vi.fn().mockReturnValue({
        supabase: { url: "https://test.supabase.co", anonKey: "key" },
      }),
    }));

    const { GET } = await import("@/app/api/analytics/route");
    const request = new NextRequest("https://accepted.fyi/api/analytics");
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.users).toBeDefined();
    expect(body.submissions).toBeDefined();
    expect(body.decisions).toBeDefined();
    expect(body.topSchools).toBeDefined();
    expect(body.generatedAt).toBeDefined();
  });

  it("should return 500 when database query fails", async () => {
    mockAuthenticatedUser();

    vi.resetModules();
    vi.doMock("@/lib/db/index", () => ({
      getDb: vi.fn().mockReturnValue({
        execute: vi.fn().mockRejectedValue(new Error("connection refused")),
      }),
    }));
    vi.doMock("@/lib/config", () => ({
      getServerConfig: vi.fn().mockReturnValue({
        database: { url: "postgres://localhost/test" },
        supabase: { url: "https://test.supabase.co", anonKey: "key" },
        redis: null,
      }),
      getPublicConfig: vi.fn().mockReturnValue({
        supabase: { url: "https://test.supabase.co", anonKey: "key" },
      }),
    }));

    const { GET } = await import("@/app/api/analytics/route");
    const request = new NextRequest("https://accepted.fyi/api/analytics");
    const response = await GET(request);

    expect(response.status).toBe(500);
  });
});
