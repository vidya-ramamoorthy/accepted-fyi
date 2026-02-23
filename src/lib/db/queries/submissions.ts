import { eq, and, ilike, gte, lte, sql, desc, or } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { getDb } from "@/lib/db";
import { admissionSubmissions, schools } from "@/lib/db/schema";
import { escapeLikePattern } from "@/lib/utils/escape-like";
import type {
  AdmissionDecision,
  DataSource,
  HighSchoolType,
  GeographicClassification,
  ScholarshipType,
  AttendanceIntent,
  WaitlistOutcome,
} from "@/types/database";

const MAX_PAGE_SIZE = 100;
const PENDING_REVIEW_DELAY_HOURS = 2;

/**
 * Visibility condition: show submissions that are either:
 * 1. Explicitly "visible", OR
 * 2. "pending_review" but older than PENDING_REVIEW_DELAY_HOURS
 *    (auto-promotes suspicious submissions after a cooling period)
 */
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

const submissionWithSchoolFields = {
  id: admissionSubmissions.id,
  userId: admissionSubmissions.userId,
  dataSource: admissionSubmissions.dataSource,
  decision: admissionSubmissions.decision,
  applicationRound: admissionSubmissions.applicationRound,
  admissionCycle: admissionSubmissions.admissionCycle,
  gpaUnweighted: admissionSubmissions.gpaUnweighted,
  gpaWeighted: admissionSubmissions.gpaWeighted,
  satScore: admissionSubmissions.satScore,
  actScore: admissionSubmissions.actScore,
  intendedMajor: admissionSubmissions.intendedMajor,
  stateOfResidence: admissionSubmissions.stateOfResidence,
  extracurriculars: admissionSubmissions.extracurriculars,
  highSchoolType: admissionSubmissions.highSchoolType,
  firstGeneration: admissionSubmissions.firstGeneration,
  legacyStatus: admissionSubmissions.legacyStatus,
  financialAidApplied: admissionSubmissions.financialAidApplied,
  geographicClassification: admissionSubmissions.geographicClassification,
  apCoursesCount: admissionSubmissions.apCoursesCount,
  ibCoursesCount: admissionSubmissions.ibCoursesCount,
  honorsCoursesCount: admissionSubmissions.honorsCoursesCount,
  scholarshipOffered: admissionSubmissions.scholarshipOffered,
  willAttend: admissionSubmissions.willAttend,
  waitlistOutcome: admissionSubmissions.waitlistOutcome,
  verificationTier: admissionSubmissions.verificationTier,
  createdAt: admissionSubmissions.createdAt,
  schoolName: schools.name,
  schoolState: schools.state,
} as const;

export interface SubmissionFilters {
  schoolName?: string;
  decision?: AdmissionDecision;
  admissionCycle?: string;
  stateOfResidence?: string;
  dataSource?: DataSource;
  intendedMajor?: string;
  minGpa?: number;
  maxGpa?: number;
  minSat?: number;
  maxSat?: number;
  page?: number;
  pageSize?: number;
}

export async function createSubmission(data: {
  userId: string;
  schoolId: string;
  admissionCycle: string;
  decision: AdmissionDecision;
  applicationRound: "early_decision" | "early_action" | "regular" | "rolling";
  gpaUnweighted: number | null;
  gpaWeighted: number | null;
  satScore: number | null;
  actScore: number | null;
  intendedMajor: string | null;
  stateOfResidence: string;
  extracurriculars: string[];
  highSchoolType: HighSchoolType | null;
  firstGeneration: boolean | null;
  legacyStatus: boolean | null;
  financialAidApplied: boolean | null;
  geographicClassification: GeographicClassification | null;
  apCoursesCount: number | null;
  ibCoursesCount: number | null;
  honorsCoursesCount: number | null;
  scholarshipOffered: ScholarshipType | null;
  willAttend: AttendanceIntent | null;
  waitlistOutcome: WaitlistOutcome | null;
  submissionStatus?: "visible" | "pending_review" | "flagged";
}) {
  const db = getDb();
  const [submission] = await db
    .insert(admissionSubmissions)
    .values({
      userId: data.userId,
      schoolId: data.schoolId,
      admissionCycle: data.admissionCycle,
      decision: data.decision,
      applicationRound: data.applicationRound,
      gpaUnweighted: data.gpaUnweighted?.toString() ?? null,
      gpaWeighted: data.gpaWeighted?.toString() ?? null,
      satScore: data.satScore,
      actScore: data.actScore,
      intendedMajor: data.intendedMajor,
      stateOfResidence: data.stateOfResidence,
      extracurriculars: data.extracurriculars,
      highSchoolType: data.highSchoolType,
      firstGeneration: data.firstGeneration,
      legacyStatus: data.legacyStatus,
      financialAidApplied: data.financialAidApplied,
      geographicClassification: data.geographicClassification,
      apCoursesCount: data.apCoursesCount,
      ibCoursesCount: data.ibCoursesCount,
      honorsCoursesCount: data.honorsCoursesCount,
      scholarshipOffered: data.scholarshipOffered,
      willAttend: data.willAttend,
      waitlistOutcome: data.waitlistOutcome,
      submissionStatus: data.submissionStatus ?? "visible",
    })
    .returning();

  return submission;
}

