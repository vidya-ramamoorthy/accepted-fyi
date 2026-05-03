import Link from "next/link";
import type { Metadata } from "next";
import { getSchoolsByExactNames } from "@/lib/db/queries/schools";
import {
  getSubmissionStatsForSchools,
  getPerSchoolSubmissionStats,
} from "@/lib/db/queries/submissions";
import { DECISION_DATES_2025_2026 } from "@/lib/constants/decision-dates";
import SchoolCard from "@/components/schools/SchoolCard";
import NavbarAuthSection from "@/components/NavbarAuthSection";
import StatCard from "@/components/ui/StatCard";
import CountdownBadge from "@/components/ui/CountdownBadge";

export const revalidate = 3600;

const IVY_LEAGUE_NAMES = [
  "Brown University",
  "Columbia University in the City of New York",
  "Cornell University",
  "Dartmouth College",
  "Harvard University",
  "Princeton University",
  "University of Pennsylvania",
  "Yale University",
] as const;

const IVY_SHORT_NAMES: Record<string, string> = {
  "Brown University": "Brown",
  "Columbia University in the City of New York": "Columbia",
  "Cornell University": "Cornell",
  "Dartmouth College": "Dartmouth",
  "Harvard University": "Harvard",
  "Princeton University": "Princeton",
  "University of Pennsylvania": "UPenn",
  "Yale University": "Yale",
};

export const metadata: Metadata = {
  title: "Ivy League Acceptance Rates 2026 — Compare All 8 Ivy Schools",
  description:
    "Compare 2026 acceptance rates, SAT scores, and real admissions outcomes across all 8 Ivy League schools: Harvard, Yale, Princeton, Columbia, UPenn, Brown, Dartmouth, Cornell. Free.",
  alternates: {
    canonical: "https://accepted.fyi/ivy-league",
  },
  openGraph: {
    title: "Ivy League Acceptance Rates 2026 — Compare All 8 Ivy Schools",
    description:
      "Compare acceptance rates, SAT scores, and real admissions outcomes across all 8 Ivy League schools.",
    type: "website",
    siteName: "accepted.fyi",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ivy League Acceptance Rates 2026",
    description:
      "Compare acceptance rates, SAT scores, and real admissions outcomes across all 8 Ivy League schools.",
  },
};

