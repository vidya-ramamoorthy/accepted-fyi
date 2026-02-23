import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { STATE_BY_SLUG } from "@/lib/constants/us-states";
import { SAT_RANGES, SAT_RANGE_BY_SLUG } from "@/lib/constants/score-ranges";
import { getSchoolsByStateAndSatRange } from "@/lib/db/queries/schools";
import { getStateSatCombinations } from "@/lib/db/queries/seo-combinations";
import FilterableSchoolGrid from "@/components/schools/FilterableSchoolGrid";

export const revalidate = 3600;

interface StateSatPageProps {
  params: Promise<{ stateSlug: string; range: string }>;
}

export async function generateStaticParams() {
  try {
    const combinations = await getStateSatCombinations();
    return combinations.map((combo) => ({
      stateSlug: combo.stateSlug,
      range: combo.rangeSlug,
    }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: StateSatPageProps): Promise<Metadata> {
  const { stateSlug, range: rangeSlug } = await params;
  const state = STATE_BY_SLUG.get(stateSlug);
  const range = SAT_RANGE_BY_SLUG.get(rangeSlug);
  if (!state || !range) return { title: "Not Found | accepted.fyi" };

  const title = `${state.name} Colleges for ${range.label} SAT | accepted.fyi`;
  const description = `Find colleges in ${state.name} where a ${range.label} SAT score is competitive. See acceptance rates and admissions data for ${state.abbreviation} schools.`;

  return {
    title,
    description,
    openGraph: { title, description, type: "website", siteName: "accepted.fyi" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function StateSatPage({ params }: StateSatPageProps) {
  const { stateSlug, range: rangeSlug } = await params;
  const state = STATE_BY_SLUG.get(stateSlug);
  const range = SAT_RANGE_BY_SLUG.get(rangeSlug);
  if (!state || !range) notFound();

  const matchingSchools = await getSchoolsByStateAndSatRange(
    state.abbreviation,
    range.min,
    range.max
  );

  return (
    <div className="min-h-screen bg-slate-950">
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
        {/* Breadcrumb */}
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
          <Link href="/colleges" className="text-violet-400 hover:text-violet-300">
            Colleges
          </Link>
          <span>/</span>
          <Link href={`/colleges/state/${stateSlug}`} className="text-violet-400 hover:text-violet-300">
            {state.name}
          </Link>
          <span>/</span>
          <span className="text-slate-400">{range.label} SAT</span>
        </div>

        <h1 className="mt-6 text-3xl font-bold text-white sm:text-4xl">
          {state.name} Colleges for {range.label} SAT
        </h1>
        <p className="mt-2 text-slate-400">
          {matchingSchools.length} colleges in {state.name} where a {range.label} SAT score is competitive
        </p>

        <Suspense fallback={<div className="mt-6 text-sm text-slate-500">Loading filters...</div>}>
          <FilterableSchoolGrid schools={matchingSchools} hideFilter={["state", "sat"]} />
        </Suspense>

        {/* Cross-links */}
        <section className="mt-16 border-t border-white/5 pt-8">
          <h2 className="text-lg font-semibold text-white">
            Other SAT Ranges in {state.name}
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {SAT_RANGES.filter((r) => r.slug !== rangeSlug).map((otherRange) => (
              <Link
                key={otherRange.slug}
                href={`/colleges/state/${stateSlug}/sat/${otherRange.slug}`}
                className="rounded-md border border-white/5 px-3 py-1.5 text-sm text-slate-400 transition-colors hover:border-violet-500/30 hover:text-white"
              >
                {otherRange.label}
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-8 border-t border-white/5 pt-8">
          <h2 className="text-lg font-semibold text-white">Related Pages</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href={`/colleges/state/${stateSlug}`}
              className="rounded-md border border-white/5 px-3 py-1.5 text-sm text-slate-400 transition-colors hover:border-violet-500/30 hover:text-white"
            >
              All {state.name} Colleges
            </Link>
            <Link
              href={`/colleges/sat/${rangeSlug}`}
              className="rounded-md border border-white/5 px-3 py-1.5 text-sm text-slate-400 transition-colors hover:border-violet-500/30 hover:text-white"
            >
              All {range.label} SAT Colleges
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
