import { createSupabaseServerClient } from "@/lib/supabase/server";
import { findOrCreateUser } from "@/lib/db/queries/users";
import { getSubmissionsWithSchool } from "@/lib/db/queries/submissions";
import { extractUserProfileData } from "@/lib/utils/auth-helpers";
import SubmissionCard from "@/components/submissions/SubmissionCard";
import SubmissionFilters from "@/components/submissions/SubmissionFilters";
import Link from "next/link";
import type { AdmissionDecision } from "@/types/database";

const VALID_DECISIONS: AdmissionDecision[] = ["accepted", "rejected", "waitlisted", "deferred"];

function isValidDecision(value: string): value is AdmissionDecision {
  return VALID_DECISIONS.includes(value as AdmissionDecision);
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

  if (!userProfile.hasSubmitted) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Browse Admissions Data
        </h1>
        <p className="mt-2 text-gray-600">
          Filter by school, state, GPA, test scores, and more.
        </p>

        <div className="mt-8 rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center">
          <div className="mx-auto max-w-sm">
            <h2 className="text-lg font-semibold text-gray-900">
              Share to unlock
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Submit your own admissions results first to unlock access to
              everyone else&apos;s data. Fair exchange — everyone contributes.
            </p>
            <Link
              href="/submit"
              className="mt-6 inline-block rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700"
            >
              Submit Your Results
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const resolvedParams = await searchParams;
  const decisionParam = resolvedParams.decision;
  const validatedDecision = decisionParam && isValidDecision(decisionParam)
    ? decisionParam
    : undefined;

  const filters = {
    schoolName: resolvedParams.school,
    decision: validatedDecision,
    admissionCycle: resolvedParams.cycle,
    stateOfResidence: resolvedParams.state,
    page: resolvedParams.page ? parseInt(resolvedParams.page) : 1,
  };

  const { submissions, totalCount, page, totalPages } =
    await getSubmissionsWithSchool(filters);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Browse Admissions Data
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {totalCount} result{totalCount !== 1 ? "s" : ""} found
          </p>
        </div>
        <Link
          href="/submit"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Add Result
        </Link>
      </div>

      <div className="mt-6">
        <SubmissionFilters />
      </div>

      {submissions.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center">
          <p className="text-gray-500">
            No submissions match your filters. Try adjusting your search or be
            the first to submit for this school!
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {submissions.map((submission) => (
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
              extracurriculars={submission.extracurriculars}
              createdAt={submission.createdAt}
            />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-4">
          {page > 1 && (
            <Link
              href={buildPageUrl(resolvedParams, page - 1)}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Previous
            </Link>
          )}
          <span className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={buildPageUrl(resolvedParams, page + 1)}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
