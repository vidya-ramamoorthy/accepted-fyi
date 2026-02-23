import Link from "next/link";
import type { Metadata } from "next";
import { US_STATES } from "@/lib/constants/us-states";
import { SAT_RANGES, ACT_RANGES, ACCEPTANCE_RATE_RANGES } from "@/lib/constants/score-ranges";
import NavbarAuthSection from "@/components/NavbarAuthSection";

export const metadata: Metadata = {
  title: "Browse Colleges by State, SAT Score, ACT Score & Acceptance Rate | accepted.fyi",
  description:
    "Find the right college for you. Browse US colleges by state, SAT score range, ACT score range, and acceptance rate. Real admissions data from thousands of schools.",
  openGraph: {
    title: "Browse Colleges | accepted.fyi",
    description:
      "Find the right college for you. Browse by state, test scores, and acceptance rate.",
    type: "website",
    siteName: "accepted.fyi",
  },
};

export default function CollegesHubPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <nav className="fixed top-0 z-50 w-full border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-xl font-bold text-white tracking-tight">
            accepted<span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">.fyi</span>
          </Link>
          <NavbarAuthSection />
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-6 pb-16 pt-28">
        <h1 className="text-3xl font-bold text-white sm:text-4xl">Browse Colleges</h1>
        <p className="mt-3 max-w-2xl text-slate-400">
          Explore admissions data for US colleges and universities. Find schools that match your
          profile by state, test scores, or selectivity.
        </p>

        {/* Featured */}
        <section className="mt-12">
          <h2 className="text-xl font-bold text-white">Featured</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Link
              href="/uc-schools"
              className="group rounded-2xl border border-white/5 bg-slate-900/50 p-6 transition-all hover:border-violet-500/30 hover:bg-slate-900/80"
            >
              <h3 className="text-lg font-semibold text-white group-hover:text-violet-300 transition-colors">
                UC System — All 9 Campuses
              </h3>
              <p className="mt-2 text-sm text-slate-400">
                Compare admissions data across UCLA, Berkeley, San Diego, and all 9 UC campuses. Decision dates, acceptance rates, and community outcomes.
              </p>
              <p className="mt-3 text-xs font-medium text-violet-400 opacity-0 transition-opacity group-hover:opacity-100">
                Explore UC schools &rarr;
              </p>
            </Link>
            <Link
              href="/mit"
              className="group rounded-2xl border border-white/5 bg-slate-900/50 p-6 transition-all hover:border-violet-500/30 hover:bg-slate-900/80"
            >
              <h3 className="text-lg font-semibold text-white group-hover:text-violet-300 transition-colors">
                MIT Admissions Data
              </h3>
              <p className="mt-2 text-sm text-slate-400">
                Pi Day decisions, acceptance rates, SAT/ACT score ranges, and real community-reported outcomes for MIT.
              </p>
              <p className="mt-3 text-xs font-medium text-violet-400 opacity-0 transition-opacity group-hover:opacity-100">
                View MIT data &rarr;
              </p>
            </Link>
          </div>
        </section>

        {/* Browse by State */}
        <section className="mt-12">
          <h2 className="text-xl font-bold text-white">By State</h2>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {US_STATES.map((state) => (
              <Link
                key={state.abbreviation}
                href={`/colleges/state/${state.slug}`}
                className="rounded-lg border border-white/5 bg-slate-900/50 px-4 py-3 text-sm text-slate-300 transition-all hover:border-violet-500/30 hover:bg-slate-900 hover:text-white"
              >
                {state.name}
              </Link>
            ))}
          </div>
        </section>

        {/* Browse by SAT Score */}
        <section className="mt-12">
          <h2 className="text-xl font-bold text-white">By SAT Score</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {SAT_RANGES.map((range) => (
              <Link
                key={range.slug}
                href={`/colleges/sat/${range.slug}`}
                className="rounded-xl border border-white/5 bg-slate-900/50 p-4 text-center transition-all hover:border-violet-500/30 hover:bg-slate-900"
              >
                <p className="text-lg font-bold text-white">{range.label}</p>
                <p className="mt-1 text-xs text-slate-500">SAT Score</p>
              </Link>
            ))}
          </div>
        </section>

        {/* Browse by ACT Score */}
        <section className="mt-12">
          <h2 className="text-xl font-bold text-white">By ACT Score</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {ACT_RANGES.map((range) => (
              <Link
                key={range.slug}
                href={`/colleges/act/${range.slug}`}
                className="rounded-xl border border-white/5 bg-slate-900/50 p-4 text-center transition-all hover:border-violet-500/30 hover:bg-slate-900"
              >
                <p className="text-lg font-bold text-white">{range.label}</p>
                <p className="mt-1 text-xs text-slate-500">ACT Score</p>
              </Link>
            ))}
          </div>
        </section>

        {/* Browse by Acceptance Rate */}
        <section className="mt-12">
          <h2 className="text-xl font-bold text-white">By Acceptance Rate</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {ACCEPTANCE_RATE_RANGES.map((range) => (
              <Link
                key={range.slug}
                href={`/colleges/acceptance-rate/${range.slug}`}
                className="rounded-xl border border-white/5 bg-slate-900/50 p-4 text-center transition-all hover:border-violet-500/30 hover:bg-slate-900"
              >
                <p className="text-lg font-bold text-white">{range.label}</p>
                <p className="mt-1 text-xs text-slate-500">Acceptance Rate</p>
              </Link>
            ))}
          </div>
        </section>
        {/* Popular Combinations */}
        <section className="mt-12">
          <h2 className="text-xl font-bold text-white">Popular Combinations</h2>
          <p className="mt-2 text-sm text-slate-400">
            Browse colleges filtered by both state and test score range.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { stateSlug: "california", stateName: "California", satSlug: "1400-1500", satLabel: "1400-1500 SAT" },
              { stateSlug: "new-york", stateName: "New York", satSlug: "1300-1400", satLabel: "1300-1400 SAT" },
              { stateSlug: "texas", stateName: "Texas", satSlug: "1200-1300", satLabel: "1200-1300 SAT" },
              { stateSlug: "massachusetts", stateName: "Massachusetts", satSlug: "1500-1600", satLabel: "1500-1600 SAT" },
              { stateSlug: "florida", stateName: "Florida", satSlug: "1100-1200", satLabel: "1100-1200 SAT" },
              { stateSlug: "pennsylvania", stateName: "Pennsylvania", satSlug: "1300-1400", satLabel: "1300-1400 SAT" },
            ].map((combo) => (
              <Link
                key={`${combo.stateSlug}-${combo.satSlug}`}
                href={`/colleges/state/${combo.stateSlug}/sat/${combo.satSlug}`}
                className="rounded-xl border border-white/5 bg-slate-900/50 p-4 transition-all hover:border-violet-500/30 hover:bg-slate-900"
              >
                <p className="text-sm font-semibold text-white">{combo.stateName}</p>
                <p className="mt-0.5 text-xs text-slate-500">{combo.satLabel}</p>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
