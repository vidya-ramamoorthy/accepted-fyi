import Link from "next/link";
import type { Metadata } from "next";
import { getSchoolsByNamePattern } from "@/lib/db/queries/schools";
import {
  getSubmissionStatsForSchool,
  getSubmissionsForSchool,
} from "@/lib/db/queries/submissions";
import { DECISION_DATES_2025_2026 } from "@/lib/constants/decision-dates";
import DecisionTimeline from "@/components/DecisionTimeline";
import SubmissionCard from "@/components/submissions/SubmissionCard";
import NavbarAuthSection from "@/components/NavbarAuthSection";
import StatCard from "@/components/ui/StatCard";

export const revalidate = 1800;

const MIT_NAME = "Massachusetts Institute of Technology";

export const metadata: Metadata = {
  title:
    "MIT Admissions Data — Acceptance Rate, SAT Scores & Real Outcomes | accepted.fyi",
  description:
    "See real MIT admissions data: acceptance rate, SAT/ACT score ranges, and community-reported outcomes. Pi Day decisions March 14.",
  openGraph: {
    title:
      "MIT Admissions Data — Acceptance Rate, SAT Scores & Real Outcomes | accepted.fyi",
    description:
      "See real MIT admissions data: acceptance rate, SAT/ACT score ranges, and community-reported outcomes.",
    type: "website",
    siteName: "accepted.fyi",
  },
  twitter: {
    card: "summary_large_image",
    title:
      "MIT Admissions Data — Acceptance Rate, SAT Scores & Real Outcomes | accepted.fyi",
    description:
      "See real MIT admissions data. Pi Day decisions March 14.",
  },
};

