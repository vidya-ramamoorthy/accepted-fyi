import { eq, ilike, sql, and, gte, lte, between, desc } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { schools, admissionSubmissions } from "@/lib/db/schema";
import { escapeLikePattern } from "@/lib/utils/escape-like";

export async function findSchoolByName(schoolName: string) {
  const db = getDb();
  const results = await db
    .select()
    .from(schools)
    .where(ilike(schools.name, escapeLikePattern(schoolName)))
    .limit(1);

  return results[0] ?? null;
}

export async function createSchool(data: {
  name: string;
  state: string;
  city: string;
  schoolType?: "public" | "private" | "community_college";
}) {
  const db = getDb();
  const [school] = await db
    .insert(schools)
    .values({
      name: data.name,
      state: data.state,
      city: data.city || "Unknown",
      schoolType: data.schoolType ?? "private",
    })
    .returning();

  return school;
}

export async function findOrCreateSchool(data: {
  name: string;
  state: string;
  city: string;
}) {
  const existingSchool = await findSchoolByName(data.name);
  if (existingSchool) {
    if (existingSchool.city === "Unknown" && data.city && data.city !== "Unknown") {
      const db = getDb();
      await db
        .update(schools)
        .set({ city: data.city })
        .where(eq(schools.id, existingSchool.id));
      existingSchool.city = data.city;
    }
    return existingSchool;
  }

  return createSchool(data);
}

interface SchoolsWithStatsOptions {
  query?: string;
  state?: string;
  page?: number;
  pageSize?: number;
}

export async function getSchoolsWithStats(options: SchoolsWithStatsOptions = {}) {
  const db = getDb();
  const pageSize = Math.min(options.pageSize ?? 30, 100);
  const currentPage = Math.max(options.page ?? 1, 1);
  const offset = (currentPage - 1) * pageSize;

  const conditions = [];
  if (options.query) {
    conditions.push(ilike(schools.name, `%${escapeLikePattern(options.query)}%`));
  }
  if (options.state) {
    conditions.push(eq(schools.state, options.state.toUpperCase()));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const schoolsWithStats = await db
    .select({
      id: schools.id,
      slug: schools.slug,
      name: schools.name,
      state: schools.state,
      city: schools.city,
      schoolType: schools.schoolType,
      acceptanceRate: schools.acceptanceRate,
      satAverage: schools.satAverage,
      sat25thPercentile: schools.sat25thPercentile,
      sat75thPercentile: schools.sat75thPercentile,
      undergradEnrollment: schools.undergradEnrollment,
      submissionCount: sql<number>`count(${admissionSubmissions.id})::int`,
      acceptedCount: sql<number>`count(case when ${admissionSubmissions.decision} = 'accepted' then 1 end)::int`,
      avgGpaUnweighted: sql<number>`round(avg(${admissionSubmissions.gpaUnweighted}::numeric), 2)`,
      avgSatScore: sql<number>`round(avg(${admissionSubmissions.satScore}))`,
      avgActScore: sql<number>`round(avg(${admissionSubmissions.actScore}))`,
    })
    .from(schools)
    .leftJoin(admissionSubmissions, eq(schools.id, admissionSubmissions.schoolId))
    .where(whereClause)
    .groupBy(schools.id)
    .orderBy(sql`count(${admissionSubmissions.id}) desc`, schools.name)
    .limit(pageSize)
    .offset(offset);

  const [countResult] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(schools)
    .where(whereClause);

  return {
    schools: schoolsWithStats,
    totalCount: countResult?.total ?? 0,
    page: currentPage,
    pageSize,
    totalPages: Math.ceil((countResult?.total ?? 0) / pageSize),
  };
}

export async function getSchoolById(schoolId: string) {
  const db = getDb();
  const [school] = await db
    .select()
    .from(schools)
    .where(eq(schools.id, schoolId))
    .limit(1);

  return school ?? null;
}

export async function getSchoolBySlug(slug: string) {
  const db = getDb();
  const [school] = await db
    .select()
    .from(schools)
    .where(eq(schools.slug, slug))
    .limit(1);

  return school ?? null;
}

export async function searchSchools(query: string) {
  const db = getDb();
  const escapedQuery = escapeLikePattern(query);
  return db
    .select()
    .from(schools)
    .where(ilike(schools.name, `%${escapedQuery}%`))
    .orderBy(schools.name)
    .limit(20);
}

// ─── Programmatic SEO queries ────────────────────────────────────────────────

const SCHOOL_CARD_SELECT = {
  id: schools.id,
  slug: schools.slug,
  name: schools.name,
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
  undergradEnrollment: schools.undergradEnrollment,
} as const;

export async function getSchoolsByState(stateAbbreviation: string) {
  const db = getDb();
  return db
    .select(SCHOOL_CARD_SELECT)
    .from(schools)
    .where(eq(schools.state, stateAbbreviation.toUpperCase()))
    .orderBy(schools.name);
}

export async function getStateAggregateStats(stateAbbreviation: string) {
  const db = getDb();
  const [stats] = await db
    .select({
      totalSchools: sql<number>`count(*)::int`,
      avgAcceptanceRate: sql<number>`round(avg(${schools.acceptanceRate}::numeric), 1)`,
      avgSat: sql<number>`round(avg(${schools.satAverage}))`,
      publicCount: sql<number>`count(case when ${schools.schoolType} = 'public' then 1 end)::int`,
      privateCount: sql<number>`count(case when ${schools.schoolType} = 'private' then 1 end)::int`,
    })
    .from(schools)
    .where(eq(schools.state, stateAbbreviation.toUpperCase()));

  return stats;
}

export async function getSchoolsBySatRange(min: number, max: number) {
  const db = getDb();
  return db
    .select(SCHOOL_CARD_SELECT)
    .from(schools)
    .where(
      and(
        lte(schools.sat25thPercentile, max),
        gte(schools.sat75thPercentile, min)
      )
    )
    .orderBy(desc(schools.satAverage), schools.name);
}

export async function getSchoolsByActRange(min: number, max: number) {
  const db = getDb();
  return db
    .select(SCHOOL_CARD_SELECT)
    .from(schools)
    .where(
      and(
        lte(schools.act25thPercentile, max),
        gte(schools.act75thPercentile, min)
      )
    )
    .orderBy(desc(schools.actMedian), schools.name);
}

export async function getSchoolsByAcceptanceRate(min: number, max: number) {
  const db = getDb();
  return db
    .select(SCHOOL_CARD_SELECT)
    .from(schools)
    .where(between(schools.acceptanceRate, min.toString(), max.toString()))
    .orderBy(schools.acceptanceRate, schools.name);
}
