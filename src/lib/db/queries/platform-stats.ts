import { sql } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { getDb } from "@/lib/db";

export interface PlatformStats {
  totalOutcomes: number;
  totalSchools: number;
}

async function fetchPlatformStats(): Promise<PlatformStats> {
  const db = getDb();

  const [outcomeStats, schoolStats] = await Promise.all([
    db.execute(sql`
      SELECT count(*)::int AS "totalOutcomes"
      FROM admission_submissions
    `),
    db.execute(sql`
      SELECT count(DISTINCT school_id)::int AS "totalSchools"
      FROM admission_submissions
    `),
  ]);

  const outcomes = outcomeStats[0] as Record<string, number>;
  const schools = schoolStats[0] as Record<string, number>;

  return {
    totalOutcomes: outcomes.totalOutcomes ?? 0,
    totalSchools: schools.totalSchools ?? 0,
  };
}

export const getPlatformStats = () =>
  unstable_cache(fetchPlatformStats, ["platform-stats"], {
    revalidate: 300,
    tags: ["platform-stats"],
  })();
