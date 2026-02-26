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

// Mock rate limiting — allow all requests
vi.mock("@/lib/ratelimit", () => ({
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
}));

// Mock upstash redis
vi.mock("@upstash/redis", () => ({
  Redis: vi.fn(),
}));

import { NextRequest } from "next/server";
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

    const { GET } = await import("@/app/api/health/route");
    const request = new NextRequest("https://accepted.fyi/api/health");
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe("healthy");
    expect(body.checks.database.status).toBe("up");
    expect(typeof body.checks.database.latencyMs).toBe("number");
    expect(body.timestamp).toBeDefined();
  });

  it("should return 503 when database is down", async () => {
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
    const request = new NextRequest("https://accepted.fyi/api/health");
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.status).toBe("unhealthy");
    expect(body.checks.database.status).toBe("down");
  });

  it("should report Redis as skipped when not configured", async () => {
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
    const request = new NextRequest("https://accepted.fyi/api/health");
    const response = await GET(request);
    const body = await response.json();

    expect(body.checks.redis.status).toBe("skipped");
  });
});
