import { eq, and, gte, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { admissionSubmissions } from "@/lib/db/schema";

const MINIMUM_FORM_DURATION_MS = 3000;
const MAX_ACCEPTED_SCHOOLS_PER_CYCLE = 8;
const MAX_SUBMISSIONS_PER_DAY = 25;

export interface AbuseCheckResult {
  isSuspicious: boolean;
  reasons: string[];
}

/**
 * Validates the honeypot field — bots fill this invisible field, humans don't.
 * Returns true if the submission looks like a bot.
 */
export function isHoneypotFilled(honeypotValue: unknown): boolean {
  return typeof honeypotValue === "string" && honeypotValue.length > 0;
}

/**
 * Checks if the form was submitted too quickly to be human.
 * formLoadedAt is a client-side timestamp set when the component mounts.
 */
export function isSubmittedTooFast(formLoadedAt: unknown): boolean {
  if (typeof formLoadedAt !== "number") return true;

  const elapsedMs = Date.now() - formLoadedAt;
  return elapsedMs < MINIMUM_FORM_DURATION_MS;
}

/**
 * Runs cross-validation checks against the user's existing submission history.
 * Returns suspicious=true if patterns suggest fake or gaming behavior.
 * Does NOT block — only flags for delayed visibility.
 */
export async function detectSuspiciousSubmission(
  userId: string,
  decision: string,
  admissionCycle: string,
  gpaUnweighted: number | null,
  satScore: number | null,
): Promise<AbuseCheckResult> {
  const reasons: string[] = [];
  const db = getDb();

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // Check 1: Too many submissions in 24 hours (bulk bot behavior)
  const [recentCountResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(admissionSubmissions)
    .where(
      and(
        eq(admissionSubmissions.userId, userId),
        gte(admissionSubmissions.createdAt, oneDayAgo)
      )
    );

  const recentSubmissionCount = recentCountResult?.count ?? 0;
  if (recentSubmissionCount >= MAX_SUBMISSIONS_PER_DAY) {
    reasons.push(`High submission volume: ${recentSubmissionCount} in 24h`);
  }

  // Check 2: Too many acceptances in one cycle (statistically improbable)
  if (decision === "accepted") {
    const [acceptedCountResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(admissionSubmissions)
      .where(
        and(
          eq(admissionSubmissions.userId, userId),
          eq(admissionSubmissions.decision, "accepted"),
          eq(admissionSubmissions.admissionCycle, admissionCycle)
        )
      );

    const acceptedCount = acceptedCountResult?.count ?? 0;
    if (acceptedCount >= MAX_ACCEPTED_SCHOOLS_PER_CYCLE) {
      reasons.push(`${acceptedCount} acceptances in cycle ${admissionCycle}`);
    }
  }

  // Check 3: Implausible stat + outcome combinations
  const hasLowGpa = gpaUnweighted !== null && gpaUnweighted < 2.5;
  const hasLowSat = satScore !== null && satScore < 1000;
  const isAccepted = decision === "accepted";

  if (isAccepted && hasLowGpa && hasLowSat) {
    reasons.push("Accepted with GPA < 2.5 and SAT < 1000");
  }

  return {
    isSuspicious: reasons.length > 0,
    reasons,
  };
}
