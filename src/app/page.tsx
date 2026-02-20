import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col">
      <nav className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <span className="text-xl font-bold">
            accepted<span className="text-blue-600">.fyi</span>
          </span>
          <Link
            href="/login"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Sign In
          </Link>
        </div>
      </nav>

      <section className="flex flex-1 flex-col items-center justify-center px-4 text-center">
        <h1 className="max-w-3xl text-5xl font-bold tracking-tight text-gray-900">
          See what it <span className="text-blue-600">actually</span> takes to
          get in
        </h1>
        <p className="mt-6 max-w-xl text-lg text-gray-600">
          Real admissions data from real students. Browse GPA, test scores,
          extracurriculars, and outcomes — verified and crowdsourced.
        </p>
        <div className="mt-10 flex gap-4">
          <Link
            href="/login"
            className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700"
          >
            Share Your Results
          </Link>
          <Link
            href="/schools"
            className="rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Browse Schools
          </Link>
        </div>

        <div className="mt-20 grid max-w-4xl grid-cols-1 gap-8 md:grid-cols-3">
          <div className="rounded-lg border border-gray-200 bg-white p-6 text-left">
            <h3 className="font-semibold text-gray-900">Crowdsourced Data</h3>
            <p className="mt-2 text-sm text-gray-600">
              Students share their GPA, SAT/ACT scores, extracurriculars, and
              admission decisions. Filter by school, state, major, and more.
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-6 text-left">
            <h3 className="font-semibold text-gray-900">Verified Results</h3>
            <p className="mt-2 text-sm text-gray-600">
              Three-tier verification: self-reported, .edu email verified, and
              document verified. Know how trustworthy each data point is.
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-6 text-left">
            <h3 className="font-semibold text-gray-900">Post to View</h3>
            <p className="mt-2 text-sm text-gray-600">
              Share your admissions results to unlock access to everyone
              else&apos;s data. Fair exchange — everyone contributes.
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-200 py-6 text-center text-sm text-gray-500">
        accepted.fyi — Levels.fyi for college admissions
      </footer>
    </main>
  );
}
