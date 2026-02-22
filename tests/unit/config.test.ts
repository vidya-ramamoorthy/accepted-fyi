import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

describe("getServerConfig", () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...ORIGINAL_ENV };
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  function setRequiredEnvVars() {
    process.env.DATABASE_URL = "postgres://localhost:5432/test";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
  }

  it("should return valid config when all required env vars are set", async () => {
    setRequiredEnvVars();
    const { getServerConfig } = await import("@/lib/config");
    const config = getServerConfig();

    expect(config.database.url).toBe("postgres://localhost:5432/test");
    expect(config.supabase.url).toBe("https://test.supabase.co");
    expect(config.supabase.anonKey).toBe("test-anon-key");
  });

  it("should return null for optional Redis vars when absent", async () => {
    setRequiredEnvVars();
    const { getServerConfig } = await import("@/lib/config");
    const config = getServerConfig();

    expect(config.redis).toBeNull();
  });

  it("should return Redis config when Redis vars are set", async () => {
    setRequiredEnvVars();
    process.env.UPSTASH_REDIS_REST_URL = "https://redis.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "redis-token";
    const { getServerConfig } = await import("@/lib/config");
    const config = getServerConfig();

    expect(config.redis).toEqual({
      url: "https://redis.upstash.io",
      token: "redis-token",
    });
  });

  it("should throw listing ALL missing required vars", async () => {
    delete process.env.DATABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const { getServerConfig } = await import("@/lib/config");

    expect(() => getServerConfig()).toThrowError(/DATABASE_URL/);
    expect(() => getServerConfig()).toThrowError(/NEXT_PUBLIC_SUPABASE_URL/);
    expect(() => getServerConfig()).toThrowError(/NEXT_PUBLIC_SUPABASE_ANON_KEY/);
  });

  it("should throw listing only the missing vars", async () => {
    process.env.DATABASE_URL = "postgres://localhost:5432/test";
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const { getServerConfig } = await import("@/lib/config");

    expect(() => getServerConfig()).toThrowError(/NEXT_PUBLIC_SUPABASE_URL/);
    expect(() => getServerConfig()).toThrowError(/NEXT_PUBLIC_SUPABASE_ANON_KEY/);
    expect(() => getServerConfig()).not.toThrowError(/DATABASE_URL/);
  });

  it("should cache config across calls", async () => {
    setRequiredEnvVars();
    const { getServerConfig } = await import("@/lib/config");
    const firstCall = getServerConfig();
    const secondCall = getServerConfig();

    expect(firstCall).toBe(secondCall);
  });

  it("should return null Redis when only URL is set without token", async () => {
    setRequiredEnvVars();
    process.env.UPSTASH_REDIS_REST_URL = "https://redis.upstash.io";
    const { getServerConfig } = await import("@/lib/config");
    const config = getServerConfig();

    expect(config.redis).toBeNull();
  });
});

describe("getPublicConfig", () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...ORIGINAL_ENV };
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  it("should return public Supabase config", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
    const { getPublicConfig } = await import("@/lib/config");
    const config = getPublicConfig();

    expect(config.supabase.url).toBe("https://test.supabase.co");
    expect(config.supabase.anonKey).toBe("test-anon-key");
  });

  it("should throw listing all missing public vars", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const { getPublicConfig } = await import("@/lib/config");

    expect(() => getPublicConfig()).toThrowError(/NEXT_PUBLIC_SUPABASE_URL/);
    expect(() => getPublicConfig()).toThrowError(/NEXT_PUBLIC_SUPABASE_ANON_KEY/);
  });

  it("should cache config across calls", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
    const { getPublicConfig } = await import("@/lib/config");
    const firstCall = getPublicConfig();
    const secondCall = getPublicConfig();

    expect(firstCall).toBe(secondCall);
  });
});