export async function getSubmissionsWithSchool(filters: SubmissionFilters = {}) {
  const db = getDb();
  const pageSize = Math.min(Math.max(1, filters.pageSize ?? 20), MAX_PAGE_SIZE);
  const page = Math.max(1, filters.page ?? 1);
  const offset = (page - 1) * pageSize;

  const conditions = [visibleSubmissionCondition()!];

  if (filters.schoolName) {
    const escapedName = escapeLikePattern(filters.schoolName);
    conditions.push(ilike(schools.name, `%${escapedName}%`));
  }
  if (filters.decision) {
    conditions.push(eq(admissionSubmissions.decision, filters.decision));
  }
  if (filters.admissionCycle) {
    conditions.push(eq(admissionSubmissions.admissionCycle, filters.admissionCycle));
  }
  if (filters.stateOfResidence) {
    conditions.push(eq(admissionSubmissions.stateOfResidence, filters.stateOfResidence.toUpperCase()));
  }
  if (filters.dataSource) {
    conditions.push(eq(admissionSubmissions.dataSource, filters.dataSource));
  }
  if (filters.intendedMajor) {
    const escapedMajor = escapeLikePattern(filters.intendedMajor);
    conditions.push(ilike(admissionSubmissions.intendedMajor, `%${escapedMajor}%`));
  }
  if (filters.minGpa !== undefined) {
    conditions.push(gte(admissionSubmissions.gpaUnweighted, filters.minGpa.toString()));
  }
  if (filters.maxGpa !== undefined) {
    conditions.push(lte(admissionSubmissions.gpaUnweighted, filters.maxGpa.toString()));
  }
  if (filters.minSat !== undefined) {
    conditions.push(gte(admissionSubmissions.satScore, filters.minSat));
  }
  if (filters.maxSat !== undefined) {
    conditions.push(lte(admissionSubmissions.satScore, filters.maxSat));
  }

  const submissions = await db
    .select(submissionWithSchoolFields)
    .from(admissionSubmissions)
    .innerJoin(schools, eq(admissionSubmissions.schoolId, schools.id))
    .where(and(...conditions))
    .orderBy(desc(admissionSubmissions.createdAt))
    .limit(pageSize)
    .offset(offset);

  const [countResult] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(admissionSubmissions)
    .innerJoin(schools, eq(admissionSubmissions.schoolId, schools.id))
    .where(and(...conditions));

  return {
    submissions,
    totalCount: countResult?.total ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((countResult?.total ?? 0) / pageSize),
  };
}

export async function getSubmissionsByUser(userId: string) {
  const db = getDb();

  return db
    .select(submissionWithSchoolFields)
    .from(admissionSubmissions)
    .innerJoin(schools, eq(admissionSubmissions.schoolId, schools.id))
    .where(eq(admissionSubmissions.userId, userId))
    .orderBy(desc(admissionSubmissions.createdAt));
}

const SCHOOL_SUBMISSIONS_PAGE_SIZE = 20;

async function fetchSubmissionStatsForSchool(schoolId: string) {
  const db = getDb();

  const [stats] = await db
    .select({
      totalCount: sql<number>`count(*)::int`,
      acceptedCount: sql<number>`count(case when ${admissionSubmissions.decision} = 'accepted' then 1 end)::int`,
      rejectedCount: sql<number>`count(case when ${admissionSubmissions.decision} = 'rejected' then 1 end)::int`,
      waitlistedCount: sql<number>`count(case when ${admissionSubmissions.decision} = 'waitlisted' then 1 end)::int`,
      deferredCount: sql<number>`count(case when ${admissionSubmissions.decision} = 'deferred' then 1 end)::int`,
      avgGpaUnweighted: sql<number>`round(avg(${admissionSubmissions.gpaUnweighted}::numeric), 2)`,
      avgSatScore: sql<number>`round(avg(${admissionSubmissions.satScore}))`,
      avgActScore: sql<number>`round(avg(${admissionSubmissions.actScore}))`,
      minSatScore: sql<number>`min(${admissionSubmissions.satScore})`,
      maxSatScore: sql<number>`max(${admissionSubmissions.satScore})`,
      minGpaUnweighted: sql<number>`round(min(${admissionSubmissions.gpaUnweighted}::numeric), 2)`,
      maxGpaUnweighted: sql<number>`round(max(${admissionSubmissions.gpaUnweighted}::numeric), 2)`,
    })
    .from(admissionSubmissions)
    .where(
      and(
        eq(admissionSubmissions.schoolId, schoolId),
        visibleSubmissionCondition()
      )
    );

  return stats;
}

