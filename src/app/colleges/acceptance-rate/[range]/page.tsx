import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ACCEPTANCE_RATE_RANGES, ACCEPTANCE_RATE_BY_SLUG } from "@/lib/constants/score-ranges";
import { getSchoolsByAcceptanceRate } from "@/lib/db/queries/schools";
import FilterableSchoolGrid from "@/components/schools/FilterableSchoolGrid";

interface AcceptanceRatePageProps {
  params: Promise<{ range: string }>;
}

export function generateStaticParams() {
  return ACCEPTANCE_RATE_RANGES.map((range) => ({ range: range.slug }));
}

export async function generateMetadata({ params }: AcceptanceRatePageProps): Promise<Metadata> {
  const { range: rangeSlug } = await params;
  const range = ACCEPTANCE_RATE_BY_SLUG.get(rangeSlug);
  if (!range) return { title: "Not Found | accepted.fyi" };

  const title = `Colleges with ${range.label} Acceptance Rate | accepted.fyi`;
  const description = `Browse colleges with ${range.label} acceptance rates. Compare SAT scores, ACT scores, and admissions data.`;

  return {
    title,
    description,
    openGraph: { title, description, type: "website", siteName: "accepted.fyi" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function AcceptanceRatePage({ params }: AcceptanceRatePageProps) {
  const { range: rangeSlug } = await params;
  const range = ACCEPTANCE_RATE_BY_SLUG.get(rangeSlug);
  if (!range) notFound();

  const matchingSchools = await getSchoolsByAcceptanceRate(range.min, range.max);

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
        <Link
          href="/colleges"
          className="inline-flex items-center text-sm text-violet-400 transition-colors hover:text-violet-300"
        >
          &larr; Browse Colleges
        </Link>

        <h1 className="mt-6 text-3xl font-bold text-white sm:text-4xl">
          Colleges with {range.label} Acceptance Rate
        </h1>
        <p className="mt-2 text-slate-400">
          {matchingSchools.length} schools with acceptance rates between {range.min}% and {range.max}%
        </p>

        <FilterableSchoolGrid schools={matchingSchools} hideFilter="acceptanceRate" />

        {/* Cross-links */}
        <section className="mt-16 border-t border-white/5 pt-8">
          <h2 className="text-lg font-semibold text-white">Other Acceptance Rate Ranges</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {ACCEPTANCE_RATE_RANGES.filter((r) => r.slug !== rangeSlug).map((otherRange) => (
              <Link
                key={otherRange.slug}
                href={`/colleges/acceptance-rate/${otherRange.slug}`}
                className="rounded-md border border-white/5 px-3 py-1.5 text-sm text-slate-400 transition-colors hover:border-violet-500/30 hover:text-white"
              >
                {otherRange.label}
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
