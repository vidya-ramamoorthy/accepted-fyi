import { describe, it, expect, vi, beforeEach } from "vitest";

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
}));

import { getDb } from "@/lib/db/index";

describe("GET /api/analytics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return analytics metrics with correct structure", async () => {
    const mockExecute = vi.fn()
      // First call: user stats
      .mockResolvedValueOnce([{
        totalUsers: 150,
        usersWithSubmissions: 80,
        usersLast7Days: 25,
        usersLast30Days: 65,
      }])
      // Second call: submission stats
      .mockResolvedValueOnce([{
        totalSubmissions: 500,
        userSubmissions: 200,
        redditSubmissions: 300,
        submissionsLast7Days: 45,
        submissionsLast30Days: 120,
      }])
      // Third call: decision breakdown
      .mockResolvedValueOnce([
        { decision: "accepted", count: 200 },
        { decision: "rejected", count: 180 },
        { decision: "waitlisted", count: 80 },
        { decision: "deferred", count: 40 },
      ])
      // Fourth call: top schools
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
    }));

    const { GET } = await import("@/app/api/analytics/route");
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.users).toBeDefined();
    expect(body.submissions).toBeDefined();
    expect(body.decisions).toBeDefined();
    expect(body.topSchools).toBeDefined();
    expect(body.generatedAt).toBeDefined();
  });

  it("should return 500 when database query fails", async () => {
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
    }));

    const { GET } = await import("@/app/api/analytics/route");
    const response = await GET();

    expect(response.status).toBe(500);
  });
});
