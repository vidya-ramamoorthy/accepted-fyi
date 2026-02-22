import Link from "next/link";
import { getDb } from "@/lib/db";
import { schools, admissionSubmissions } from "@/lib/db/schema";
import { sql } from "drizzle-orm";

export default async function HomePage() {
  let schoolCount = 0;
  let submissionCount = 0;
  try {
    const db = getDb();
    const [schoolResult] = await db.select({ count: sql<number>`count(*)::int` }).from(schools);
    const [submissionResult] = await db.select({ count: sql<number>`count(*)::int` }).from(admissionSubmissions);
    schoolCount = schoolResult?.count ?? 0;
    submissionCount = submissionResult?.count ?? 0;
  } catch {
    // DB unavailable — show defaults
  }
  return (
    <main className="flex min-h-screen flex-col bg-slate-950">
      {/* Nav */}
      <nav className="fixed top-0 z-50 w-full border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <span className="text-xl font-bold text-white tracking-tight">
            accepted<span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">.fyi</span>
          </span>
          <div className="flex items-center gap-4">
            <Link
              href="/schools"
              className="text-sm text-slate-400 transition-colors hover:text-white"
            >
              Browse Schools
            </Link>
            <Link
              href="/login"
              className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-slate-900 transition-all hover:bg-slate-100 hover:shadow-lg hover:shadow-white/10"
            >
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden px-6 pb-24 pt-36">
        {/* Background effects */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 -translate-x-1/2 h-[600px] w-[800px] rounded-full bg-gradient-to-b from-violet-600/20 via-indigo-600/10 to-transparent blur-3xl" />
          <div className="absolute right-0 top-40 h-[400px] w-[400px] rounded-full bg-gradient-to-bl from-blue-600/15 to-transparent blur-3xl" />
          <div className="absolute left-0 top-60 h-[300px] w-[300px] rounded-full bg-gradient-to-br from-purple-600/10 to-transparent blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-4 py-1.5 text-sm text-violet-300">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse" />
            The Levels.fyi for college admissions
          </div>

          <h1 className="mt-8 text-5xl font-bold tracking-tight text-white sm:text-7xl">
            See what it{" "}
            <span className="bg-gradient-to-r from-violet-400 via-indigo-400 to-blue-400 bg-clip-text text-transparent">
              actually
            </span>{" "}
            takes to get in
          </h1>

          <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-slate-400">
            Real admissions data from real students. Browse GPA, test scores,
            extracurriculars, and outcomes — all crowdsourced and verified.
          </p>

          <div className="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/login"
              className="group relative w-full overflow-hidden rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-8 py-4 text-sm font-semibold text-white shadow-lg shadow-violet-600/25 transition-all hover:shadow-xl hover:shadow-violet-600/30 sm:w-auto"
            >
              <span className="relative z-10">Share Your Results</span>
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-transform duration-300 group-hover:translate-x-0" />
            </Link>
            <Link
              href="/schools"
              className="w-full rounded-full border border-slate-700 bg-slate-900/50 px-8 py-4 text-sm font-semibold text-slate-300 backdrop-blur-sm transition-all hover:border-slate-600 hover:bg-slate-800/50 hover:text-white sm:w-auto"
            >
              Browse Schools
            </Link>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-white/5 bg-slate-900/50">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-px sm:grid-cols-4">
          <StatCounter label="Submissions" value={submissionCount > 0 ? submissionCount.toLocaleString() : "Growing"} />
          <StatCounter label="Schools Tracked" value={schoolCount > 0 ? schoolCount.toLocaleString() : "2,000+"} />
          <StatCounter label="Data Fields" value="20+" />
          <StatCounter label="States Covered" value="50" />
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <p className="text-center text-sm font-semibold uppercase tracking-widest text-violet-400">
            How it works
          </p>
          <h2 className="mt-4 text-center text-3xl font-bold text-white sm:text-4xl">
            Three steps. Two minutes. Unlimited data.
          </h2>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            <StepCard
              step="01"
              title="Sign in with Google"
              description="Quick and secure. No passwords to remember. Your identity is never shown publicly."
            />
            <StepCard
              step="02"
              title="Submit your results"
              description="Share your GPA, test scores, decision, and background. All data is anonymized."
            />
            <StepCard
              step="03"
              title="Browse all data"
              description="Explore real outcomes. Contributing your results helps everyone make better decisions."
            />
          </div>
        </div>
      </section>

      {/* Sample data preview */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <p className="text-center text-sm font-semibold uppercase tracking-widest text-violet-400">
            Real data preview
          </p>
          <h2 className="mt-4 text-center text-3xl font-bold text-white sm:text-4xl">
            Data that actually helps
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-slate-400">
            Go beyond acceptance rates. See the full picture for every applicant.
          </p>

          <div className="mt-12 grid gap-4 md:grid-cols-2">
            <SampleCard
              school="Stanford University"
              location="Stanford, CA"
              decision="accepted"
              round="RD"
              gpa="3.92"
              sat="1540"
              tags={["Public HS", "First-Gen", "Suburban", "12 APs"]}
              major="Computer Science"
            />
            <SampleCard
              school="MIT"
              location="Cambridge, MA"
              decision="waitlisted"
              round="EA"
              gpa="3.88"
              sat="1560"
              tags={["Private HS", "Legacy", "Urban", "6 IBs"]}
              major="Electrical Engineering"
            />
            <SampleCard
              school="UC Berkeley"
              location="Berkeley, CA"
              decision="accepted"
              round="RD"
              gpa="3.78"
              act="34"
              tags={["Magnet", "Suburban", "8 APs", "4 Honors"]}
              major="Economics"
            />
            <SampleCard
              school="University of Michigan"
              location="Ann Arbor, MI"
              decision="rejected"
              round="EA"
              gpa="3.65"
              sat="1420"
              tags={["Public HS", "Rural", "6 APs"]}
              major="Business"
            />
          </div>

          <div className="relative mt-4">
            <div className="absolute inset-0 z-10 flex items-center justify-center">
              <Link
                href="/login"
                className="rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-600/25 transition-all hover:shadow-xl hover:shadow-violet-600/30"
              >
                Sign In to See Real Data
              </Link>
            </div>
            <div className="h-32 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent" />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-6 md:grid-cols-3">
            <FeatureCard
              title="Filter by Everything"
              description="School, GPA range, SAT/ACT, state, decision, application round, high school type, first-gen status, and more."
              gradient="from-violet-500/10 to-purple-500/10"
              borderColor="border-violet-500/20"
            />
            <FeatureCard
              title="Official + Community Data"
              description="College Scorecard institutional data alongside crowdsourced individual outcomes. See the full picture for every school."
              gradient="from-blue-500/10 to-cyan-500/10"
              borderColor="border-blue-500/20"
            />
            <FeatureCard
              title="Completely Anonymous"
              description="Your identity is never shown. Only aggregated stats and anonymized individual data points are visible."
              gradient="from-emerald-500/10 to-teal-500/10"
              borderColor="border-emerald-500/20"
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden px-6 py-24">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[700px] rounded-full bg-gradient-to-r from-violet-600/20 via-indigo-600/15 to-blue-600/20 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-2xl text-center">
          <h2 className="text-4xl font-bold text-white sm:text-5xl">
            Stop guessing.{" "}
            <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              Start knowing.
            </span>
          </h2>
          <p className="mt-6 text-lg text-slate-400">
            Join students who are making data-driven college decisions.
            Share your results. Help everyone decide.
          </p>
          <Link
            href="/login"
            className="mt-10 inline-block rounded-full bg-white px-10 py-4 text-sm font-semibold text-slate-900 shadow-lg shadow-white/10 transition-all hover:bg-slate-100 hover:shadow-xl hover:shadow-white/15"
          >
            Get Started — It&apos;s Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-slate-950 px-6 py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
          <span className="text-sm font-bold text-slate-500">
            accepted<span className="text-violet-500">.fyi</span>
          </span>
          <p className="text-sm text-slate-600">
            Real college admissions data from real students
          </p>
        </div>
      </footer>
    </main>
  );
}

function StatCounter({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-6 py-6 text-center">
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{label}</p>
    </div>
  );
}

function StepCard({
  step,
  title,
  description,
}: {
  step: string;
  title: string;
  description: string;
}) {
  return (
    <div className="group relative rounded-2xl border border-white/5 bg-slate-900/50 p-8 transition-all hover:border-white/10 hover:bg-slate-900/80">
      <span className="text-xs font-bold tracking-widest text-violet-500">
        STEP {step}
      </span>
      <h3 className="mt-4 text-lg font-semibold text-white">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-slate-400">{description}</p>
    </div>
  );
}

const DECISION_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  accepted: { bg: "bg-emerald-500/10", text: "text-emerald-400", label: "Accepted" },
  rejected: { bg: "bg-red-500/10", text: "text-red-400", label: "Rejected" },
  waitlisted: { bg: "bg-amber-500/10", text: "text-amber-400", label: "Waitlisted" },
  deferred: { bg: "bg-blue-500/10", text: "text-blue-400", label: "Deferred" },
};

function SampleCard({
  school,
  location,
  decision,
  round,
  gpa,
  sat,
  act,
  tags,
  major,
}: {
  school: string;
  location: string;
  decision: string;
  round: string;
  gpa: string;
  sat?: string;
  act?: string;
  tags: string[];
  major: string;
}) {
  const style = DECISION_STYLES[decision] ?? DECISION_STYLES.accepted;

  return (
    <div className="rounded-2xl border border-white/5 bg-slate-900/50 p-6 transition-all hover:border-white/10 hover:bg-slate-900/80">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-white">{school}</h3>
          <p className="mt-0.5 text-sm text-slate-500">{location} &middot; {round}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${style.bg} ${style.text}`}>
          {style.label}
        </span>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-4">
        <div>
          <p className="text-xs text-slate-500">GPA</p>
          <p className="text-lg font-semibold text-white">{gpa}</p>
        </div>
        {sat && (
          <div>
            <p className="text-xs text-slate-500">SAT</p>
            <p className="text-lg font-semibold text-white">{sat}</p>
          </div>
        )}
        {act && (
          <div>
            <p className="text-xs text-slate-500">ACT</p>
            <p className="text-lg font-semibold text-white">{act}</p>
          </div>
        )}
      </div>
      <p className="mt-3 text-sm text-slate-400">
        <span className="text-slate-500">Major:</span> {major}
      </p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-violet-500/20 bg-violet-500/5 px-2.5 py-0.5 text-xs text-violet-300"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

function FeatureCard({
  title,
  description,
  gradient,
  borderColor,
}: {
  title: string;
  description: string;
  gradient: string;
  borderColor: string;
}) {
  return (
    <div
      className={`rounded-2xl border ${borderColor} bg-gradient-to-br ${gradient} p-8 transition-all hover:scale-[1.02]`}
    >
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-slate-400">{description}</p>
    </div>
  );
}
