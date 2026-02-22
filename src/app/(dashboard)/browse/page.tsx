import { createSupabaseServerClient } from "@/lib/supabase/server";
import { findOrCreateUser } from "@/lib/db/queries/users";
import { getSubmissionsWithSchool } from "@/lib/db/queries/submissions";
import { extractUserProfileData } from "@/lib/utils/auth-helpers";
import SubmissionCard from "@/components/submissions/SubmissionCard";
import SubmissionFilters from "@/components/submissions/SubmissionFilters";
import Link from "next/link";
import type { AdmissionDecision, DataSource } from "@/types/database";

const VALID_DECISIONS: AdmissionDecision[] = ["accepted", "rejected", "waitlisted", "deferred"];
const VALID_DATA_SOURCES: DataSource[] = ["user", "reddit", "college_confidential", "public_scraped"];
const PREVIEW_CARD_COUNT = 3;

function isValidDecision(value: string): value is AdmissionDecision {
  return VALID_DECISIONS.includes(value as AdmissionDecision);
}

function isValidDataSource(value: string): value is DataSource {
  return VALID_DATA_SOURCES.includes(value as DataSource);
}

function buildPageUrl(currentParams: Record<string, string | undefined>, pageNumber: number): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(currentParams)) {
    if (value && key !== "page") {
      params.set(key, value);
    }
  }
  params.set("page", pageNumber.toString());
  return `/browse?${params.toString()}`;
}

interface BrowsePageProps {
  searchParams: Promise<{
    school?: string;
    decision?: string;
    cycle?: string;
    state?: string;
    source?: string;
    major?: string;
    page?: string;
  }>;
}

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  const userProfile = await findOrCreateUser(extractUserProfileData(authUser));
  const hasSubmitted = userProfile.hasSubmitted;

  const resolvedParams = await searchParams;
  const decisionParam = resolvedParams.decision;
  const validatedDecision = decisionParam && isValidDecision(decisionParam)
    ? decisionParam
    : undefined;
  const sourceParam = resolvedParams.source;
  const validatedDataSource = sourceParam && isValidDataSource(sourceParam)
    ? sourceParam
    : undefined;

  const filters = {
    schoolName: resolvedParams.school,
    decision: validatedDecision,
    admissionCycle: resolvedParams.cycle,
    stateOfResidence: resolvedParams.state,
    dataSource: validatedDataSource,
    intendedMajor: resolvedParams.major,
    page: resolvedParams.page ? parseInt(resolvedParams.page) : 1,
  };

  const { submissions, totalCount, page, totalPages } =
    await getSubmissionsWithSchool(filters);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Browse Admissions Data
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {totalCount} result{totalCount !== 1 ? "s" : ""} found
          </p>
        </div>
        <Link
          href="/submit"
          className="rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-violet-600/25 transition-all hover:shadow-xl"
        >
          + Add Result
        </Link>
      </div>

      {/* Soft nudge banner for users who haven't submitted */}
      {!hasSubmitted && (
        <div className="mt-6 rounded-xl border border-violet-500/20 bg-violet-500/10 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium text-white">
                Help the community — share your results
              </p>
              <p className="mt-1 text-sm text-slate-400">
                You can browse aggregate stats, but full details are unlocked when you contribute.
              </p>
            </div>
            <Link
              href="/submit"
              className="shrink-0 rounded-lg bg-violet-600 px-5 py-2 text-center text-sm font-medium text-white hover:bg-violet-700"
            >
              Submit Results
            </Link>
          </div>
        </div>
      )}

      <div className="mt-6">
        <SubmissionFilters />
      </div>

      {submissions.length === 0 ? (
        <div className="mt-8 rounded-xl border border-white/5 bg-slate-900/50 p-12 text-center">
          <p className="text-slate-400">
            No submissions match your filters. Try adjusting your search or be
            the first to submit for this school!
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {/* Only render cards the user is allowed to see — never send hidden data to the client */}
          {submissions
            .slice(0, hasSubmitted ? submissions.length : PREVIEW_CARD_COUNT)
            .map((submission) => (
              <SubmissionCard
                key={submission.id}
                schoolName={submission.schoolName}
                schoolState={submission.schoolState}
                decision={submission.decision}
                applicationRound={submission.applicationRound}
                admissionCycle={submission.admissionCycle}
                gpaUnweighted={submission.gpaUnweighted}
                gpaWeighted={submission.gpaWeighted}
                satScore={submission.satScore}
                actScore={submission.actScore}
                intendedMajor={submission.intendedMajor}
                stateOfResidence={submission.stateOfResidence}
                verificationTier={submission.verificationTier}
                dataSource={submission.dataSource}
                extracurriculars={submission.extracurriculars}
                createdAt={submission.createdAt}
                highSchoolType={submission.highSchoolType}
                firstGeneration={submission.firstGeneration}
                legacyStatus={submission.legacyStatus}
                financialAidApplied={submission.financialAidApplied}
                geographicClassification={submission.geographicClassification}
                apCoursesCount={submission.apCoursesCount}
                ibCoursesCount={submission.ibCoursesCount}
                honorsCoursesCount={submission.honorsCoursesCount}
                scholarshipOffered={submission.scholarshipOffered}
                willAttend={submission.willAttend}
                waitlistOutcome={submission.waitlistOutcome}
              />
            ))}
          {!hasSubmitted && totalCount > PREVIEW_CARD_COUNT && (
            <div className="rounded-xl border border-violet-500/20 bg-violet-500/10 p-8 text-center">
              <p className="font-medium text-white">
                +{totalCount - PREVIEW_CARD_COUNT} more result{totalCount - PREVIEW_CARD_COUNT !== 1 ? "s" : ""}
              </p>
              <p className="mt-1 text-sm text-slate-400">
                Submit your results to unlock all admissions data.
              </p>
              <Link
                href="/submit"
                className="mt-4 inline-block rounded-lg bg-violet-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-violet-700"
              >
                Submit to see all results
              </Link>
            </div>
          )}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-4">
          {page > 1 && (
            <Link
              href={buildPageUrl(resolvedParams, page - 1)}
              className="rounded-md border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
            >
              Previous
            </Link>
          )}
          <span className="text-sm text-slate-500">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={buildPageUrl(resolvedParams, page + 1)}
              className="rounded-md border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
            >
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
