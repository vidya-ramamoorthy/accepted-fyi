import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { SAT_RANGES, SAT_RANGE_BY_SLUG } from "@/lib/constants/score-ranges";
import { getSchoolsBySatRange } from "@/lib/db/queries/schools";
import FilterableSchoolGrid from "@/components/schools/FilterableSchoolGrid";

export const revalidate = 3600;

interface SatRangePageProps {
  params: Promise<{ range: string }>;
}

export function generateStaticParams() {
  return SAT_RANGES.map((range) => ({ range: range.slug }));
}

export async function generateMetadata({ params }: SatRangePageProps): Promise<Metadata> {
  const { range: rangeSlug } = await params;
  const range = SAT_RANGE_BY_SLUG.get(rangeSlug);
  if (!range) return { title: "Not Found" };

  const matchingSchools = await getSchoolsBySatRange(range.min, range.max);
  const count = matchingSchools.length;

  const title = `${count} Colleges for a ${range.label} SAT Score (2026 Data)`;
  const description = `See ${count} colleges where a ${range.label} SAT score is competitive. Compare acceptance rates, real student outcomes, and admissions stats. Free and updated.`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://accepted.fyi/colleges/sat/${rangeSlug}`,
    },
    openGraph: { title, description, type: "website", siteName: "accepted.fyi" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function SatRangePage({ params }: SatRangePageProps) {
  const { range: rangeSlug } = await params;
  const range = SAT_RANGE_BY_SLUG.get(rangeSlug);
  if (!range) notFound();

  const matchingSchools = await getSchoolsBySatRange(range.min, range.max);

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://accepted.fyi" },
      { "@type": "ListItem", position: 2, name: "Colleges", item: "https://accepted.fyi/colleges" },
      { "@type": "ListItem", position: 3, name: `${range.label} SAT`, item: `https://accepted.fyi/colleges/sat/${rangeSlug}` },
    ],
  };

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `Is a ${range.label} SAT score good for college?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `A ${range.label} SAT score is competitive at ${matchingSchools.length} colleges in our database. Browse the full list to see acceptance rates and how real applicants performed.`,
        },
      },
      {
        "@type": "Question",
        name: `What colleges can I get into with a ${range.label} SAT?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `There are ${matchingSchools.length} colleges where a ${range.label} SAT score falls within the typical admitted student range. See the full list with acceptance rates and student outcomes.`,
        },
      },
    ],
  };

  return (
    <div className="min-h-screen bg-slate-950">
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
          Colleges for {range.label} SAT
        </h1>
        <p className="mt-2 text-slate-400">
          {matchingSchools.length} schools where a {range.label} SAT score is competitive
        </p>

        <Suspense fallback={<div className="mt-6 text-sm text-slate-500">Loading filters...</div>}>
          <FilterableSchoolGrid schools={matchingSchools} hideFilter="sat" />
        </Suspense>

        {/* FAQ Section */}
        <section className="mt-16 border-t border-white/5 pt-8">
          <h2 className="text-xl font-bold text-white">Frequently Asked Questions</h2>
          <dl className="mt-6 space-y-6">
            <div>
              <dt className="text-base font-semibold text-white">Is a {range.label} SAT score good for college?</dt>
              <dd className="mt-2 text-sm text-slate-400">
                A {range.label} SAT score is competitive at {matchingSchools.length} colleges in our database. Browse the full list above to see acceptance rates and how real applicants performed.
              </dd>
            </div>
            <div>
              <dt className="text-base font-semibold text-white">What colleges can I get into with a {range.label} SAT?</dt>
              <dd className="mt-2 text-sm text-slate-400">
                There are {matchingSchools.length} colleges where a {range.label} SAT score falls within the typical admitted student range. See the full list above with acceptance rates and student outcomes.
              </dd>
            </div>
          </dl>
        </section>

        {/* Cross-links */}
        <section className="mt-16 border-t border-white/5 pt-8">
          <h2 className="text-lg font-semibold text-white">Other SAT Score Ranges</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {SAT_RANGES.filter((r) => r.slug !== rangeSlug).map((otherRange) => (
              <Link
                key={otherRange.slug}
                href={`/colleges/sat/${otherRange.slug}`}
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