export default async function MITPage() {
  const mitSchools = await getSchoolsByNamePattern(MIT_NAME, "mit");
  const mitSchool = mitSchools[0];

  if (!mitSchool) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">MIT not found</h1>
          <p className="mt-2 text-slate-400">
            School data has not been ingested yet.
          </p>
          <Link
            href="/colleges"
            className="mt-4 inline-block text-sm text-violet-400 hover:text-violet-300"
          >
            Browse all colleges
          </Link>
        </div>
      </div>
    );
  }

  const [submissionStats, recentSubmissions] = await Promise.all([
    getSubmissionStatsForSchool(mitSchool.id),
    getSubmissionsForSchool(mitSchool.id, 1),
  ]);

  const {
    totalCount: totalSubmissions,
    acceptedCount,
    rejectedCount,
    waitlistedCount,
    deferredCount,
    avgGpaUnweighted: averageGpa,
    avgSatScore: averageSat,
    avgActScore: averageAct,
  } = submissionStats;

  const crowdsourcedAcceptanceRate =
    totalSubmissions > 0
      ? Math.round((acceptedCount / totalSubmissions) * 100)
      : null;

  // Get MIT decision timeline from static constants
  const mitDecisionEntries = DECISION_DATES_2025_2026.filter(
    (entry) => entry.schoolName === MIT_NAME
  );
  const timelineEntries = mitDecisionEntries.map((entry) => ({
    applicationRound: entry.round,
    expectedDate: new Date(entry.expectedDate),
    actualDate: null,
    isConfirmed: entry.isConfirmed,
    notes: entry.notes ?? null,
  }));

  // Limit recent submissions to 10
  const displaySubmissions = recentSubmissions.slice(0, 10);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: MIT_NAME,
    alternateName: "MIT",
    address: {
      "@type": "PostalAddress",
      addressLocality: mitSchool.city,
      addressRegion: mitSchool.state,
      addressCountry: "US",
    },
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav className="fixed top-0 z-50 w-full border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-xl font-bold text-white tracking-tight">
            accepted
            <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              .fyi
            </span>
          </Link>
          <NavbarAuthSection />
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-6 pb-16 pt-28">
        <Link
          href="/colleges"
          className="inline-flex items-center text-sm text-violet-400 transition-colors hover:text-violet-300"
        >
          &larr; Browse Colleges
        </Link>

        {/* Header */}
        <div className="mt-6">
          <h1 className="text-3xl font-bold text-white sm:text-4xl">
            MIT Admissions Data
          </h1>
          <p className="mt-2 text-slate-400">
            Real admissions outcomes for the Massachusetts Institute of
            Technology.
          </p>
        </div>

        {/* Pi Day Decision Callout */}
        <div className="mt-6 rounded-2xl border border-violet-500/20 bg-violet-500/5 p-6">
          <div className="flex items-start gap-3">
            <span className="text-2xl">&#x1D70B;</span>
            <div>
              <h2 className="font-semibold text-violet-300">
                Pi Day Decisions — March 14
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                MIT releases Regular Decision results on Pi Day (3/14) at 6:28pm
                ET — &quot;Tau Time&quot; (2&pi;). A beloved tradition since
                2012.
              </p>
            </div>
          </div>
        </div>

        {/* Decision Timeline */}
        {timelineEntries.length > 0 && (
          <div className="mt-6">
            <DecisionTimeline schoolName="MIT" entries={timelineEntries} />
          </div>
        )}

        {/* Official Institutional Data */}
        {(mitSchool.acceptanceRate ||
          mitSchool.satAverage ||
          mitSchool.actMedian ||
          mitSchool.undergradEnrollment) && (
          <div className="mt-6 rounded-2xl border border-white/5 bg-slate-900/50 p-6">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="font-semibold text-white">Official Data</h2>
              <span className="text-xs text-slate-600">
                Source: College Scorecard, US Dept. of Education
              </span>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {mitSchool.acceptanceRate && (
                <div>
                  <p className="text-xs text-slate-500">Acceptance Rate</p>
                  <p className="text-lg font-bold text-emerald-400">
                    {mitSchool.acceptanceRate}%
                  </p>
                </div>
              )}
              {mitSchool.satAverage && (
                <div>
                  <p className="text-xs text-slate-500">SAT Average</p>
                  <p className="text-lg font-bold text-white">
                    {mitSchool.satAverage}
                  </p>
                </div>
              )}
              {mitSchool.sat25thPercentile && mitSchool.sat75thPercentile && (
                <div>
                  <p className="text-xs text-slate-500">SAT Range (25th-75th)</p>
                  <p className="text-lg font-bold text-white">
                    {mitSchool.sat25thPercentile}-{mitSchool.sat75thPercentile}
                  </p>
                </div>
              )}
              {mitSchool.actMedian && (
                <div>
                  <p className="text-xs text-slate-500">ACT Median</p>
                  <p className="text-lg font-bold text-white">
                    {mitSchool.actMedian}
                  </p>
                </div>
              )}
              {mitSchool.act25thPercentile && mitSchool.act75thPercentile && (
                <div>
                  <p className="text-xs text-slate-500">ACT Range (25th-75th)</p>
                  <p className="text-lg font-bold text-white">
                    {mitSchool.act25thPercentile}-{mitSchool.act75thPercentile}
                  </p>
                </div>
              )}
              {mitSchool.undergradEnrollment && (
                <div>
                  <p className="text-xs text-slate-500">Undergrad Enrollment</p>
                  <p className="text-lg font-bold text-white">
                    {mitSchool.undergradEnrollment.toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Community Data — Aggregate Stats */}
        <div className="mt-8">
          <h2 className="font-semibold text-white">Community Data</h2>
          <p className="mt-1 text-xs text-slate-500">
            From {totalSubmissions} crowdsourced submission
            {totalSubmissions !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Submissions" value={totalSubmissions.toString()} />
          <StatCard
            label="Crowdsourced Accept Rate"
            value={
              crowdsourcedAcceptanceRate !== null
                ? `${crowdsourcedAcceptanceRate}%`
                : "\u2014"
            }
            valueColor="text-emerald-400"
          />
          <StatCard
            label="Avg GPA (UW)"
            value={averageGpa?.toString() ?? "\u2014"}
          />
          <StatCard
            label="Avg SAT"
            value={averageSat?.toString() ?? "\u2014"}
          />
          {averageAct !== null && (
            <StatCard label="Avg ACT" value={averageAct.toString()} />
          )}
        </div>

        {/* Decision Breakdown */}
        {totalSubmissions > 0 && (
          <div className="mt-6 rounded-2xl border border-white/5 bg-slate-900/50 p-6">
            <h2 className="font-semibold text-white">Decision Breakdown</h2>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <DecisionStat
                label="Accepted"
                count={acceptedCount}
                color="text-emerald-400"
                bgColor="bg-emerald-500/10"
              />
              <DecisionStat
                label="Rejected"
                count={rejectedCount}
                color="text-red-400"
                bgColor="bg-red-500/10"
              />
              <DecisionStat
                label="Waitlisted"
                count={waitlistedCount}
                color="text-amber-400"
                bgColor="bg-amber-500/10"
              />
              <DecisionStat
                label="Deferred"
                count={deferredCount}
                color="text-blue-400"
                bgColor="bg-blue-500/10"
              />
            </div>

            <div className="mt-4">
              <div className="flex h-2.5 overflow-hidden rounded-full bg-slate-800">
                {acceptedCount > 0 && (
                  <div
                    className="bg-emerald-500 transition-all"
                    style={{
                      width: `${(acceptedCount / totalSubmissions) * 100}%`,
                    }}
                  />
                )}
                {deferredCount > 0 && (
                  <div
                    className="bg-blue-500 transition-all"
                    style={{
                      width: `${(deferredCount / totalSubmissions) * 100}%`,
                    }}
                  />
                )}
                {waitlistedCount > 0 && (
                  <div
                    className="bg-amber-500 transition-all"
                    style={{
                      width: `${(waitlistedCount / totalSubmissions) * 100}%`,
                    }}
                  />
                )}
                {rejectedCount > 0 && (
                  <div
                    className="bg-red-500 transition-all"
                    style={{
                      width: `${(rejectedCount / totalSubmissions) * 100}%`,
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Recent Submissions */}
        <div className="mt-12">
          <h2 className="text-xl font-bold text-white">
            Recent Submissions ({totalSubmissions})
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {totalSubmissions > 0
              ? `Latest community-reported outcomes for MIT`
              : `No submissions yet for MIT`}
          </p>

          {totalSubmissions === 0 ? (
            <div className="mt-8 rounded-2xl border border-white/5 bg-slate-900/50 p-16 text-center">
              <h3 className="text-lg font-semibold text-white">
                No submissions yet
              </h3>
              <p className="mx-auto mt-3 max-w-md text-sm text-slate-400">
                Be the first to submit your MIT admissions result.
              </p>
              <Link
                href="/login"
                className="mt-8 inline-block rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-600/25"
              >
                Sign In to Submit
              </Link>
            </div>
          ) : (
            <>
              <div className="mt-6 space-y-4">
                {displaySubmissions.map((submission) => (
                  <SubmissionCard
                    key={submission.id}
                    id={submission.id}
                    schoolName="MIT"
                    schoolState={mitSchool.state}
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
                    showFlagButton
                  />
                ))}
              </div>

              {/* Link to full school page for more */}
              <div className="mt-6 text-center">
                <Link
                  href={`/schools/${mitSchool.slug ?? mitSchool.id}`}
                  className="inline-flex items-center gap-1 text-sm font-medium text-violet-400 transition-colors hover:text-violet-300"
                >
                  View all {totalSubmissions} submissions &rarr;
                </Link>
              </div>
            </>
          )}
        </div>

        {/* Cross-links */}
        <section className="mt-10 border-t border-white/5 pt-8">
          <h2 className="text-lg font-semibold text-white">Explore More</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href={`/schools/${mitSchool.slug ?? mitSchool.id}`}
              className="rounded-lg border border-white/5 px-4 py-2.5 text-sm text-slate-400 transition-colors hover:border-violet-500/30 hover:text-white"
            >
              Full MIT School Page
            </Link>
            <Link
              href="/colleges/state/massachusetts"
              className="rounded-lg border border-white/5 px-4 py-2.5 text-sm text-slate-400 transition-colors hover:border-violet-500/30 hover:text-white"
            >
              All Massachusetts Colleges
            </Link>
            <Link
              href="/uc-schools"
              className="rounded-lg border border-white/5 px-4 py-2.5 text-sm text-slate-400 transition-colors hover:border-violet-500/30 hover:text-white"
            >
              UC System Hub
            </Link>
            <Link
              href="/chances"
              className="rounded-lg border border-white/5 px-4 py-2.5 text-sm text-slate-400 transition-colors hover:border-violet-500/30 hover:text-white"
            >
              Chances Calculator
            </Link>
            <Link
              href="/colleges"
              className="rounded-lg border border-white/5 px-4 py-2.5 text-sm text-slate-400 transition-colors hover:border-violet-500/30 hover:text-white"
            >
              Browse All Colleges
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

function DecisionStat({
  label,
  count,
  color,
  bgColor,
}: {
  label: string;
  count: number;
  color: string;
  bgColor: string;
}) {
  return (
    <div className={`rounded-xl ${bgColor} p-4 text-center`}>
      <p className={`text-2xl font-bold ${color}`}>{count}</p>
      <p className="mt-1 text-xs text-slate-400">{label}</p>
    </div>
  );
}
