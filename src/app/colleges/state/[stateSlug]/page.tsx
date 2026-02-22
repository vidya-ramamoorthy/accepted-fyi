import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { US_STATES, STATE_BY_SLUG } from "@/lib/constants/us-states";
import { getSchoolsByState, getStateAggregateStats } from "@/lib/db/queries/schools";
import FilterableSchoolGrid from "@/components/schools/FilterableSchoolGrid";

export const revalidate = 3600;

interface StatePageProps {
  params: Promise<{ stateSlug: string }>;
}

export function generateStaticParams() {
  return US_STATES.map((state) => ({ stateSlug: state.slug }));
}

export async function generateMetadata({ params }: StatePageProps): Promise<Metadata> {
  const { stateSlug } = await params;
  const state = STATE_BY_SLUG.get(stateSlug);
  if (!state) return { title: "State Not Found | accepted.fyi" };

  const title = `Colleges in ${state.name} - Acceptance Rates & SAT Scores | accepted.fyi`;
  const description = `Browse all colleges and universities in ${state.name}. See acceptance rates, SAT/ACT score ranges, and admissions data for ${state.abbreviation} schools.`;

  return {
    title,
    description,
    openGraph: { title, description, type: "website", siteName: "accepted.fyi" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function StatePage({ params }: StatePageProps) {
  const { stateSlug } = await params;
  const state = STATE_BY_SLUG.get(stateSlug);
  if (!state) notFound();

  const [stateSchools, aggregateStats] = await Promise.all([
    getSchoolsByState(state.abbreviation),
    getStateAggregateStats(state.abbreviation),
  ]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Colleges in ${state.name}`,
    numberOfItems: stateSchools.length,
    itemListElement: stateSchools.slice(0, 50).map((school, index) => ({
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
            accepted<span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">.fyi</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/colleges" className="text-sm text-slate-400 transition-colors hover:text-white">
              Browse Colleges
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
          href="/colleges"
          className="inline-flex items-center text-sm text-violet-400 transition-colors hover:text-violet-300"
        >
          &larr; Browse Colleges
        </Link>

        <h1 className="mt-6 text-3xl font-bold text-white sm:text-4xl">
          Colleges in {state.name}
        </h1>
        <p className="mt-2 text-slate-400">
          {stateSchools.length} colleges and universities in {state.name}
        </p>

        {/* Aggregate Stats */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-white/5 bg-slate-900/50 p-5">
            <p className="text-xs text-slate-500">Total Schools</p>
            <p className="mt-1 text-2xl font-bold text-white">{aggregateStats.totalSchools}</p>
          </div>
          {aggregateStats.avgAcceptanceRate && (
            <div className="rounded-2xl border border-white/5 bg-slate-900/50 p-5">
              <p className="text-xs text-slate-500">Avg Acceptance Rate</p>
              <p className="mt-1 text-2xl font-bold text-emerald-400">{aggregateStats.avgAcceptanceRate}%</p>
            </div>
          )}
          {aggregateStats.avgSat && (
            <div className="rounded-2xl border border-white/5 bg-slate-900/50 p-5">
              <p className="text-xs text-slate-500">Avg SAT Score</p>
              <p className="mt-1 text-2xl font-bold text-white">{aggregateStats.avgSat}</p>
            </div>
          )}
          <div className="rounded-2xl border border-white/5 bg-slate-900/50 p-5">
            <p className="text-xs text-slate-500">Public / Private</p>
            <p className="mt-1 text-2xl font-bold text-white">
              {aggregateStats.publicCount} / {aggregateStats.privateCount}
            </p>
          </div>
        </div>

        {/* School Grid with Cross-Filters */}
        <FilterableSchoolGrid schools={stateSchools} hideFilter="state" />

        {/* Cross-links to other states */}
        <section className="mt-16 border-t border-white/5 pt-8">
          <h2 className="text-lg font-semibold text-white">Other States</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {US_STATES.filter((s) => s.slug !== stateSlug).map((otherState) => (
              <Link
                key={otherState.abbreviation}
                href={`/colleges/state/${otherState.slug}`}
                className="rounded-md border border-white/5 px-3 py-1.5 text-xs text-slate-400 transition-colors hover:border-violet-500/30 hover:text-white"
              >
                {otherState.name}
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
