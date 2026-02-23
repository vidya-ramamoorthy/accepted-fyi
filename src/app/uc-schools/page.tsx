import Link from "next/link";
import type { Metadata } from "next";
import { getSchoolsByNamePattern } from "@/lib/db/queries/schools";
import {
  getSubmissionStatsForSchools,
  getPerSchoolSubmissionStats,
} from "@/lib/db/queries/submissions";
import { DECISION_DATES_2025_2026 } from "@/lib/constants/decision-dates";
import SchoolCard from "@/components/schools/SchoolCard";
import NavbarAuthSection from "@/components/NavbarAuthSection";
import StatCard from "@/components/ui/StatCard";

export const revalidate = 3600;

const UC_NAME_PATTERN = "University of California%";
const UC_CAMPUS_NAMES = [
  "University of California-Berkeley",
  "University of California-Los Angeles",
  "University of California-San Diego",
  "University of California-Davis",
  "University of California-Irvine",
  "University of California-Santa Barbara",
  "University of California-Santa Cruz",
  "University of California-Riverside",
  "University of California-Merced",
];

export const metadata: Metadata = {
  title: "UC Schools Admissions Data — Compare All 9 Campuses | accepted.fyi",
  description:
    "Compare acceptance rates, SAT scores, and real admissions outcomes across all 9 University of California campuses. Community-reported data from thousands of applicants.",
  openGraph: {
    title: "UC Schools Admissions Data — Compare All 9 Campuses | accepted.fyi",
    description:
      "Compare acceptance rates, SAT scores, and real admissions outcomes across all 9 University of California campuses.",
    type: "website",
    siteName: "accepted.fyi",
  },
  twitter: {
    card: "summary_large_image",
    title: "UC Schools Admissions Data — Compare All 9 Campuses | accepted.fyi",
    description:
      "Compare acceptance rates, SAT scores, and real admissions outcomes across all 9 UC campuses.",
  },
};

