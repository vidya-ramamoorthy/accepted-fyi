import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

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
 * Allows 5 submissions per hour per user.
 */
export const submissionRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "1 h"),
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
