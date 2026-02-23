/**
 * Database queries for the chances calculator.
 *
 * Two cached queries:
 * 1. getAllSchoolsForChances() — fetches school institutional data (cached 1h)
 * 2. getSimilarProfileStats() — aggregates similar submissions across all schools (cached 30min)
 *
 * The similar profile query uses a single GROUP BY school_id to avoid N+1.
 * Cache keys use rounded inputs (GPA to 0.1, SAT to nearest 20) to maximize hits.
 */

import { sql, and, or, eq, lte, between, ilike } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { getDb } from "@/lib/db";
import { schools, admissionSubmissions } from "@/lib/db/schema";
import type { SchoolData, SimilarProfileStats } from "@/lib/chances/types";

// ─── School Data for Chances ──────────────────────────────────────────────────

const CHANCES_SCHOOL_SELECT = {
  id: schools.id,
  name: schools.name,
  slug: schools.slug,
  state: schools.state,
  city: schools.city,
  schoolType: schools.schoolType,
  acceptanceRate: schools.acceptanceRate,
  satAverage: schools.satAverage,
  sat25thPercentile: schools.sat25thPercentile,
  sat75thPercentile: schools.sat75thPercentile,
  actMedian: schools.actMedian,
  act25thPercentile: schools.act25thPercentile,
  act75thPercentile: schools.act75thPercentile,
  gpaPercent400: schools.gpaPercent400,
  gpaPercent375to399: schools.gpaPercent375to399,
  gpaPercent350to374: schools.gpaPercent350to374,
  gpaPercent325to349: schools.gpaPercent325to349,
  gpaPercent300to324: schools.gpaPercent300to324,
  gpaPercentBelow300: schools.gpaPercentBelow300,
} as const;

async function fetchAllSchoolsForChances(): Promise<SchoolData[]> {
  const db = getDb();

  const rows = await db
    .select(CHANCES_SCHOOL_SELECT)
    .from(schools)
    .orderBy(schools.name);

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    state: row.state,
    city: row.city,
    schoolType: row.schoolType,
    acceptanceRate: row.acceptanceRate !== null ? Number(row.acceptanceRate) : null,
    satAverage: row.satAverage,
    sat25thPercentile: row.sat25thPercentile,
    sat75thPercentile: row.sat75thPercentile,
    actMedian: row.actMedian,
    act25thPercentile: row.act25thPercentile,
    act75thPercentile: row.act75thPercentile,
    gpaPercent400: row.gpaPercent400 !== null ? Number(row.gpaPercent400) : null,
    gpaPercent375to399: row.gpaPercent375to399 !== null ? Number(row.gpaPercent375to399) : null,
    gpaPercent350to374: row.gpaPercent350to374 !== null ? Number(row.gpaPercent350to374) : null,
    gpaPercent325to349: row.gpaPercent325to349 !== null ? Number(row.gpaPercent325to349) : null,
    gpaPercent300to324: row.gpaPercent300to324 !== null ? Number(row.gpaPercent300to324) : null,
    gpaPercentBelow300: row.gpaPercentBelow300 !== null ? Number(row.gpaPercentBelow300) : null,
  }));
}

export const getAllSchoolsForChances = () =>
  unstable_cache(
    fetchAllSchoolsForChances,
    ["chances-all-schools"],
    { revalidate: 3600, tags: ["chances-schools"] }
  )();

// ─── Similar Profile Stats ────────────────────────────────────────────────────

/**
 * Visibility condition matching the one in submissions.ts:
 * visible OR pending_review older than 2 hours.
 */
const PENDING_REVIEW_DELAY_HOURS = 2;

function visibleSubmissionCondition() {
  return or(
    eq(admissionSubmissions.submissionStatus, "visible"),
    and(
      eq(admissionSubmissions.submissionStatus, "pending_review"),
      lte(
        admissionSubmissions.createdAt,
        sql`now() - interval '${sql.raw(String(PENDING_REVIEW_DELAY_HOURS))} hours'`
      )
    )
  );
}

