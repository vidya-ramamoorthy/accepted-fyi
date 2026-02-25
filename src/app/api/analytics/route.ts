import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db/index";
import { logger } from "@/lib/logger";
import {
  createApiHandler,
  withAuth,
  withRateLimit,
  withIpRateLimit,
  withRequestLogging,
} from "@/lib/api-middleware";
import { apiReadRateLimiter, ipReadRateLimiter } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

export const GET = createApiHandler(
  withRequestLogging(),
  withAuth,
  withRateLimit(apiReadRateLimiter),
  withIpRateLimit(ipReadRateLimiter),
  async () => {
    const db = getDb();

    try {
      const [userStats, submissionStats, decisionBreakdown, topSchools] =
        await Promise.all([
          db.execute(sql`
            SELECT
              count(*)::int AS "totalUsers",
              count(CASE WHEN has_submitted THEN 1 END)::int AS "usersWithSubmissions",
              count(CASE WHEN created_at >= now() - interval '7 days' THEN 1 END)::int AS "usersLast7Days",
              count(CASE WHEN created_at >= now() - interval '30 days' THEN 1 END)::int AS "usersLast30Days"
            FROM user_profiles
          `),

          db.execute(sql`
            SELECT
              count(*)::int AS "totalSubmissions",
              count(CASE WHEN data_source = 'user' THEN 1 END)::int AS "userSubmissions",
              count(CASE WHEN data_source = 'reddit' THEN 1 END)::int AS "redditSubmissions",
              count(CASE WHEN created_at >= now() - interval '7 days' THEN 1 END)::int AS "submissionsLast7Days",
              count(CASE WHEN created_at >= now() - interval '30 days' THEN 1 END)::int AS "submissionsLast30Days"
            FROM admission_submissions
          `),

          db.execute(sql`
            SELECT decision, count(*)::int AS "count"
            FROM admission_submissions
            WHERE data_source = 'user'
            GROUP BY decision
            ORDER BY count(*) DESC
          `),

          db.execute(sql`
            SELECT s.name AS "schoolName", count(*)::int AS "submissionCount"
            FROM admission_submissions a
            JOIN schools s ON a.school_id = s.id
            WHERE a.data_source = 'user'
            GROUP BY s.name
            ORDER BY count(*) DESC
            LIMIT 10
          `),
        ]);

      return NextResponse.json(
        {
          users: userStats[0],
          submissions: submissionStats[0],
          decisions: decisionBreakdown,
          topSchools,
          generatedAt: new Date().toISOString(),
        },
        {
          headers: {
            "Cache-Control": "private, s-maxage=60",
          },
        }
      );
    } catch (error) {
      logger.error("analytics.query_failed", { error });
      return NextResponse.json(
        { error: "Failed to fetch analytics" },
        { status: 500 }
      );
    }
  }
);
