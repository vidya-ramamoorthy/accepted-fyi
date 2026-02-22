import { eq, and, desc } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { decisionTimelines } from "@/lib/db/schema";

export async function getTimelinesForSchool(schoolId: string) {
  const db = getDb();
  return db
    .select()
    .from(decisionTimelines)
    .where(eq(decisionTimelines.schoolId, schoolId))
    .orderBy(desc(decisionTimelines.admissionCycle), decisionTimelines.applicationRound);
}

export async function getTimelinesForSchoolAndCycle(schoolId: string, admissionCycle: string) {
  const db = getDb();
  return db
    .select()
    .from(decisionTimelines)
    .where(
      and(
        eq(decisionTimelines.schoolId, schoolId),
        eq(decisionTimelines.admissionCycle, admissionCycle)
      )
    )
    .orderBy(decisionTimelines.applicationRound);
}
