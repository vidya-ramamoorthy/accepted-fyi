import { NextRequest, NextResponse } from "next/server";
import { getSchoolsWithStats, searchSchools } from "@/lib/db/queries/schools";

export async function GET(request: NextRequest) {
  const searchQuery = request.nextUrl.searchParams.get("q");

  try {
    if (searchQuery) {
      const results = await searchSchools(searchQuery);
      return NextResponse.json({ schools: results });
    }

    // Public endpoint: returns school names and basic stats
    // Detailed per-submission data requires auth via /api/submissions
    const schoolsWithStats = await getSchoolsWithStats();
    return NextResponse.json(
      { schools: schoolsWithStats },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } }
    );
  } catch (error) {
    console.error("Failed to fetch schools:", error);
    return NextResponse.json(
      { error: "Failed to fetch schools" },
      { status: 500 }
    );
  }
}