export const getSubmissionStatsForSchool = (schoolId: string) =>
  unstable_cache(
    () => fetchSubmissionStatsForSchool(schoolId),
    [`school-submission-stats-${schoolId}`],
    { revalidate: 1800, tags: [`school-submissions-${schoolId}`] }
  )();

async function fetchSubmissionsForSchool(schoolId: string, page: number = 1) {
  const db = getDb();
  const offset = (page - 1) * SCHOOL_SUBMISSIONS_PAGE_SIZE;

  return db
    .select({
      id: admissionSubmissions.id,
      userId: admissionSubmissions.userId,
      dataSource: admissionSubmissions.dataSource,
      decision: admissionSubmissions.decision,
      applicationRound: admissionSubmissions.applicationRound,
      admissionCycle: admissionSubmissions.admissionCycle,
      gpaUnweighted: admissionSubmissions.gpaUnweighted,
      gpaWeighted: admissionSubmissions.gpaWeighted,
      satScore: admissionSubmissions.satScore,
      actScore: admissionSubmissions.actScore,
      intendedMajor: admissionSubmissions.intendedMajor,
      stateOfResidence: admissionSubmissions.stateOfResidence,
      extracurriculars: admissionSubmissions.extracurriculars,
      highSchoolType: admissionSubmissions.highSchoolType,
      firstGeneration: admissionSubmissions.firstGeneration,
      legacyStatus: admissionSubmissions.legacyStatus,
      financialAidApplied: admissionSubmissions.financialAidApplied,
      geographicClassification: admissionSubmissions.geographicClassification,
      apCoursesCount: admissionSubmissions.apCoursesCount,
      ibCoursesCount: admissionSubmissions.ibCoursesCount,
      honorsCoursesCount: admissionSubmissions.honorsCoursesCount,
      scholarshipOffered: admissionSubmissions.scholarshipOffered,
      willAttend: admissionSubmissions.willAttend,
      waitlistOutcome: admissionSubmissions.waitlistOutcome,
      verificationTier: admissionSubmissions.verificationTier,
      createdAt: admissionSubmissions.createdAt,
    })
    .from(admissionSubmissions)
    .where(
      and(
        eq(admissionSubmissions.schoolId, schoolId),
        visibleSubmissionCondition()
      )
    )
    .orderBy(desc(admissionSubmissions.createdAt))
    .limit(SCHOOL_SUBMISSIONS_PAGE_SIZE)
    .offset(offset);
}

export const getSubmissionsForSchool = (schoolId: string, page: number = 1) =>
  unstable_cache(
    () => fetchSubmissionsForSchool(schoolId, page),
    [`school-submissions-${schoolId}-page-${page}`],
    { revalidate: 1800, tags: [`school-submissions-${schoolId}`] }
  )();

const cardSubmissionFields = {
  id: admissionSubmissions.id,
  decision: admissionSubmissions.decision,
  applicationRound: admissionSubmissions.applicationRound,
  admissionCycle: admissionSubmissions.admissionCycle,
  intendedMajor: admissionSubmissions.intendedMajor,
  verificationTier: admissionSubmissions.verificationTier,
  schoolName: schools.name,
  schoolState: schools.state,
  schoolCity: schools.city,
  schoolWebsite: schools.website,
} as const;

async function fetchVisibleSubmissionById(submissionId: string) {
  const db = getDb();

  const [submission] = await db
    .select(cardSubmissionFields)
    .from(admissionSubmissions)
    .innerJoin(schools, eq(admissionSubmissions.schoolId, schools.id))
    .where(
      and(
        eq(admissionSubmissions.id, submissionId),
        visibleSubmissionCondition()
      )
    )
    .limit(1);

  return submission ?? null;
}

export const getVisibleSubmissionById = (submissionId: string) =>
  unstable_cache(
    () => fetchVisibleSubmissionById(submissionId),
    [`submission-card-${submissionId}`],
    { revalidate: 1800, tags: [`submission-card-${submissionId}`] }
  )();
