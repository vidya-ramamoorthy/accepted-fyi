import { getSchoolsWithStats } from "@/lib/db/queries/schools";
import Link from "next/link";
import type { Metadata } from "next";
import NavbarAuthSection from "@/components/NavbarAuthSection";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Browse Schools | accepted.fyi",
  description:
    "Browse admissions data for thousands of US colleges. See acceptance rates, SAT/ACT ranges, GPA stats, and crowdsourced outcomes.",
};

interface SchoolsPageProps {
  searchParams: Promise<{
    q?: string;
    state?: string;
    page?: string;
  }>;
}

export default async function SchoolsPage({ searchParams }: SchoolsPageProps) {
  const resolvedParams = await searchParams;
  const query = resolvedParams.q;
  const stateFilter = resolvedParams.state;
  const currentPage = resolvedParams.page ? parseInt(resolvedParams.page) : 1;

  let schoolsData: Awaited<ReturnType<typeof getSchoolsWithStats>> = {
    schools: [],
    totalCount: 0,
    page: 1,
    pageSize: 30,
    totalPages: 0,
  };
  let dbAvailable = true;

  try {
    schoolsData = await getSchoolsWithStats({
      query,
      state: stateFilter,
      page: currentPage,
    });
  } catch {
    dbAvailable = false;
  }

  const { schools, totalCount, page, totalPages } = schoolsData;

  function buildPageUrl(pageNumber: number): string {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (stateFilter) params.set("state", stateFilter);
    params.set("page", pageNumber.toString());
    return `/schools?${params.toString()}`;
  }

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
        <h1 className="text-3xl font-bold text-white">Schools</h1>
        <p className="mt-2 text-slate-400">
          {totalCount > 0
            ? `${totalCount.toLocaleString()} schools with admissions data`
            : "Browse admissions data by school"}
        </p>

        {/* Search & Filter */}
        <form method="GET" action="/schools" className="mt-6 flex flex-col gap-3 sm:flex-row">
          <input
            name="q"
            type="text"
            defaultValue={query}
            placeholder="Search schools..."
            className="flex-1 rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
          <input
            name="state"
            type="text"
            defaultValue={stateFilter}
            maxLength={2}
            placeholder="State (e.g., CA)"
            className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-sm uppercase text-slate-200 placeholder-slate-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 sm:w-28"
          />
          <button
            type="submit"
            className="rounded-lg bg-violet-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-violet-700"
          >
            Search
          </button>
          {(query || stateFilter) && (
            <Link
              href="/schools"
              className="rounded-lg border border-slate-700 px-4 py-2.5 text-center text-sm text-slate-400 hover:text-white"
            >
              Clear
            </Link>
          )}
        </form>

        {!dbAvailable || schools.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-white/5 bg-slate-900/50 p-16 text-center">
            <h2 className="text-lg font-semibold text-white">
              {query || stateFilter ? "No schools match your search" : "Be the first to contribute!"}
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-slate-400">
              {query || stateFilter
                ? "Try a different search term or clear your filters."
                : "School listings will populate as students submit their admissions results."}
            </p>
            {!query && !stateFilter && (
              <Link
                href="/login"
                className="mt-8 inline-block rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-600/25 transition-all hover:shadow-xl"
              >
                Sign In to Submit
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {schools.map((school) => (
                <Link
                  key={school.id}
                  href={`/schools/${school.slug ?? school.id}`}
                  className="group rounded-2xl border border-white/5 bg-slate-900/50 p-6 transition-all hover:border-white/10 hover:bg-slate-900/80"
                >
                  <h3 className="font-semibold text-white group-hover:text-violet-300 transition-colors">
                    {school.name}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {school.city}, {school.state}
                  </p>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-slate-500">
                        {school.acceptanceRate ? "Accept Rate" : "Submissions"}
                      </p>
                      <p className="text-lg font-semibold text-emerald-400">
                        {school.acceptanceRate
                          ? `${school.acceptanceRate}%`
                          : school.submissionCount > 0
                            ? school.submissionCount
                            : "\u2014"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">
                        {school.satAverage ? "SAT Avg" : school.avgSatScore ? "Avg SAT" : "Submissions"}
                      </p>
                      <p className="font-semibold text-white">
                        {school.satAverage ?? school.avgSatScore ?? school.submissionCount}
                      </p>
                    </div>
                    {school.avgGpaUnweighted && (
                      <div>
                        <p className="text-xs text-slate-500">Avg GPA</p>
                        <p className="font-semibold text-white">
                          {school.avgGpaUnweighted}
                        </p>
                      </div>
                    )}
                    {school.undergradEnrollment && (
                      <div>
                        <p className="text-xs text-slate-500">Enrollment</p>
                        <p className="font-semibold text-white">
                          {school.undergradEnrollment.toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>

                  <p className="mt-4 text-xs font-medium text-violet-400 opacity-0 transition-opacity group-hover:opacity-100">
                    View details &rarr;
                  </p>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-4">
                {page > 1 && (
                  <Link
                    href={buildPageUrl(page - 1)}
                    className="rounded-md border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
                  >
                    Previous
                  </Link>
                )}
                <span className="text-sm text-slate-500">
                  Page {page} of {totalPages}
                </span>
                {page < totalPages && (
                  <Link
                    href={buildPageUrl(page + 1)}
                    className="rounded-md border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
                  >
                    Next
                  </Link>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
