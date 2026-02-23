import { NextResponse } from "next/server";
import { validateChancesInput } from "@/lib/validations/chances";
import { getAllSchoolsForChances, getSimilarProfileStats } from "@/lib/db/queries/chances";
import { classifySchools } from "@/lib/chances/classifier";
import { apiReadRateLimiter, ipReadRateLimiter } from "@/lib/ratelimit";
import { logger } from "@/lib/logger";
import {
  createApiHandler,
  withAuth,
  withRateLimit,
  withIpRateLimit,
  withRequestLogging,
} from "@/lib/api-middleware";
import type { StudentProfile } from "@/lib/chances/types";

export const GET = createApiHandler(
  withRequestLogging(),
  withAuth,
  withRateLimit(apiReadRateLimiter),
  withIpRateLimit(ipReadRateLimiter),
  async (ctx) => {
    const searchParams = ctx.request.nextUrl.searchParams;

    const validation = validateChancesInput({
      gpaUnweighted: searchParams.get("gpa") ?? undefined,
      satScore: searchParams.get("sat") ?? undefined,
      actScore: searchParams.get("act") ?? undefined,
      stateOfResidence: searchParams.get("state") ?? undefined,
      intendedMajor: searchParams.get("major") ?? undefined,
      apCoursesCount: searchParams.get("ap") ?? undefined,
    });

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.errors },
        { status: 400 }
      );
    }

    const { data } = validation;

    const studentProfile: StudentProfile = {
      gpaUnweighted: data.gpaUnweighted,
      satScore: data.satScore,
      actScore: data.actScore,
      stateOfResidence: data.stateOfResidence,
      intendedMajor: data.intendedMajor,
      apCoursesCount: data.apCoursesCount,
    };

    try {
      // Fetch school data and similar profile stats in parallel
      const [schoolDataList, similarProfileStatsList] = await Promise.all([
        getAllSchoolsForChances(),
        getSimilarProfileStats({
          gpaUnweighted: data.gpaUnweighted,
          satScore: data.satScore,
          actScore: data.actScore,
        }),
      ]);

      const result = classifySchools(studentProfile, schoolDataList, similarProfileStatsList);

      return NextResponse.json(result, {
        headers: { "Cache-Control": "private, s-maxage=300" },
      });
    } catch (error) {
      logger.error("chances.calculation_failed", { error });
      return NextResponse.json(
        { error: "Failed to calculate chances. Please try again." },
        { status: 500 }
      );
    }
  }
);
