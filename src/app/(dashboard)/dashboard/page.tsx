import { createSupabaseServerClient } from "@/lib/supabase/server";
import { findOrCreateUser } from "@/lib/db/queries/users";
import { getSubmissionsByUser } from "@/lib/db/queries/submissions";
import { getPlatformStats } from "@/lib/db/queries/platform-stats";
import { extractUserProfileData } from "@/lib/utils/auth-helpers";
import SubmissionCard from "@/components/submissions/SubmissionCard";
import ShareCardButton from "@/components/cards/ShareCardButton";
import Link from "next/link";

function formatNumber(value: number): string {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  }
  return value.toLocaleString();
}

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  const [userProfile, platformStats] = await Promise.all([
    findOrCreateUser(extractUserProfileData(authUser)),
    getPlatformStats(),
  ]);
  const submissions = await getSubmissionsByUser(userProfile.id);

  return (
    <div>
      {/* Community Stats */}
      <section className="mb-8">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-white/5 bg-slate-900/50 p-4">
            <p className="text-xs font-medium text-slate-400">Admission Outcomes</p>
            <p className="mt-1 text-2xl font-bold text-white">
              {formatNumber(platformStats.totalOutcomes)}+
            </p>
          </div>
          <div className="rounded-xl border border-white/5 bg-slate-900/50 p-4">
            <p className="text-xs font-medium text-slate-400">Schools Tracked</p>
            <p className="mt-1 text-2xl font-bold text-white">
              {formatNumber(platformStats.totalSchools)}+
            </p>
          </div>
        </div>
      </section>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">My Dashboard</h1>
          <p className="mt-1 text-sm text-slate-400">
            {userProfile.displayName} &middot; {submissions.length} submission{submissions.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/submit"
          className="rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-600/25 transition-all hover:shadow-xl"
        >
          + Add Result
        </Link>
      </div>

      {submissions.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-white/5 bg-slate-900/50 p-16 text-center">
          <div className="mx-auto max-w-sm">
            <h2 className="text-lg font-semibold text-white">
              No submissions yet
            </h2>
            <p className="mt-3 text-sm text-slate-400">
              Submit your first admissions result to unlock access to everyone
              else&apos;s data.
            </p>
            <Link
              href="/submit"
              className="mt-8 inline-block rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-600/25"
            >
              Submit Your Results
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {submissions.map((submission) => (
            <div key={submission.id} className="space-y-2">
              <SubmissionCard
                id={submission.id}
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
                geographicClassification={submission.geographicClassification}
                apCoursesCount={submission.apCoursesCount}
                ibCoursesCount={submission.ibCoursesCount}
                honorsCoursesCount={submission.honorsCoursesCount}
                scholarshipOffered={submission.scholarshipOffered}
                willAttend={submission.willAttend}
                waitlistOutcome={submission.waitlistOutcome}
              />
              <div className="flex justify-end">
                <ShareCardButton
                  submissionId={submission.id}
                  schoolName={submission.schoolName}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
