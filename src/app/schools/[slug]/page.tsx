import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getSchoolById, getSchoolBySlug } from "@/lib/db/queries/schools";
import { getSubmissionsForSchool } from "@/lib/db/queries/submissions";
import { getTimelinesForSchoolAndCycle } from "@/lib/db/queries/decision-timelines";
import { DECISION_DATES_2025_2026 } from "@/lib/constants/decision-dates";
import DecisionTimeline from "@/components/DecisionTimeline";
import SubmissionCard from "@/components/submissions/SubmissionCard";

export const dynamic = "force-dynamic";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface SchoolDetailPageProps {
  params: Promise<{ slug: string }>;
}

async function resolveSchool(slugOrId: string) {
  if (UUID_REGEX.test(slugOrId)) {
    const school = await getSchoolById(slugOrId);
    if (school?.slug) {
      redirect(`/schools/${school.slug}`);
    }
    return school;
  }
  return getSchoolBySlug(slugOrId);
}

export async function generateMetadata({ params }: SchoolDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const school = await resolveSchool(slug);

  if (!school) {
    return { title: "School Not Found | accepted.fyi" };
  }

  const title = `${school.name} Admissions Data | accepted.fyi`;
  const description = `See real admissions data for ${school.name} in ${school.city}, ${school.state}. ${
    school.acceptanceRate ? `Official acceptance rate: ${school.acceptanceRate}%. ` : ""
  }Browse GPA, SAT, ACT scores from real applicants.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      siteName: "accepted.fyi",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function SchoolDetailPage({ params }: SchoolDetailPageProps) {
  const { slug } = await params;
  const school = await resolveSchool(slug);

  if (!school) {
    notFound();
  }

  const submissions = await getSubmissionsForSchool(school.id);

  // Fetch decision timeline: try DB first, fall back to static constants
  const currentCycle = "2025-2026";
  let timelineEntries: {
    applicationRound: string;
    expectedDate: Date | null;
    actualDate: Date | null;
    isConfirmed: boolean;
    notes: string | null;
  }[] = [];

  try {
    const dbTimelines = await getTimelinesForSchoolAndCycle(school.id, currentCycle);
    if (dbTimelines.length > 0) {
      timelineEntries = dbTimelines.map((t) => ({
        applicationRound: t.applicationRound,
        expectedDate: t.expectedDate ? new Date(t.expectedDate) : null,
        actualDate: t.actualDate ? new Date(t.actualDate) : null,
        isConfirmed: t.isConfirmed,
        notes: t.notes,
      }));
    }
  } catch {
    // DB table may not exist yet — fall back silently
  }

  // Fall back to static constants if no DB data
  if (timelineEntries.length === 0) {
    const staticEntries = DECISION_DATES_2025_2026.filter(
      (entry) => entry.schoolName === school.name
    );
    timelineEntries = staticEntries.map((entry) => ({
      applicationRound: entry.round,
      expectedDate: new Date(entry.expectedDate),
      actualDate: null,
      isConfirmed: entry.isConfirmed,
      notes: entry.notes ?? null,
    }));
  }

  const acceptedCount = submissions.filter((s) => s.decision === "accepted").length;
  const rejectedCount = submissions.filter((s) => s.decision === "rejected").length;
  const waitlistedCount = submissions.filter((s) => s.decision === "waitlisted").length;
  const deferredCount = submissions.filter((s) => s.decision === "deferred").length;

  const gpaValues = submissions
    .map((s) => s.gpaUnweighted)
    .filter((g): g is string => g !== null)
    .map(Number);
  const averageGpa = gpaValues.length > 0
    ? (gpaValues.reduce((sum, g) => sum + g, 0) / gpaValues.length).toFixed(2)
    : null;

  const satValues = submissions
    .map((s) => s.satScore)
    .filter((s): s is number => s !== null);
  const averageSat = satValues.length > 0
    ? Math.round(satValues.reduce((sum, s) => sum + s, 0) / satValues.length)
    : null;

  const actValues = submissions
    .map((s) => s.actScore)
    .filter((a): a is number => a !== null);
  const averageAct = actValues.length > 0
    ? Math.round(actValues.reduce((sum, a) => sum + a, 0) / actValues.length)
    : null;

  const crowdsourcedAcceptanceRate = submissions.length > 0
    ? Math.round((acceptedCount / submissions.length) * 100)
    : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: school.name,
    address: {
      "@type": "PostalAddress",
      addressLocality: school.city,
      addressRegion: school.state,
      addressCountry: "US",
    },
    ...(school.website && { url: `https://${school.website}` }),
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
            accepted<span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">.fyi</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/schools"
              className="text-sm text-slate-400 transition-colors hover:text-white"
            >
              All Schools
            </Link>
            <Link
              href="/login"
              className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-slate-900 transition-all hover:bg-slate-100"
            >
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-6 pb-16 pt-28">
        <Link
          href="/schools"
          className="inline-flex items-center text-sm text-violet-400 transition-colors hover:text-violet-300"
        >
          &larr; Back to Schools
        </Link>

        <div className="mt-6">
          <h1 className="text-3xl font-bold text-white sm:text-4xl">{school.name}</h1>
          <p className="mt-2 text-slate-400">
            {school.city}, {school.state}
            {school.acceptanceRate && (
              <span className="text-slate-500"> &middot; Official acceptance rate: {school.acceptanceRate}%</span>
            )}
          </p>
        </div>

        {/* Official Institutional Data (College Scorecard) */}
        {(school.acceptanceRate || school.satAverage || school.actMedian || school.undergradEnrollment) && (
          <div className="mt-8 rounded-2xl border border-white/5 bg-slate-900/50 p-6">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="font-semibold text-white">Official Data</h2>
              <span className="text-xs text-slate-600">Source: College Scorecard, US Dept. of Education</span>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {school.acceptanceRate && (
                <div>
                  <p className="text-xs text-slate-500">Acceptance Rate</p>
                  <p className="text-lg font-bold text-emerald-400">{school.acceptanceRate}%</p>
                </div>
              )}
              {school.satAverage && (
                <div>
                  <p className="text-xs text-slate-500">SAT Average</p>
                  <p className="text-lg font-bold text-white">{school.satAverage}</p>
                </div>
              )}
              {(school.sat25thPercentile && school.sat75thPercentile) && (
                <div>
                  <p className="text-xs text-slate-500">SAT Range (25th-75th)</p>
                  <p className="text-lg font-bold text-white">{school.sat25thPercentile}-{school.sat75thPercentile}</p>
                </div>
              )}
              {school.actMedian && (
                <div>
                  <p className="text-xs text-slate-500">ACT Median</p>
                  <p className="text-lg font-bold text-white">{school.actMedian}</p>
                </div>
              )}
              {(school.act25thPercentile && school.act75thPercentile) && (
                <div>
                  <p className="text-xs text-slate-500">ACT Range (25th-75th)</p>
                  <p className="text-lg font-bold text-white">{school.act25thPercentile}-{school.act75thPercentile}</p>
                </div>
              )}
              {school.undergradEnrollment && (
                <div>
                  <p className="text-xs text-slate-500">Undergrad Enrollment</p>
                  <p className="text-lg font-bold text-white">{school.undergradEnrollment.toLocaleString()}</p>
                </div>
              )}
              {school.website && (
                <div>
                  <p className="text-xs text-slate-500">Website</p>
                  <a
                    href={`https://${school.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-violet-400 hover:text-violet-300"
                  >
                    {school.website}
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Decision Timeline */}
        {timelineEntries.length > 0 && (
          <div className="mt-6">
            <DecisionTimeline schoolName={school.name} entries={timelineEntries} />
          </div>
        )}

        {/* CDS Admissions Factors */}
        {school.factorGpa && (
          <CdsAdmissionsFactors school={school} />
        )}

        {/* CDS GPA Distribution */}
        {school.gpaPercent400 && (
          <CdsGpaDistribution school={school} />
        )}

        {/* CDS Applicant Pools */}
        {(school.eaApplicants || school.edApplicants || school.waitlistOffered) && (
          <CdsApplicantPools school={school} />
        )}

        {/* Community Data — Aggregate Stats */}
        <div className="mt-6">
          <h2 className="font-semibold text-white">Community Data</h2>
          <p className="mt-1 text-xs text-slate-500">From {submissions.length} crowdsourced submission{submissions.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Submissions" value={submissions.length.toString()} />
          <StatCard
            label="Crowdsourced Accept Rate"
            value={crowdsourcedAcceptanceRate !== null ? `${crowdsourcedAcceptanceRate}%` : "\u2014"}
            valueColor="text-emerald-400"
          />
          <StatCard label="Avg GPA (UW)" value={averageGpa ?? "\u2014"} />
          <StatCard label="Avg SAT" value={averageSat?.toString() ?? "\u2014"} />
        </div>

        {/* Decision Breakdown */}
        {submissions.length > 0 && (
          <div className="mt-6 rounded-2xl border border-white/5 bg-slate-900/50 p-6">
            <h2 className="font-semibold text-white">Decision Breakdown</h2>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <DecisionStat label="Accepted" count={acceptedCount} color="text-emerald-400" bgColor="bg-emerald-500/10" />
              <DecisionStat label="Rejected" count={rejectedCount} color="text-red-400" bgColor="bg-red-500/10" />
              <DecisionStat label="Waitlisted" count={waitlistedCount} color="text-amber-400" bgColor="bg-amber-500/10" />
              <DecisionStat label="Deferred" count={deferredCount} color="text-blue-400" bgColor="bg-blue-500/10" />
            </div>

            <div className="mt-4">
              <div className="flex h-2.5 overflow-hidden rounded-full bg-slate-800">
                {acceptedCount > 0 && (
                  <div className="bg-emerald-500 transition-all" style={{ width: `${(acceptedCount / submissions.length) * 100}%` }} />
                )}
                {deferredCount > 0 && (
                  <div className="bg-blue-500 transition-all" style={{ width: `${(deferredCount / submissions.length) * 100}%` }} />
                )}
                {waitlistedCount > 0 && (
                  <div className="bg-amber-500 transition-all" style={{ width: `${(waitlistedCount / submissions.length) * 100}%` }} />
                )}
                {rejectedCount > 0 && (
                  <div className="bg-red-500 transition-all" style={{ width: `${(rejectedCount / submissions.length) * 100}%` }} />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Additional Stats */}
        {(averageAct !== null || satValues.length > 0) && (
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {averageAct !== null && <StatCard label="Avg ACT" value={averageAct.toString()} />}
            {satValues.length > 0 && <StatCard label="SAT Range" value={`${Math.min(...satValues)}-${Math.max(...satValues)}`} />}
            {gpaValues.length > 0 && <StatCard label="GPA Range" value={`${Math.min(...gpaValues).toFixed(2)}-${Math.max(...gpaValues).toFixed(2)}`} />}
          </div>
        )}

        {/* Individual Submissions */}
        <div className="mt-12">
          <h2 className="text-xl font-bold text-white">Individual Submissions ({submissions.length})</h2>
          <p className="mt-1 text-sm text-slate-500">All self-reported outcomes for {school.name}</p>

          {submissions.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-white/5 bg-slate-900/50 p-16 text-center">
              <h3 className="text-lg font-semibold text-white">No submissions yet</h3>
              <p className="mx-auto mt-3 max-w-md text-sm text-slate-400">
                Be the first to submit your admissions result for {school.name}.
              </p>
              <Link
                href="/login"
                className="mt-8 inline-block rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-600/25"
              >
                Sign In to Submit
              </Link>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {submissions.map((submission) => (
                <SubmissionCard
                  key={submission.id}
                  schoolName={school.name}
                  schoolState={school.state}
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
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value, valueColor = "text-white" }: { label: string; value: string; valueColor?: string }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-slate-900/50 p-5">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${valueColor}`}>{value}</p>
    </div>
  );
}

function DecisionStat({ label, count, color, bgColor }: { label: string; count: number; color: string; bgColor: string }) {
  return (
    <div className={`rounded-xl ${bgColor} p-4 text-center`}>
      <p className={`text-2xl font-bold ${color}`}>{count}</p>
      <p className="mt-1 text-xs text-slate-400">{label}</p>
    </div>
  );
}

// ─── CDS Data Components ────────────────────────────────────────────────────

const FACTOR_RATING_STYLES: Record<string, { label: string; color: string; bg: string }> = {
  very_important: { label: "Very Important", color: "text-emerald-400", bg: "bg-emerald-500/10" },
  important: { label: "Important", color: "text-blue-400", bg: "bg-blue-500/10" },
  considered: { label: "Considered", color: "text-amber-400", bg: "bg-amber-500/10" },
  not_considered: { label: "Not Considered", color: "text-slate-500", bg: "bg-slate-500/10" },
};

const ADMISSIONS_FACTORS = [
  { key: "factorGpa", label: "Academic GPA" },
  { key: "factorClassRank", label: "Class Rank" },
  { key: "factorTestScores", label: "Test Scores" },
  { key: "factorEssay", label: "Application Essay" },
  { key: "factorRecommendations", label: "Recommendations" },
  { key: "factorExtracurriculars", label: "Extracurriculars" },
  { key: "factorTalentAbility", label: "Talent / Ability" },
  { key: "factorCharacter", label: "Character / Personal Qualities" },
  { key: "factorFirstGen", label: "First Generation" },
  { key: "factorAlumniRelation", label: "Alumni Relation" },
  { key: "factorGeographic", label: "Geographic Residence" },
  { key: "factorStateResidency", label: "State Residency" },
  { key: "factorVolunteer", label: "Volunteer Work" },
  { key: "factorWorkExperience", label: "Work Experience" },
  { key: "factorDemonstratedInterest", label: "Demonstrated Interest" },
] as const;

function CdsAdmissionsFactors({ school }: { school: Record<string, unknown> }) {
  const factors = ADMISSIONS_FACTORS
    .map(({ key, label }) => ({ label, rating: school[key] as string | null }))
    .filter(({ rating }) => rating !== null);

  if (factors.length === 0) return null;

  return (
    <div className="mt-6 rounded-2xl border border-white/5 bg-slate-900/50 p-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-semibold text-white">What Matters in Admissions</h2>
        <span className="text-xs text-slate-600">
          Source: Common Data Set {school.cdsDataYear as string ?? ""}
        </span>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {factors.map(({ label, rating }) => {
          const style = FACTOR_RATING_STYLES[rating!] ?? FACTOR_RATING_STYLES.not_considered;
          return (
            <div key={label} className="flex items-center justify-between rounded-lg bg-slate-800/50 px-4 py-2.5">
              <span className="text-sm text-slate-300">{label}</span>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${style.bg} ${style.color}`}>
                {style.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CdsGpaDistribution({ school }: { school: Record<string, unknown> }) {
  const gpaRanges = [
    { label: "4.0", value: school.gpaPercent400 },
    { label: "3.75 – 3.99", value: school.gpaPercent375to399 },
    { label: "3.50 – 3.74", value: school.gpaPercent350to374 },
    { label: "3.25 – 3.49", value: school.gpaPercent325to349 },
    { label: "3.00 – 3.24", value: school.gpaPercent300to324 },
    { label: "Below 3.0", value: school.gpaPercentBelow300 },
  ]
    .map(({ label, value }) => ({ label, percent: value ? parseFloat(value as string) : null }))
    .filter(({ percent }) => percent !== null) as { label: string; percent: number }[];

  if (gpaRanges.length === 0) return null;

  const maxPercent = Math.max(...gpaRanges.map((r) => r.percent));

  return (
    <div className="mt-6 rounded-2xl border border-white/5 bg-slate-900/50 p-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-semibold text-white">GPA Distribution of Admitted Students</h2>
        <span className="text-xs text-slate-600">
          Source: Common Data Set {school.cdsDataYear as string ?? ""}
        </span>
      </div>
      <div className="mt-4 space-y-3">
        {gpaRanges.map(({ label, percent }) => (
          <div key={label} className="flex items-center gap-4">
            <span className="w-24 shrink-0 text-right text-sm text-slate-400">{label}</span>
            <div className="flex flex-1 items-center gap-3">
              <div className="h-6 flex-1 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-600 to-indigo-500 transition-all"
                  style={{ width: `${(percent / maxPercent) * 100}%` }}
                />
              </div>
              <span className="w-14 shrink-0 text-right text-sm font-semibold text-white">
                {percent.toFixed(1)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CdsApplicantPools({ school }: { school: Record<string, unknown> }) {
  const eaApplicants = school.eaApplicants as number | null;
  const eaAdmitted = school.eaAdmitted as number | null;
  const edApplicants = school.edApplicants as number | null;
  const edAdmitted = school.edAdmitted as number | null;
  const waitlistOffered = school.waitlistOffered as number | null;
  const waitlistAdmitted = school.waitlistAdmitted as number | null;

  const pools = [
    eaApplicants !== null ? {
      label: "Early Action",
      applicants: eaApplicants,
      admitted: eaAdmitted,
      rate: eaAdmitted !== null ? ((eaAdmitted / eaApplicants) * 100).toFixed(1) : null,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    } : null,
    edApplicants !== null ? {
      label: "Early Decision",
      applicants: edApplicants,
      admitted: edAdmitted,
      rate: edAdmitted !== null ? ((edAdmitted / edApplicants) * 100).toFixed(1) : null,
      color: "text-violet-400",
      bg: "bg-violet-500/10",
    } : null,
    waitlistOffered !== null ? {
      label: "Waitlist",
      applicants: waitlistOffered,
      admitted: waitlistAdmitted,
      rate: waitlistAdmitted !== null && waitlistOffered > 0
        ? ((waitlistAdmitted / waitlistOffered) * 100).toFixed(1) : null,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
    } : null,
  ].filter((pool): pool is NonNullable<typeof pool> => pool !== null);

  if (pools.length === 0) return null;

  return (
    <div className="mt-6 rounded-2xl border border-white/5 bg-slate-900/50 p-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-semibold text-white">Applicant Pools</h2>
        <span className="text-xs text-slate-600">
          Source: Common Data Set {school.cdsDataYear as string ?? ""}
        </span>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {pools.map((pool) => (
          <div key={pool.label} className={`rounded-xl ${pool.bg} p-5`}>
            <p className={`text-sm font-medium ${pool.color}`}>{pool.label}</p>
            <div className="mt-3 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-xs text-slate-500">Applied</span>
                <span className="text-sm font-semibold text-white">{pool.applicants.toLocaleString()}</span>
              </div>
              {pool.admitted !== null && (
                <div className="flex justify-between">
                  <span className="text-xs text-slate-500">Admitted</span>
                  <span className="text-sm font-semibold text-white">{pool.admitted.toLocaleString()}</span>
                </div>
              )}
              {pool.rate !== null && (
                <div className="flex justify-between border-t border-white/5 pt-1.5">
                  <span className="text-xs text-slate-500">Accept Rate</span>
                  <span className={`text-sm font-bold ${pool.color}`}>{pool.rate}%</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
