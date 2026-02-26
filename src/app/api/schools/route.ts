import { NextRequest, NextResponse } from "next/server";
import { getSchoolsWithStats, searchSchools } from "@/lib/db/queries/schools";
import { createApiHandler, withIpRateLimit, withRequestLogging } from "@/lib/api-middleware";
import { ipReadRateLimiter } from "@/lib/ratelimit";
import { logger } from "@/lib/logger";

export const GET = createApiHandler(
  withRequestLogging(),
  withIpRateLimit(ipReadRateLimiter),
  async (ctx) => {
    const searchQuery = ctx.request.nextUrl.searchParams.get("q");

    try {
      if (searchQuery) {
        const results = await searchSchools(searchQuery);
        return NextResponse.json(
          { schools: results },
          { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" } }
        );
      }

      const schoolsWithStats = await getSchoolsWithStats();
      return NextResponse.json(
        { schools: schoolsWithStats },
        { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } }
      );
    } catch (error) {
      logger.error("schools.fetch_failed", { error });
      return NextResponse.json(
        { error: "Failed to fetch schools" },
        { status: 500 }
      );
    }
  }
);
