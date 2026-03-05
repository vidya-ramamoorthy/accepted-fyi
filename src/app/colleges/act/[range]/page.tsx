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
  if (!range) return { title: "Not Found" };

  const matchingSchools = await getSchoolsByActRange(range.min, range.max);
  const count = matchingSchools.length;

  const title = `${count} Colleges for a ${range.label} ACT Score (2026 Data)`;
  const description = `See ${count} colleges where a ${range.label} ACT score is competitive. Compare acceptance rates, real student outcomes, and admissions stats. Free and updated.`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://accepted.fyi/colleges/act/${rangeSlug}`,
    },
    openGraph: { title, description, type: "website", siteName: "accepted.fyi" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function ActRangePage({ params }: ActRangePageProps) {
  const { range: rangeSlug } = await params;
  const range = ACT_RANGE_BY_SLUG.get(rangeSlug);
  if (!range) notFound();

  const matchingSchools = await getSchoolsByActRange(range.min, range.max);

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://accepted.fyi" },
      { "@type": "ListItem", position: 2, name: "Colleges", item: "https://accepted.fyi/colleges" },
      { "@type": "ListItem", position: 3, name: `${range.label} ACT`, item: `https://accepted.fyi/colleges/act/${rangeSlug}` },
    ],
  };

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `Is a ${range.label} ACT score good for college?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `A ${range.label} ACT score is competitive at ${matchingSchools.length} colleges in our database. Browse the full list to see acceptance rates and real student outcomes.`,
        },
      },
      {
        "@type": "Question",
        name: `What colleges can I get into with a ${range.label} ACT?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `There are ${matchingSchools.length} colleges where a ${range.label} ACT score falls within the typical admitted student range. See the full list with acceptance rates and student outcomes.`,
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
          Colleges for {range.label} ACT
        </h1>
        <p className="mt-2 text-slate-400">
          {matchingSchools.length} schools where a {range.label} ACT score is competitive
        </p>

        <Suspense fallback={<div className="mt-6 text-sm text-slate-500">Loading filters...</div>}>
          <FilterableSchoolGrid schools={matchingSchools} hideFilter="act" />
        </Suspense>

        {/* FAQ Section */}
        <section className="mt-16 border-t border-white/5 pt-8">
          <h2 className="text-xl font-bold text-white">Frequently Asked Questions</h2>
          <dl className="mt-6 space-y-6">
            <div>
              <dt className="text-base font-semibold text-white">Is a {range.label} ACT score good for college?</dt>
              <dd className="mt-2 text-sm text-slate-400">
                A {range.label} ACT score is competitive at {matchingSchools.length} colleges in our database. Browse the full list above to see acceptance rates and real student outcomes.
              </dd>
            </div>
            <div>
              <dt className="text-base font-semibold text-white">What colleges can I get into with a {range.label} ACT?</dt>
              <dd className="mt-2 text-sm text-slate-400">
                There are {matchingSchools.length} colleges where a {range.label} ACT score falls within the typical admitted student range. See the full list above with acceptance rates and student outcomes.
              </dd>
            </div>
          </dl>
        </section>

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
