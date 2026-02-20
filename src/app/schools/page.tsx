import { getSchoolsWithStats } from "@/lib/db/queries/schools";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function SchoolsPage() {
  let schoolsData: Awaited<ReturnType<typeof getSchoolsWithStats>> = [];
  let dbAvailable = true;

  try {
    schoolsData = await getSchoolsWithStats();
  } catch {
    dbAvailable = false;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link href="/" className="text-xl font-bold">
            accepted<span className="text-blue-600">.fyi</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900">Schools</h1>
        <p className="mt-2 text-gray-600">
          Browse admissions data by school. More schools added as students
          submit their results.
        </p>

        {!dbAvailable || schoolsData.length === 0 ? (
          <div className="mt-8 rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center">
            <h2 className="text-lg font-semibold text-gray-900">
              Be the first to contribute!
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              School listings will populate as students submit their admissions
              results. Sign in and share yours to get started.
            </p>
            <Link
              href="/login"
              className="mt-6 inline-block rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700"
            >
              Sign In to Submit
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {schoolsData.map((school) => (
              <div
                key={school.id}
                className="rounded-lg border border-gray-200 bg-white p-5 transition-shadow hover:shadow-md"
              >
                <h3 className="font-semibold text-gray-900">{school.name}</h3>
                <p className="text-sm text-gray-500">
                  {school.city}, {school.state}
                </p>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-500">Submissions</p>
                    <p className="font-semibold text-gray-900">
                      {school.submissionCount}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Accepted</p>
                    <p className="font-semibold text-green-600">
                      {school.submissionCount > 0
                        ? `${Math.round((school.acceptedCount / school.submissionCount) * 100)}%`
                        : "—"}
                    </p>
                  </div>
                  {school.avgGpaUnweighted && (
                    <div>
                      <p className="text-xs text-gray-500">Avg GPA</p>
                      <p className="font-semibold text-gray-900">
                        {school.avgGpaUnweighted}
                      </p>
                    </div>
                  )}
                  {school.avgSatScore && (
                    <div>
                      <p className="text-xs text-gray-500">Avg SAT</p>
                      <p className="font-semibold text-gray-900">
                        {school.avgSatScore}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
