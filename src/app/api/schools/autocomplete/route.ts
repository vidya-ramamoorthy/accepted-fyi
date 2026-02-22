import { NextRequest, NextResponse } from "next/server";
import { searchSchools } from "@/lib/db/queries/schools";
import { logger } from "@/lib/logger";

const MINIMUM_QUERY_LENGTH = 2;

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");

  if (!query || query.length < MINIMUM_QUERY_LENGTH) {
    return NextResponse.json({ schools: [] });
  }

  try {
    const results = await searchSchools(query);
    const schools = results.map((school) => ({
      id: school.id,
      name: school.name,
      state: school.state,
      city: school.city,
    }));
    return NextResponse.json({ schools });
  } catch (error) {
    logger.error("schools.autocomplete_failed", { error });
    return NextResponse.json({ schools: [] });
  }
}