export default async function IvyLeaguePage() {
  let ivySchools: Awaited<ReturnType<typeof getSchoolsByExactNames>> = [];
  try {
    ivySchools = await getSchoolsByExactNames(IVY_LEAGUE_NAMES, "ivy-league");
  } catch {
    // DB unavailable — render with empty data
  }

  const schoolIds = ivySchools.map((school) => school.id);

  let aggregateStats: Awaited<ReturnType<typeof getSubmissionStatsForSchools>> = {
    totalCount: 0,
    acceptedCount: 0,
    rejectedCount: 0,
    waitlistedCount: 0,
    deferredCount: 0,
    avgGpaUnweighted: null,
    avgSatScore: null,
  };
  let perSchoolStats: Awaited<ReturnType<typeof getPerSchoolSubmissionStats>> = [];

  try {
    [aggregateStats, perSchoolStats] = await Promise.all([
      getSubmissionStatsForSchools(schoolIds, "ivy-league"),
      getPerSchoolSubmissionStats(schoolIds, "ivy-league"),
    ]);
  } catch {
    // DB unavailable
  }

  const perSchoolStatsMap = new Map(
    perSchoolStats.map((stat) => [stat.schoolId, stat])
  );

  // System-wide institutional averages
  const schoolsWithAcceptanceRate = ivySchools.filter(
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

  const schoolsWithSat = ivySchools.filter(
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

  const totalEnrollment = ivySchools.reduce(
    (sum, school) => sum + (school.undergradEnrollment ?? 0),
    0
  );

  // Ivy decision dates (Ivy Day = late March)
  const ivyDecisionDates = DECISION_DATES_2025_2026.filter((entry) =>
    (IVY_LEAGUE_NAMES as readonly string[]).includes(entry.schoolName)
  ).sort(
    (entryA, entryB) =>
      new Date(entryA.expectedDate).getTime() -
      new Date(entryB.expectedDate).getTime()
  );

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Ivy League — All 8 Schools",
    numberOfItems: ivySchools.length,
    itemListElement: ivySchools.map((school, index) => ({
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

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://accepted.fyi" },
      { "@type": "ListItem", position: 2, name: "Colleges", item: "https://accepted.fyi/colleges" },
      { "@type": "ListItem", position: 3, name: "Ivy League", item: "https://accepted.fyi/ivy-league" },
    ],
  };

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Which schools are in the Ivy League?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "The Ivy League is made up of 8 schools: Brown University, Columbia University, Cornell University, Dartmouth College, Harvard University, Princeton University, University of Pennsylvania, and Yale University.",
        },
      },
      ...(avgInstitutionalAcceptanceRate
        ? [
            {
              "@type": "Question",
              name: "What is the average Ivy League acceptance rate?",
              acceptedAnswer: {
                "@type": "Answer",
                text: `The average acceptance rate across the 8 Ivy League schools is ${avgInstitutionalAcceptanceRate}%, based on the most recent reported data.`,
              },
            },
          ]
        : []),
      {
        "@type": "Question",
        name: "What is Ivy Day?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Ivy Day is the day in late March when all 8 Ivy League schools release their Regular Decision admissions decisions simultaneously. For 2025-2026, Ivy Day is expected in late March 2026.",
        },
      },
    ],
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
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

        <h1 className="mt-6 text-3xl font-bold text-white sm:text-4xl">
          Ivy League Acceptance Rates 2026
        </h1>
        <p className="mt-2 max-w-2xl text-slate-400">
          Compare all 8 Ivy League schools side-by-side. Real admissions data
          from thousands of applicants.
        </p>

        {/* System-wide aggregate stats */}
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

        {/* Ivy Day decision timeline */}
        {ivyDecisionDates.length > 0 && (
          <section className="mt-10">
            <h2 className="text-xl font-bold text-white">When Is Ivy Day 2026?</h2>
            <p className="mt-1 text-sm text-slate-500">
              Expected Regular Decision release dates for 2025-2026
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {ivyDecisionDates.map((entry) => {
                const releaseDate = new Date(entry.expectedDate);
                const formattedDate = releaseDate.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });
                const shortName =
                  IVY_SHORT_NAMES[entry.schoolName] ?? entry.schoolName;

                return (
                  <div
                    key={`${entry.schoolName}-${entry.round}`}
                    className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-white">{shortName}</span>
                      <CountdownBadge targetDate={entry.expectedDate} />
                    </div>
                    <p className="mt-1 text-sm text-slate-300">{formattedDate}</p>
                    {!entry.isConfirmed && (
                      <span className="text-xs text-slate-600">estimated</span>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* School comparison grid */}
        <section className="mt-10">
          <h2 className="text-xl font-bold text-white">All 8 Ivy League Schools</h2>
          <p className="mt-1 text-sm text-slate-500">
            {ivySchools.length} schools with institutional data from College Scorecard
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ivySchools.map((school) => {
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

        {/* Keyword-rich comparison table — same pattern as /uc-schools */}
        <section className="mt-10 border-t border-white/5 pt-8">
          <h2 className="text-xl font-bold text-white">
            Ivy League Schools Ranked by Acceptance Rate
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Most selective to least selective — click any school for full admissions data
          </p>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-white/5">
            <table className="w-full text-sm">
              <thead className="bg-slate-900/80">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                    School
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-400">
                    Acceptance Rate
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-400">
                    SAT Avg
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-400">
                    Enrollment
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {[...ivySchools]
                  .sort((schoolA, schoolB) => {
                    const rateA = schoolA.acceptanceRate
                      ? parseFloat(schoolA.acceptanceRate)
                      : Number.POSITIVE_INFINITY;
                    const rateB = schoolB.acceptanceRate
                      ? parseFloat(schoolB.acceptanceRate)
                      : Number.POSITIVE_INFINITY;
                    return rateA - rateB;
                  })
                  .map((school) => {
                    const shortName =
                      IVY_SHORT_NAMES[school.name] ?? school.name;
                    return (
                      <tr
                        key={school.id}
                        className="bg-slate-900/30 transition-colors hover:bg-slate-900/60"
                      >
                        <td className="px-4 py-3">
                          <Link
                            href={`/schools/${school.slug ?? school.id}`}
                            className="font-medium text-violet-300 hover:text-violet-200"
                          >
                            {shortName} acceptance rate
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-emerald-400">
                          {school.acceptanceRate ? `${school.acceptanceRate}%` : "—"}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-300">
                          {school.satAverage ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-300">
                          {school.undergradEnrollment?.toLocaleString() ?? "—"}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Ivy-specific context */}
        <section className="mt-10 rounded-2xl border border-white/5 bg-slate-900/50 p-6">
          <h2 className="font-semibold text-white">About the Ivy League</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="flex gap-3">
              <span className="mt-0.5 shrink-0 text-violet-400">&#8226;</span>
              <div>
                <p className="text-sm font-medium text-slate-300">
                  Ivy Day decisions release in late March
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  All 8 Ivies announce Regular Decision results on the same day
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="mt-0.5 shrink-0 text-violet-400">&#8226;</span>
              <div>
                <p className="text-sm font-medium text-slate-300">
                  Lowest acceptance rates in the country
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Most Ivies admit fewer than 7% of applicants
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="mt-0.5 shrink-0 text-violet-400">&#8226;</span>
              <div>
                <p className="text-sm font-medium text-slate-300">
                  All offer Early Action or Early Decision
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  ED/REA acceptance rates are typically 2-3x higher than RD
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="mt-0.5 shrink-0 text-violet-400">&#8226;</span>
              <div>
                <p className="text-sm font-medium text-slate-300">
                  Need-blind for U.S. applicants
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  All 8 Ivies meet 100% of demonstrated financial need
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
              href="/uc-schools"
              className="rounded-lg border border-white/5 px-4 py-2.5 text-sm text-slate-400 transition-colors hover:border-violet-500/30 hover:text-white"
            >
              UC Schools
            </Link>
            <Link
              href="/colleges/acceptance-rate/under-10"
              className="rounded-lg border border-white/5 px-4 py-2.5 text-sm text-slate-400 transition-colors hover:border-violet-500/30 hover:text-white"
            >
              Under 10% Acceptance
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

        {/* FAQ Section */}
        <section className="mt-16 border-t border-white/5 pt-8">
          <h2 className="text-xl font-bold text-white">Frequently Asked Questions</h2>
          <dl className="mt-6 space-y-6">
            <div>
              <dt className="text-base font-semibold text-white">
                Which schools are in the Ivy League?
              </dt>
              <dd className="mt-2 text-sm text-slate-400">
                The Ivy League is made up of 8 schools: Brown University, Columbia
                University, Cornell University, Dartmouth College, Harvard University,
                Princeton University, University of Pennsylvania, and Yale University.
              </dd>
            </div>
            {avgInstitutionalAcceptanceRate && (
              <div>
                <dt className="text-base font-semibold text-white">
                  What is the average Ivy League acceptance rate?
                </dt>
                <dd className="mt-2 text-sm text-slate-400">
                  The average acceptance rate across the 8 Ivy League schools is{" "}
                  {avgInstitutionalAcceptanceRate}%, based on the most recent reported
                  data.
                </dd>
              </div>
            )}
            <div>
              <dt className="text-base font-semibold text-white">What is Ivy Day?</dt>
              <dd className="mt-2 text-sm text-slate-400">
                Ivy Day is the day in late March when all 8 Ivy League schools release
                their Regular Decision admissions decisions simultaneously.
              </dd>
            </div>
          </dl>
        </section>
      </main>
    </div>
  );
}
