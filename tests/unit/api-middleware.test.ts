import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock next/server
vi.mock("next/server", () => {
  class MockNextRequest {
    public headers: Map<string, string>;
    public method: string;
    public url: string;
    public nextUrl: { pathname: string };
    private bodyContent: string | null;

    constructor(url: string, options?: { method?: string; headers?: Record<string, string>; body?: string }) {
      this.url = url;
      this.method = options?.method ?? "GET";
      this.headers = new Map(Object.entries(options?.headers ?? {}));
      this.nextUrl = { pathname: new URL(url).pathname };
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

// Mock Supabase server client
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

// Mock rate limiting
vi.mock("@/lib/ratelimit", () => ({
  checkRateLimit: vi.fn(),
  getClientIp: vi.fn().mockReturnValue("127.0.0.1"),
}));

// Mock logger
vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/ratelimit";
import {
  createApiHandler,
  withAuth,
  withRateLimit,
  withIpRateLimit,
  withJsonBody,
  withRequestLogging,
  type ApiContext,
} from "@/lib/api-middleware";

describe("createApiHandler", () => {
  it("should call handler when no middleware short-circuits", async () => {
    const handler = vi.fn().mockResolvedValue(
      { body: { ok: true }, status: 200, headers: new Map(), json: async () => ({ ok: true }) }
    );

    const routeHandler = createApiHandler(handler);
    const request = new NextRequest("http://localhost/api/test");
    const response = await routeHandler(request);

    expect(handler).toHaveBeenCalledOnce();
    expect(response.status).toBe(200);
  });

  it("should short-circuit when middleware returns a Response", async () => {
    const blockingMiddleware = vi.fn().mockResolvedValue(
      { body: { error: "blocked" }, status: 403, headers: new Map(), json: async () => ({ error: "blocked" }) }
    );
    const handler = vi.fn();

    const routeHandler = createApiHandler(blockingMiddleware, handler);
    const request = new NextRequest("http://localhost/api/test");
    const response = await routeHandler(request);

    expect(response.status).toBe(403);
    expect(handler).not.toHaveBeenCalled();
  });

  it("should chain multiple middleware in order", async () => {
    const callOrder: string[] = [];

    const middleware1 = vi.fn().mockImplementation(async () => {
      callOrder.push("mw1");
      return undefined;
    });
    const middleware2 = vi.fn().mockImplementation(async () => {
      callOrder.push("mw2");
      return undefined;
    });
    const handler = vi.fn().mockImplementation(async () => {
      callOrder.push("handler");
      return { body: { ok: true }, status: 200, headers: new Map(), json: async () => ({ ok: true }) };
    });

    const routeHandler = createApiHandler(middleware1, middleware2, handler);
    const request = new NextRequest("http://localhost/api/test");
    await routeHandler(request);

    expect(callOrder).toEqual(["mw1", "mw2", "handler"]);
  });
});

describe("withAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should set ctx.user when authenticated", async () => {
    const mockUser = { id: "user-123", email: "test@test.com" };
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
      },
    } as never);

    const ctx: ApiContext = {
      request: new NextRequest("http://localhost/api/test"),
      user: null,
      clientIp: "127.0.0.1",
      body: null,
    };

    const result = await withAuth(ctx);

    expect(result).toBeUndefined();
    expect(ctx.user).toEqual(mockUser);
  });

  it("should return 401 when not authenticated", async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      },
    } as never);

    const ctx: ApiContext = {
      request: new NextRequest("http://localhost/api/test"),
      user: null,
      clientIp: "127.0.0.1",
      body: null,
    };

    const result = await withAuth(ctx);

    expect(result).toBeDefined();
    expect(result!.status).toBe(401);
  });
});

