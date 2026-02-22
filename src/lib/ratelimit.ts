import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import type { NextRequest } from "next/server";

function createRedisClient(): Redis | null {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!redisUrl || !redisToken) {
    return null;
  }

  return new Redis({ url: redisUrl, token: redisToken });
}

const redis = createRedisClient();

/**
 * Rate limiter for submission creation.
 * Allows 15 submissions per hour per user.
 * Set high for launch to maximize data collection from competitive applicants
 * who may bulk-enter 15+ decisions in one sitting.
 */
export const submissionRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(15, "1 h"),
      prefix: "ratelimit:submissions",
    })
  : null;

/**
 * Rate limiter for API read requests.
 * Allows 60 requests per minute per user.
 */
export const apiReadRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(60, "1 m"),
      prefix: "ratelimit:api-read",
    })
  : null;

/**
 * IP-based rate limiter for submissions.
 * 30/hour per IP — catches multi-account abuse from same device.
 * Set higher than per-user limit to avoid false positives on shared
 * networks (dorms, libraries, coffee shops).
 */
export const ipSubmissionRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(30, "1 h"),
      prefix: "ratelimit:ip-submissions",
    })
  : null;

/**
 * IP-based rate limiter for read requests.
 * 50/minute per IP — prevents scraping from a single IP.
 */
export const ipReadRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(50, "1 m"),
      prefix: "ratelimit:ip-read",
    })
  : null;

/**
 * Checks the rate limit for a given identifier.
 * Returns { allowed: true } if within limits, or { allowed: false, retryAfter } if exceeded.
 * If Redis is not configured, allows all requests (graceful degradation).
 */
export async function checkRateLimit(
  limiter: Ratelimit | null,
  identifier: string
): Promise<{ allowed: boolean; retryAfter?: number }> {
  if (!limiter) {
    return { allowed: true };
  }

  const result = await limiter.limit(identifier);
  if (!result.success) {
    return {
      allowed: false,
      retryAfter: Math.ceil((result.reset - Date.now()) / 1000),
    };
  }

  return { allowed: true };
}

/**
 * Extracts the client IP address from a Next.js request.
 * Vercel sets x-forwarded-for; falls back to x-real-ip, then "unknown".
 */
export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return request.headers.get("x-real-ip") ?? "unknown";
}
