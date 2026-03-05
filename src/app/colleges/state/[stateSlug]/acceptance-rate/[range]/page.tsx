import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { STATE_BY_SLUG } from "@/lib/constants/us-states";
import { ACCEPTANCE_RATE_RANGES, ACCEPTANCE_RATE_BY_SLUG } from "@/lib/constants/score-ranges";
import { getSchoolsByStateAndAcceptanceRate } from "@/lib/db/queries/schools";
import { getStateAcceptanceRateCombinations } from "@/lib/db/queries/seo-combinations";
import FilterableSchoolGrid from "@/components/schools/FilterableSchoolGrid";

export const revalidate = 3600;

interface StateAcceptanceRatePageProps {
  params: Promise<{ stateSlug: string; range: string }>;
}

export async function generateStaticParams() {
  try {
    const combinations = await getStateAcceptanceRateCombinations();
    return combinations.map((combo) => ({
      stateSlug: combo.stateSlug,
      range: combo.rangeSlug,
    }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: StateAcceptanceRatePageProps): Promise<Metadata> {
  const { stateSlug, range: rangeSlug } = await params;
  const state = STATE_BY_SLUG.get(stateSlug);
  const range = ACCEPTANCE_RATE_BY_SLUG.get(rangeSlug);
  if (!state || !range) return { title: "Not Found" };

  const matchingSchools = await getSchoolsByStateAndAcceptanceRate(state.abbreviation, range.min, range.max);
  const count = matchingSchools.length;

  const title = `${count} ${state.name} Colleges with ${range.label} Acceptance Rate (2026)`;
  const description = `Browse ${count} colleges in ${state.name} with ${range.label} acceptance rates. Compare SAT scores, ACT scores, and real student outcomes. Updated for 2025–2026.`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://accepted.fyi/colleges/state/${stateSlug}/acceptance-rate/${rangeSlug}`,
    },
    openGraph: { title, description, type: "website", siteName: "accepted.fyi" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function StateAcceptanceRatePage({ params }: StateAcceptanceRatePageProps) {
  const { stateSlug, range: rangeSlug } = await params;
  const state = STATE_BY_SLUG.get(stateSlug);
  const range = ACCEPTANCE_RATE_BY_SLUG.get(rangeSlug);
  if (!state || !range) notFound();

  const matchingSchools = await getSchoolsByStateAndAcceptanceRate(
    state.abbreviation,
    range.min,
    range.max
  );

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://accepted.fyi" },
      { "@type": "ListItem", position: 2, name: "Colleges", item: "https://accepted.fyi/colleges" },
      { "@type": "ListItem", position: 3, name: state.name, item: `https://accepted.fyi/colleges/state/${stateSlug}` },
      { "@type": "ListItem", position: 4, name: `${range.label} Acceptance Rate`, item: `https://accepted.fyi/colleges/state/${stateSlug}/acceptance-rate/${rangeSlug}` },
    ],
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
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
          <span className="text-slate-400">{range.label} Acceptance Rate</span>
        </div>

        <h1 className="mt-6 text-3xl font-bold text-white sm:text-4xl">
          {state.name} Colleges with {range.label} Acceptance Rate
        </h1>
        <p className="mt-2 text-slate-400">
          {matchingSchools.length} colleges in {state.name} with acceptance rates between {range.min}% and {range.max}%
        </p>

        <Suspense fallback={<div className="mt-6 text-sm text-slate-500">Loading filters...</div>}>
          <FilterableSchoolGrid schools={matchingSchools} hideFilter={["state", "acceptanceRate"]} />
        </Suspense>

        {/* Cross-links */}
        <section className="mt-16 border-t border-white/5 pt-8">
          <h2 className="text-lg font-semibold text-white">
            Other Acceptance Rates in {state.name}
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {ACCEPTANCE_RATE_RANGES.filter((r) => r.slug !== rangeSlug).map((otherRange) => (
              <Link
                key={otherRange.slug}
                href={`/colleges/state/${stateSlug}/acceptance-rate/${otherRange.slug}`}
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
              href={`/colleges/acceptance-rate/${rangeSlug}`}
              className="rounded-md border border-white/5 px-3 py-1.5 text-sm text-slate-400 transition-colors hover:border-violet-500/30 hover:text-white"
            >
              All {range.label} Acceptance Rate Colleges
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
