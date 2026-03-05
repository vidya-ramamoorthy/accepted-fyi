import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ACCEPTANCE_RATE_RANGES, ACCEPTANCE_RATE_BY_SLUG } from "@/lib/constants/score-ranges";
import { getSchoolsByAcceptanceRate } from "@/lib/db/queries/schools";
import FilterableSchoolGrid from "@/components/schools/FilterableSchoolGrid";

export const revalidate = 3600;

interface AcceptanceRatePageProps {
  params: Promise<{ range: string }>;
}

export function generateStaticParams() {
  return ACCEPTANCE_RATE_RANGES.map((range) => ({ range: range.slug }));
}

export async function generateMetadata({ params }: AcceptanceRatePageProps): Promise<Metadata> {
  const { range: rangeSlug } = await params;
  const range = ACCEPTANCE_RATE_BY_SLUG.get(rangeSlug);
  if (!range) return { title: "Not Found" };

  const matchingSchools = await getSchoolsByAcceptanceRate(range.min, range.max);
  const count = matchingSchools.length;

  const title = `${count} Colleges with ${range.label} Acceptance Rate (2026 Data)`;
  const description = `Browse ${count} colleges with ${range.label} acceptance rates. Compare SAT scores, ACT scores, and real student outcomes. Free and updated.`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://accepted.fyi/colleges/acceptance-rate/${rangeSlug}`,
    },
    openGraph: { title, description, type: "website", siteName: "accepted.fyi" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function AcceptanceRatePage({ params }: AcceptanceRatePageProps) {
  const { range: rangeSlug } = await params;
  const range = ACCEPTANCE_RATE_BY_SLUG.get(rangeSlug);
  if (!range) notFound();

  const matchingSchools = await getSchoolsByAcceptanceRate(range.min, range.max);

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://accepted.fyi" },
      { "@type": "ListItem", position: 2, name: "Colleges", item: "https://accepted.fyi/colleges" },
      { "@type": "ListItem", position: 3, name: `${range.label} Acceptance Rate`, item: `https://accepted.fyi/colleges/acceptance-rate/${rangeSlug}` },
    ],
  };

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `What colleges have a ${range.label} acceptance rate?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `There are ${matchingSchools.length} colleges with acceptance rates between ${range.min}% and ${range.max}%. Browse the full list to compare SAT scores, ACT scores, and real student outcomes.`,
        },
      },
      {
        "@type": "Question",
        name: `How hard is it to get into colleges with a ${range.label} acceptance rate?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Colleges with ${range.label} acceptance rates admit between ${range.min}% and ${range.max}% of applicants. See real admissions data from students who applied to these schools.`,
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
          Colleges with {range.label} Acceptance Rate
        </h1>
        <p className="mt-2 text-slate-400">
          {matchingSchools.length} schools with acceptance rates between {range.min}% and {range.max}%
        </p>

        <Suspense fallback={<div className="mt-6 text-sm text-slate-500">Loading filters...</div>}>
          <FilterableSchoolGrid schools={matchingSchools} hideFilter="acceptanceRate" />
        </Suspense>

        {/* FAQ Section */}
        <section className="mt-16 border-t border-white/5 pt-8">
          <h2 className="text-xl font-bold text-white">Frequently Asked Questions</h2>
          <dl className="mt-6 space-y-6">
            <div>
              <dt className="text-base font-semibold text-white">What colleges have a {range.label} acceptance rate?</dt>
              <dd className="mt-2 text-sm text-slate-400">
                There are {matchingSchools.length} colleges with acceptance rates between {range.min}% and {range.max}%. Browse the full list above to compare SAT scores, ACT scores, and real student outcomes.
              </dd>
            </div>
            <div>
              <dt className="text-base font-semibold text-white">How hard is it to get into colleges with a {range.label} acceptance rate?</dt>
              <dd className="mt-2 text-sm text-slate-400">
                Colleges with {range.label} acceptance rates admit between {range.min}% and {range.max}% of applicants. See real admissions data from students who applied to these schools.
              </dd>
            </div>
          </dl>
        </section>

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