interface SimilarProfileInput {
  gpaUnweighted: number | null;
  satScore: number | null;
  actScore: number | null;
  intendedMajor: string | null;
  admissionCycle: string | null;
}

/**
 * Rounds inputs to create coarser cache keys that maximize cache hit rate.
 * GPA rounded to nearest 0.1, SAT to nearest 20, ACT to nearest 1.
 */
function roundedCacheKey(input: SimilarProfileInput): string {
  const gpaKey = input.gpaUnweighted !== null
    ? Math.round(input.gpaUnweighted * 10) / 10
    : "null";
  const satKey = input.satScore !== null
    ? Math.round(input.satScore / 20) * 20
    : "null";
  const actKey = input.actScore !== null
    ? Math.round(input.actScore)
    : "null";
  const majorKey = input.intendedMajor ?? "null";
  const cycleKey = input.admissionCycle ?? "null";
  return `chances-similar-gpa:${gpaKey}-sat:${satKey}-act:${actKey}-major:${majorKey}-cycle:${cycleKey}`;
}

async function fetchSimilarProfileStats(
  input: SimilarProfileInput
): Promise<SimilarProfileStats[]> {
  const db = getDb();

  const conditions = [visibleSubmissionCondition()!];

  // Only include GPA filter if student provided GPA
  if (input.gpaUnweighted !== null) {
    const gpaLow = (input.gpaUnweighted - 0.15).toFixed(2);
    const gpaHigh = (input.gpaUnweighted + 0.15).toFixed(2);
    conditions.push(
      between(admissionSubmissions.gpaUnweighted, gpaLow, gpaHigh)
    );
  }

  // Only include SAT filter if student provided SAT
  if (input.satScore !== null) {
    const satLow = input.satScore - 80;
    const satHigh = input.satScore + 80;
    conditions.push(
      between(admissionSubmissions.satScore, satLow, satHigh)
    );
  }

  // Only include ACT filter if student provided ACT
  if (input.actScore !== null) {
    const actLow = input.actScore - 3;
    const actHigh = input.actScore + 3;
    conditions.push(
      between(admissionSubmissions.actScore, actLow, actHigh)
    );
  }

  // Filter by intended major (fuzzy match)
  if (input.intendedMajor !== null) {
    conditions.push(
      ilike(admissionSubmissions.intendedMajor, `%${input.intendedMajor}%`)
    );
  }

  // Filter by admission cycle
  if (input.admissionCycle !== null) {
    conditions.push(
      eq(admissionSubmissions.admissionCycle, input.admissionCycle)
    );
  }

  const rows = await db
    .select({
      schoolId: admissionSubmissions.schoolId,
      totalSimilar: sql<number>`count(*)::int`,
      accepted: sql<number>`count(case when ${admissionSubmissions.decision} = 'accepted' then 1 end)::int`,
      rejected: sql<number>`count(case when ${admissionSubmissions.decision} = 'rejected' then 1 end)::int`,
      waitlisted: sql<number>`count(case when ${admissionSubmissions.decision} = 'waitlisted' then 1 end)::int`,
      acceptedEarlyDecision: sql<number>`count(case when ${admissionSubmissions.decision} = 'accepted' and ${admissionSubmissions.applicationRound} = 'early_decision' then 1 end)::int`,
      acceptedEarlyAction: sql<number>`count(case when ${admissionSubmissions.decision} = 'accepted' and ${admissionSubmissions.applicationRound} = 'early_action' then 1 end)::int`,
      acceptedRegular: sql<number>`count(case when ${admissionSubmissions.decision} = 'accepted' and ${admissionSubmissions.applicationRound} = 'regular' then 1 end)::int`,
    })
    .from(admissionSubmissions)
    .where(and(...conditions))
    .groupBy(admissionSubmissions.schoolId);

  return rows;
}

export function getSimilarProfileStats(input: SimilarProfileInput) {
  const cacheKey = roundedCacheKey(input);
  return unstable_cache(
    () => fetchSimilarProfileStats(input),
    [cacheKey],
    { revalidate: 1800, tags: ["chances-profiles"] }
  )();
}
