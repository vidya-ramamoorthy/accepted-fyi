import { eq, and, ilike, gte, lte, sql, desc } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { admissionSubmissions, schools } from "@/lib/db/schema";
import { escapeLikePattern } from "@/lib/utils/escape-like";
import type { AdmissionDecision } from "@/types/database";

const MAX_PAGE_SIZE = 100;

const submissionWithSchoolFields = {
  id: admissionSubmissions.id,
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
      submissionStatus: "pending_review",
    })
    .returning();

  return submission;
}

export async function getSubmissionsWithSchool(filters: SubmissionFilters = {}) {
  const db = getDb();
  const pageSize = Math.min(Math.max(1, filters.pageSize ?? 20), MAX_PAGE_SIZE);
  const page = Math.max(1, filters.page ?? 1);
  const offset = (page - 1) * pageSize;

  const conditions = [eq(admissionSubmissions.submissionStatus, "visible")];

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

export async function getSubmissionsForSchool(schoolId: string) {
  const db = getDb();

  return db
    .select({
      id: admissionSubmissions.id,
      decision: admissionSubmissions.decision,
      applicationRound: admissionSubmissions.applicationRound,
      admissionCycle: admissionSubmissions.admissionCycle,
      gpaUnweighted: admissionSubmissions.gpaUnweighted,
      gpaWeighted: admissionSubmissions.gpaWeighted,
      satScore: admissionSubmissions.satScore,
      actScore: admissionSubmissions.actScore,
      intendedMajor: admissionSubmissions.intendedMajor,
      stateOfResidence: admissionSubmissions.stateOfResidence,
      verificationTier: admissionSubmissions.verificationTier,
      createdAt: admissionSubmissions.createdAt,
    })
    .from(admissionSubmissions)
    .where(
      and(
        eq(admissionSubmissions.schoolId, schoolId),
        eq(admissionSubmissions.submissionStatus, "visible")
      )
    )
    .orderBy(desc(admissionSubmissions.createdAt));
}
