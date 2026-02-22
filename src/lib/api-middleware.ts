import { NextRequest, NextResponse } from "next/server";
import type { Ratelimit } from "@upstash/ratelimit";
import type { User } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientIp } from "@/lib/ratelimit";
import { logger } from "@/lib/logger";

export interface ApiContext {
  request: NextRequest;
  user: User | null;
  clientIp: string;
  body: Record<string, unknown> | null;
}

type MiddlewareResult = Response | undefined | void;
type Middleware = (ctx: ApiContext) => Promise<MiddlewareResult>;

/**
 * Creates a Next.js API route handler by chaining middleware functions.
 * Each middleware receives a shared context object. The first middleware
 * to return a Response short-circuits the chain.
 * The last function in the chain is the final handler.
 */
export function createApiHandler(...steps: Middleware[]) {
  return async (request: NextRequest): Promise<Response> => {
    const ctx: ApiContext = {
      request,
      user: null,
      clientIp: getClientIp(request),
      body: null,
    };

    for (const step of steps) {
      const result = await step(ctx);
      if (result) return result;
    }

    return NextResponse.json({ error: "No response from handler" }, { status: 500 });
  };
}

/**
 * Authenticates the request via Supabase.
 * Sets ctx.user on success, returns 401 on failure.
 */
export async function withAuth(ctx: ApiContext): Promise<MiddlewareResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  ctx.user = authUser;
  return undefined;
}

/**
 * Rate limits by user ID. Requires withAuth to have run first.
 * Returns a middleware function that checks per-user rate limits.
 */
export function withRateLimit(limiter: Ratelimit | null): Middleware {
  return async (ctx: ApiContext): Promise<MiddlewareResult> => {
    if (!ctx.user) return undefined;

    const result = await checkRateLimit(limiter, ctx.user.id);
    if (!result.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later.", retryAfter: result.retryAfter },
        { status: 429 }
      );
    }

    return undefined;
  };
}

/**
 * Rate limits by client IP address.
 * Returns a middleware function that checks per-IP rate limits.
 */
export function withIpRateLimit(limiter: Ratelimit | null): Middleware {
  return async (ctx: ApiContext): Promise<MiddlewareResult> => {
    const result = await checkRateLimit(limiter, ctx.clientIp);
    if (!result.allowed) {
      return NextResponse.json(
        { error: "Too many requests from this network. Please try again later.", retryAfter: result.retryAfter },
        { status: 429 }
      );
    }

    return undefined;
  };
}

/**
 * Parses JSON request body and checks Content-Length against maxSize.
 * Sets ctx.body on success. Returns 413 if too large, 400 if invalid JSON.
 */
export function withJsonBody(options: { maxSize: number }): Middleware {
  return async (ctx: ApiContext): Promise<MiddlewareResult> => {
    const contentLength = ctx.request.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > options.maxSize) {
      return NextResponse.json(
        { error: "Request body too large" },
        { status: 413 }
      );
    }

    try {
      ctx.body = await ctx.request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    return undefined;
  };
}

/**
 * Logs the incoming request method and path.
 * This is a pass-through middleware — it never short-circuits.
 */
export function withRequestLogging(): Middleware {
  return async (ctx: ApiContext): Promise<MiddlewareResult> => {
    logger.info("api.request", {
      method: ctx.request.method,
      path: ctx.request.nextUrl.pathname,
      clientIp: ctx.clientIp,
    });

    return undefined;
  };
}
