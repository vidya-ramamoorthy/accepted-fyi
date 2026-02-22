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

// Mock upstash redis
vi.mock("@upstash/redis", () => ({
  Redis: vi.fn(),
}));

import { getDb } from "@/lib/db/index";
import { getServerConfig } from "@/lib/config";

describe("GET /api/health", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 200 when database is healthy", async () => {
    const mockExecute = vi.fn().mockResolvedValue([{ result: 1 }]);
    vi.mocked(getDb).mockReturnValue({
      execute: mockExecute,
    } as never);

    // Dynamic import to pick up mocks
    const { GET } = await import("@/app/api/health/route");
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe("healthy");
    expect(body.checks.database.status).toBe("up");
    expect(typeof body.checks.database.latencyMs).toBe("number");
    expect(body.timestamp).toBeDefined();
  });

  it("should return 503 when database is down", async () => {
    vi.mocked(getDb).mockReturnValue({
      execute: vi.fn().mockRejectedValue(new Error("connection refused")),
    } as never);

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
    vi.doMock("@upstash/redis", () => ({
      Redis: vi.fn(),
    }));

    const { GET } = await import("@/app/api/health/route");
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.status).toBe("unhealthy");
    expect(body.checks.database.status).toBe("down");
  });

  it("should report Redis as skipped when not configured", async () => {
    vi.mocked(getDb).mockReturnValue({
      execute: vi.fn().mockResolvedValue([{ result: 1 }]),
    } as never);
    vi.mocked(getServerConfig).mockReturnValue({
      database: { url: "postgres://localhost/test" },
      supabase: { url: "https://test.supabase.co", anonKey: "key" },
      redis: null,
    });

    vi.resetModules();
    vi.doMock("@/lib/db/index", () => ({
      getDb: vi.fn().mockReturnValue({
        execute: vi.fn().mockResolvedValue([{ result: 1 }]),
      }),
    }));
    vi.doMock("@/lib/config", () => ({
      getServerConfig: vi.fn().mockReturnValue({
        database: { url: "postgres://localhost/test" },
        supabase: { url: "https://test.supabase.co", anonKey: "key" },
        redis: null,
      }),
    }));
    vi.doMock("@upstash/redis", () => ({
      Redis: vi.fn(),
    }));

    const { GET } = await import("@/app/api/health/route");
    const response = await GET();
    const body = await response.json();

    expect(body.checks.redis.status).toBe("skipped");
  });
});
