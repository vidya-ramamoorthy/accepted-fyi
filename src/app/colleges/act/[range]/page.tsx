import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ACT_RANGES, ACT_RANGE_BY_SLUG } from "@/lib/constants/score-ranges";
import { getSchoolsByActRange } from "@/lib/db/queries/schools";
import FilterableSchoolGrid from "@/components/schools/FilterableSchoolGrid";

export const revalidate = 3600;

interface ActRangePageProps {
  params: Promise<{ range: string }>;
}

export function generateStaticParams() {
  return ACT_RANGES.map((range) => ({ range: range.slug }));
}

export async function generateMetadata({ params }: ActRangePageProps): Promise<Metadata> {
  const { range: rangeSlug } = await params;
  const range = ACT_RANGE_BY_SLUG.get(rangeSlug);
  if (!range) return { title: "Not Found | accepted.fyi" };

  const title = `Colleges for ${range.label} ACT Score | accepted.fyi`;
  const description = `Find colleges where a ${range.label} ACT score is competitive. See acceptance rates and admissions data for matching schools.`;

  return {
    title,
    description,
    openGraph: { title, description, type: "website", siteName: "accepted.fyi" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function ActRangePage({ params }: ActRangePageProps) {
  const { range: rangeSlug } = await params;
  const range = ACT_RANGE_BY_SLUG.get(rangeSlug);
  if (!range) notFound();

  const matchingSchools = await getSchoolsByActRange(range.min, range.max);

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
          Colleges for {range.label} ACT
        </h1>
        <p className="mt-2 text-slate-400">
          {matchingSchools.length} schools where a {range.label} ACT score is competitive
        </p>

        <Suspense fallback={<div className="mt-6 text-sm text-slate-500">Loading filters...</div>}>
          <FilterableSchoolGrid schools={matchingSchools} hideFilter="act" />
        </Suspense>

        {/* Cross-links */}
        <section className="mt-16 border-t border-white/5 pt-8">
          <h2 className="text-lg font-semibold text-white">Other ACT Score Ranges</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {ACT_RANGES.filter((r) => r.slug !== rangeSlug).map((otherRange) => (
              <Link
                key={otherRange.slug}
                href={`/colleges/act/${otherRange.slug}`}
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
