import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { validateSubmission } from "@/lib/validations/submission";
import { extractUserProfileData } from "@/lib/utils/auth-helpers";
import { findOrCreateUser, markUserAsSubmitted } from "@/lib/db/queries/users";
import { findOrCreateSchool } from "@/lib/db/queries/schools";
import { createSubmission, getSubmissionsWithSchool } from "@/lib/db/queries/submissions";
import {
  submissionRateLimiter,
  apiReadRateLimiter,
  ipSubmissionRateLimiter,
  ipReadRateLimiter,
} from "@/lib/ratelimit";
import {
  isHoneypotFilled,
  isSubmittedTooFast,
  detectSuspiciousSubmission,
} from "@/lib/utils/anti-abuse";
import { logger } from "@/lib/logger";
import {
  createApiHandler,
  withAuth,
  withRateLimit,
  withIpRateLimit,
  withJsonBody,
  withRequestLogging,
} from "@/lib/api-middleware";
import type { AdmissionDecision } from "@/types/database";

const VALID_DECISIONS: AdmissionDecision[] = ["accepted", "rejected", "waitlisted", "deferred"];

export const POST = createApiHandler(
  withRequestLogging(),
  withAuth,
  withRateLimit(submissionRateLimiter),
  withIpRateLimit(ipSubmissionRateLimiter),
  withJsonBody({ maxSize: 64 * 1024 }),
  async (ctx) => {
    const body = ctx.body!;

    // Honeypot check — bots fill the invisible field, humans don't.
    // Return 201 to avoid revealing the detection to bots.
    if (isHoneypotFilled(body._website)) {
      return NextResponse.json({ submission: { id: "ok" } }, { status: 201 });
    }

    // Timestamp check — reject if form completed in under 3 seconds
    if (isSubmittedTooFast(body._formLoadedAt)) {
      return NextResponse.json(
        { error: "Please take a moment to fill out the form completely." },
        { status: 422 }
      );
    }

    const validation = validateSubmission(body as unknown as Parameters<typeof validateSubmission>[0]);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.errors },
        { status: 400 }
      );
    }

    const { data } = validation;

    try {
      const userProfile = await findOrCreateUser(extractUserProfileData(ctx.user!));

      const school = await findOrCreateSchool({
        name: data.schoolName,
        state: data.schoolState,
        city: data.schoolCity,
      });

      // Cross-validation: check for suspicious patterns in user's history
      const abuseCheck = await detectSuspiciousSubmission(
        userProfile.id,
        data.decision,
        data.admissionCycle,
        data.gpaUnweighted,
        data.satScore,
      );

      // Suspicious submissions get "pending_review" (delayed visibility),
      // legitimate submissions are immediately visible
      const submissionStatus = abuseCheck.isSuspicious ? "pending_review" : "visible";

      if (abuseCheck.isSuspicious) {
        logger.warn("submission.suspicious", {
          userId: userProfile.id,
          reasons: abuseCheck.reasons,
        });
      }

      const submission = await createSubmission({
        userId: userProfile.id,
        schoolId: school.id,
        admissionCycle: data.admissionCycle,
        decision: data.decision,
        applicationRound: data.applicationRound,
        gpaUnweighted: data.gpaUnweighted,
        gpaWeighted: data.gpaWeighted,
        satScore: data.satScore,
        actScore: data.actScore,
        intendedMajor: data.intendedMajor,
        stateOfResidence: data.stateOfResidence,
        extracurriculars: data.extracurriculars,
        highSchoolType: data.highSchoolType,
        firstGeneration: data.firstGeneration,
        legacyStatus: data.legacyStatus,
        financialAidApplied: data.financialAidApplied,
        geographicClassification: data.geographicClassification,
        apCoursesCount: data.apCoursesCount,
        ibCoursesCount: data.ibCoursesCount,
        honorsCoursesCount: data.honorsCoursesCount,
        scholarshipOffered: data.scholarshipOffered,
        willAttend: data.willAttend,
        waitlistOutcome: data.waitlistOutcome,
        submissionStatus,
      });

      if (!userProfile.hasSubmitted) {
        await markUserAsSubmitted(ctx.user!.id);
      }

      revalidateTag(`school-submissions-${school.id}`, { expire: 0 });
      revalidateTag("chances-profiles", { expire: 0 });

      return NextResponse.json({ submission }, { status: 201 });
    } catch (error) {
      const isDuplicateSubmission =
        error instanceof Error && error.message.includes("unique_user_school_cycle");

      if (isDuplicateSubmission) {
        return NextResponse.json(
          { error: "You have already submitted a result for this school and cycle" },
          { status: 409 }
        );
      }

      logger.error("submission.creation_failed", { error });
      return NextResponse.json(
        { error: "An unexpected error occurred. Please try again." },
        { status: 500 }
      );
    }
  }
);

export const GET = createApiHandler(
  withRequestLogging(),
  withAuth,
  withRateLimit(apiReadRateLimiter),
  withIpRateLimit(ipReadRateLimiter),
  async (ctx) => {
    const searchParams = ctx.request.nextUrl.searchParams;
    const decisionParam = searchParams.get("decision");
    const validatedDecision =
      decisionParam && VALID_DECISIONS.includes(decisionParam as AdmissionDecision)
        ? (decisionParam as AdmissionDecision)
        : undefined;

    const filters = {
      schoolName: searchParams.get("school") ?? undefined,
      decision: validatedDecision,
      admissionCycle: searchParams.get("cycle") ?? undefined,
      stateOfResidence: searchParams.get("state") ?? undefined,
      minGpa: searchParams.get("minGpa") ? parseFloat(searchParams.get("minGpa")!) : undefined,
      maxGpa: searchParams.get("maxGpa") ? parseFloat(searchParams.get("maxGpa")!) : undefined,
      minSat: searchParams.get("minSat") ? parseInt(searchParams.get("minSat")!) : undefined,
      maxSat: searchParams.get("maxSat") ? parseInt(searchParams.get("maxSat")!) : undefined,
      page: searchParams.get("page") ? parseInt(searchParams.get("page")!) : 1,
      pageSize: searchParams.get("pageSize") ? parseInt(searchParams.get("pageSize")!) : 20,
    };

    try {
      const results = await getSubmissionsWithSchool(filters);
      return NextResponse.json(results, {
        headers: { "Cache-Control": "private, s-maxage=60" },
      });
    } catch (error) {
      logger.error("submissions.fetch_failed", { error });
      return NextResponse.json(
        { error: "Failed to fetch submissions" },
        { status: 500 }
      );
    }
  }
);
