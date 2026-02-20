import { eq, ilike, sql } from "drizzle-orm";
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
  if (existingSchool) return existingSchool;

  return createSchool(data);
}

export async function getSchoolsWithStats(limit = 100) {
  const db = getDb();

  const schoolsWithStats = await db
    .select({
      id: schools.id,
      name: schools.name,
      state: schools.state,
      city: schools.city,
      schoolType: schools.schoolType,
      acceptanceRate: schools.acceptanceRate,
      submissionCount: sql<number>`count(${admissionSubmissions.id})::int`,
      acceptedCount: sql<number>`count(case when ${admissionSubmissions.decision} = 'accepted' then 1 end)::int`,
      avgGpaUnweighted: sql<number>`round(avg(${admissionSubmissions.gpaUnweighted}::numeric), 2)`,
      avgSatScore: sql<number>`round(avg(${admissionSubmissions.satScore}))`,
      avgActScore: sql<number>`round(avg(${admissionSubmissions.actScore}))`,
    })
    .from(schools)
    .leftJoin(admissionSubmissions, eq(schools.id, admissionSubmissions.schoolId))
    .groupBy(schools.id)
    .orderBy(sql`count(${admissionSubmissions.id}) desc`)
    .limit(limit);

  return schoolsWithStats;
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
