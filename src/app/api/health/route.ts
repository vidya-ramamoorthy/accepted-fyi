import { NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db/index";
import { getServerConfig } from "@/lib/config";
import { Redis } from "@upstash/redis";
import { createApiHandler, withIpRateLimit, withRequestLogging } from "@/lib/api-middleware";
import { ipReadRateLimiter } from "@/lib/ratelimit";

interface HealthCheck {
  status: "up" | "down" | "skipped";
  latencyMs?: number;
  error?: string;
}

export const GET = createApiHandler(
  withRequestLogging(),
  withIpRateLimit(ipReadRateLimiter),
  async () => {
    const databaseCheck = await checkDatabase();
    const redisCheck = await checkRedis();

    const isHealthy = databaseCheck.status === "up";
    const statusCode = isHealthy ? 200 : 503;

    return NextResponse.json(
      {
        status: isHealthy ? "healthy" : "unhealthy",
        timestamp: new Date().toISOString(),
        checks: {
          database: databaseCheck,
          redis: redisCheck,
        },
      },
      { status: statusCode }
    );
  }
);

async function checkDatabase(): Promise<HealthCheck> {
  const startTime = performance.now();
  try {
    const db = getDb();
    await db.execute(sql`SELECT 1`);
    return {
      status: "up",
      latencyMs: Math.round(performance.now() - startTime),
    };
  } catch (error) {
    return {
      status: "down",
      latencyMs: Math.round(performance.now() - startTime),
      error: process.env.NODE_ENV === "production"
        ? "unavailable"
        : (error instanceof Error ? error.message : "Unknown error"),
    };
  }
}

async function checkRedis(): Promise<HealthCheck> {
  const config = getServerConfig();

  if (!config.redis) {
    return { status: "skipped" };
  }

  const startTime = performance.now();
  try {
    const redis = new Redis({ url: config.redis.url, token: config.redis.token });
    await redis.ping();
    return {
      status: "up",
      latencyMs: Math.round(performance.now() - startTime),
    };
  } catch (error) {
    return {
      status: "down",
      latencyMs: Math.round(performance.now() - startTime),
      error: process.env.NODE_ENV === "production"
        ? "unavailable"
        : (error instanceof Error ? error.message : "Unknown error"),
    };
  }
}