export default async function UCSchoolsPage() {
  const ucSchools = await getSchoolsByNamePattern(UC_NAME_PATTERN, "uc-system");

  const schoolIds = ucSchools.map((school) => school.id);

  const [aggregateStats, perSchoolStats] = await Promise.all([
    getSubmissionStatsForSchools(schoolIds, "uc-system"),
    getPerSchoolSubmissionStats(schoolIds, "uc-system"),
  ]);

  const perSchoolStatsMap = new Map(
    perSchoolStats.map((stat) => [stat.schoolId, stat])
  );

  // Compute system-wide institutional averages
  const schoolsWithAcceptanceRate = ucSchools.filter(
    (school) => school.acceptanceRate !== null
  );
  const avgInstitutionalAcceptanceRate =
    schoolsWithAcceptanceRate.length > 0
      ? (
          schoolsWithAcceptanceRate.reduce(
            (sum, school) => sum + parseFloat(school.acceptanceRate!),
            0
          ) / schoolsWithAcceptanceRate.length
        ).toFixed(1)
      : null;

  const schoolsWithSat = ucSchools.filter(
    (school) => school.satAverage !== null
  );
  const avgInstitutionalSat =
    schoolsWithSat.length > 0
      ? Math.round(
          schoolsWithSat.reduce(
            (sum, school) => sum + school.satAverage!,
            0
          ) / schoolsWithSat.length
        )
      : null;

  const totalEnrollment = ucSchools.reduce(
    (sum, school) => sum + (school.undergradEnrollment ?? 0),
    0
  );

  // Get UC decision dates, sorted chronologically
  const ucDecisionDates = DECISION_DATES_2025_2026.filter((entry) =>
    UC_CAMPUS_NAMES.includes(entry.schoolName)
  ).sort(
    (entryA, entryB) =>
      new Date(entryA.expectedDate).getTime() -
      new Date(entryB.expectedDate).getTime()
  );

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "University of California System — All 9 Campuses",
    numberOfItems: ucSchools.length,
    itemListElement: ucSchools.map((school, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "EducationalOrganization",
        name: school.name,
        address: {
          "@type": "PostalAddress",
          addressLocality: school.city,
          addressRegion: school.state,
          addressCountry: "US",
        },
      },
    })),
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
        <h1 className="mt-6 text-3xl font-bold text-white sm:text-4xl">
          University of California System
        </h1>
        <p className="mt-2 max-w-2xl text-slate-400">
          Compare all 9 UC campuses side-by-side. Real admissions data from
          thousands of applicants.
        </p>

        {/* System-wide Aggregate Stats */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Community Submissions"
            value={aggregateStats.totalCount.toString()}
          />
          {avgInstitutionalAcceptanceRate && (
            <StatCard
              label="Avg Acceptance Rate"
              value={`${avgInstitutionalAcceptanceRate}%`}
              valueColor="text-emerald-400"
            />
          )}
          {avgInstitutionalSat && (
            <StatCard label="Avg SAT Score" value={avgInstitutionalSat.toString()} />
          )}
          {totalEnrollment > 0 && (
            <StatCard
              label="Total Enrollment"
              value={totalEnrollment.toLocaleString()}
            />
          )}
        </div>

        {/* Decision Timeline */}
        {ucDecisionDates.length > 0 && (
          <section className="mt-10">
            <h2 className="text-xl font-bold text-white">
              When Do UC Decisions Come Out?
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Expected Regular Decision release dates for 2025-2026
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {ucDecisionDates.map((entry) => {
                const releaseDate = new Date(entry.expectedDate);
                const formattedDate = releaseDate.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });
                const campusShortName = entry.schoolName.replace(
                  "University of California-",
                  "UC "
                );
                const now = new Date();
                const isPast = releaseDate < now;
                const daysRemaining = Math.ceil(
                  (releaseDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
                );

                return (
                  <div
                    key={`${entry.schoolName}-${entry.round}`}
                    className={`rounded-xl border p-4 ${
                      isPast
                        ? "border-white/5 bg-slate-900/30"
                        : "border-violet-500/20 bg-violet-500/5"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-white">
                        {campusShortName}
                      </span>
                      {!isPast && daysRemaining > 0 && (
                        <span className="text-xs text-violet-400">
                          {daysRemaining}d away
                        </span>
                      )}
                      {isPast && (
                        <span className="text-xs text-slate-600">Released</span>
                      )}
                    </div>
                    <p
                      className={`mt-1 text-sm ${isPast ? "text-slate-500" : "text-slate-300"}`}
                    >
                      {formattedDate}
                    </p>
                    {!entry.isConfirmed && (
                      <span className="text-xs text-slate-600">estimated</span>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Campus Comparison Grid */}
        <section className="mt-10">
          <h2 className="text-xl font-bold text-white">All 9 UC Campuses</h2>
          <p className="mt-1 text-sm text-slate-500">
            {ucSchools.length} campuses with institutional data from College
            Scorecard
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ucSchools.map((school) => {
              const schoolStats = perSchoolStatsMap.get(school.id);
              return (
                <div key={school.id} className="relative">
                  <SchoolCard {...school} />
                  {schoolStats && schoolStats.totalCount > 0 && (
                    <div className="absolute right-4 top-4 rounded-full bg-violet-500/20 px-2.5 py-0.5 text-xs font-medium text-violet-300">
                      {schoolStats.totalCount} submissions
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* UC-specific context */}
        <section className="mt-10 rounded-2xl border border-white/5 bg-slate-900/50 p-6">
          <h2 className="font-semibold text-white">
            Why UC Admissions Are Different
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="flex gap-3">
              <span className="mt-0.5 shrink-0 text-violet-400">&#8226;</span>
              <div>
                <p className="text-sm font-medium text-slate-300">
                  No Early Decision or Early Action
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  All UC applications are Regular Decision only
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="mt-0.5 shrink-0 text-violet-400">&#8226;</span>
              <div>
                <p className="text-sm font-medium text-slate-300">
                  Decisions vary by major
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Acceptance rates can differ significantly by department
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="mt-0.5 shrink-0 text-violet-400">&#8226;</span>
              <div>
                <p className="text-sm font-medium text-slate-300">
                  Separate UC application
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  UCs use their own application, not the Common App
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="mt-0.5 shrink-0 text-violet-400">&#8226;</span>
              <div>
                <p className="text-sm font-medium text-slate-300">
                  Test-Free (permanent policy)
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  SAT/ACT scores are not required or considered in UC admissions
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Cross-links */}
        <section className="mt-10 border-t border-white/5 pt-8">
          <h2 className="text-lg font-semibold text-white">Explore More</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/colleges/state/california"
              className="rounded-lg border border-white/5 px-4 py-2.5 text-sm text-slate-400 transition-colors hover:border-violet-500/30 hover:text-white"
            >
              All California Colleges
            </Link>
            <Link
              href="/mit"
              className="rounded-lg border border-white/5 px-4 py-2.5 text-sm text-slate-400 transition-colors hover:border-violet-500/30 hover:text-white"
            >
              MIT Admissions Data
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

