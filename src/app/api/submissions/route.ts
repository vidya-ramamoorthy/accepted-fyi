import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { validateSubmission } from "@/lib/validations/submission";
import { extractUserProfileData } from "@/lib/utils/auth-helpers";
import { findOrCreateUser, markUserAsSubmitted } from "@/lib/db/queries/users";
import { findOrCreateSchool } from "@/lib/db/queries/schools";
import { createSubmission, getSubmissionsWithSchool } from "@/lib/db/queries/submissions";
import { checkRateLimit, submissionRateLimiter, apiReadRateLimiter } from "@/lib/ratelimit";
import type { AdmissionDecision } from "@/types/database";

const VALID_DECISIONS: AdmissionDecision[] = ["accepted", "rejected", "waitlisted", "deferred"];

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateLimitResult = await checkRateLimit(submissionRateLimiter, authUser.id);
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: "Too many submissions. Please try again later.", retryAfter: rateLimitResult.retryAfter },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const validation = validateSubmission(body as Parameters<typeof validateSubmission>[0]);

  if (!validation.success) {
    return NextResponse.json(
      { error: "Validation failed", details: validation.errors },
      { status: 400 }
    );
  }

  const { data } = validation;

  try {
    const userProfile = await findOrCreateUser(extractUserProfileData(authUser));

    const school = await findOrCreateSchool({
      name: data.schoolName,
      state: data.schoolState,
      city: data.schoolCity,
    });

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
      scholarshipOffered: data.scholarshipOffered,
      willAttend: data.willAttend,
      waitlistOutcome: data.waitlistOutcome,
    });

    if (!userProfile.hasSubmitted) {
      await markUserAsSubmitted(authUser.id);
    }

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

    console.error("Submission creation failed:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateLimitResult = await checkRateLimit(apiReadRateLimiter, authUser.id);
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down.", retryAfter: rateLimitResult.retryAfter },
      { status: 429 }
    );
  }

  const searchParams = request.nextUrl.searchParams;
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
    return NextResponse.json(results);
  } catch (error) {
    console.error("Failed to fetch submissions:", error);
    return NextResponse.json(
      { error: "Failed to fetch submissions" },
      { status: 500 }
    );
  }
}