describe("withRateLimit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should pass through when rate limit allows", async () => {
    vi.mocked(checkRateLimit).mockResolvedValue({ allowed: true });

    const middleware = withRateLimit(null);
    const ctx: ApiContext = {
      request: new NextRequest("http://localhost/api/test"),
      user: { id: "user-123" } as never,
      clientIp: "127.0.0.1",
      body: null,
    };

    const result = await middleware(ctx);
    expect(result).toBeUndefined();
  });

  it("should return 429 when rate limit exceeded", async () => {
    vi.mocked(checkRateLimit).mockResolvedValue({ allowed: false, retryAfter: 60 });

    const middleware = withRateLimit(null);
    const ctx: ApiContext = {
      request: new NextRequest("http://localhost/api/test"),
      user: { id: "user-123" } as never,
      clientIp: "127.0.0.1",
      body: null,
    };

    const result = await middleware(ctx);
    expect(result).toBeDefined();
    expect(result!.status).toBe(429);
  });

  it("should use user ID as rate limit identifier", async () => {
    vi.mocked(checkRateLimit).mockResolvedValue({ allowed: true });
    const mockLimiter = {} as never;

    const middleware = withRateLimit(mockLimiter);
    const ctx: ApiContext = {
      request: new NextRequest("http://localhost/api/test"),
      user: { id: "user-456" } as never,
      clientIp: "127.0.0.1",
      body: null,
    };

    await middleware(ctx);
    expect(checkRateLimit).toHaveBeenCalledWith(mockLimiter, "user-456");
  });
});

describe("withIpRateLimit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should use clientIp as rate limit identifier", async () => {
    vi.mocked(checkRateLimit).mockResolvedValue({ allowed: true });
    const mockLimiter = {} as never;

    const middleware = withIpRateLimit(mockLimiter);
    const ctx: ApiContext = {
      request: new NextRequest("http://localhost/api/test"),
      user: null,
      clientIp: "192.168.1.1",
      body: null,
    };

    await middleware(ctx);
    expect(checkRateLimit).toHaveBeenCalledWith(mockLimiter, "192.168.1.1");
  });

  it("should return 429 when IP rate limit exceeded", async () => {
    vi.mocked(checkRateLimit).mockResolvedValue({ allowed: false, retryAfter: 30 });

    const middleware = withIpRateLimit(null);
    const ctx: ApiContext = {
      request: new NextRequest("http://localhost/api/test"),
      user: null,
      clientIp: "192.168.1.1",
      body: null,
    };

    const result = await middleware(ctx);
    expect(result).toBeDefined();
    expect(result!.status).toBe(429);
  });
});

describe("withJsonBody", () => {
  it("should parse valid JSON body and set ctx.body", async () => {
    const middleware = withJsonBody({ maxSize: 1024 });
    const request = new NextRequest("http://localhost/api/test", {
      method: "POST",
      headers: { "content-length": "20" },
      body: JSON.stringify({ name: "test" }),
    });
    const ctx: ApiContext = {
      request,
      user: null,
      clientIp: "127.0.0.1",
      body: null,
    };

    const result = await middleware(ctx);
    expect(result).toBeUndefined();
    expect(ctx.body).toEqual({ name: "test" });
  });

  it("should return 413 when content-length exceeds maxSize", async () => {
    const middleware = withJsonBody({ maxSize: 10 });
    const request = new NextRequest("http://localhost/api/test", {
      method: "POST",
      headers: { "content-length": "1000000" },
      body: JSON.stringify({ data: "x".repeat(1000) }),
    });
    const ctx: ApiContext = {
      request,
      user: null,
      clientIp: "127.0.0.1",
      body: null,
    };

    const result = await middleware(ctx);
    expect(result).toBeDefined();
    expect(result!.status).toBe(413);
  });

  it("should return 400 when JSON is invalid", async () => {
    const middleware = withJsonBody({ maxSize: 1024 });
    const request = new NextRequest("http://localhost/api/test", {
      method: "POST",
      body: "not json",
    });
    const ctx: ApiContext = {
      request,
      user: null,
      clientIp: "127.0.0.1",
      body: null,
    };

    const result = await middleware(ctx);
    expect(result).toBeDefined();
    expect(result!.status).toBe(400);
  });
});

describe("withRequestLogging", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should pass through without short-circuiting", async () => {
    const { logger } = await import("@/lib/logger");
    const middleware = withRequestLogging();
    const ctx: ApiContext = {
      request: new NextRequest("http://localhost/api/test"),
      user: null,
      clientIp: "127.0.0.1",
      body: null,
    };

    const result = await middleware(ctx);
    expect(result).toBeUndefined();
    expect(logger.info).toHaveBeenCalled();
  });
});
