import { eq, and, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { admissionSubmissions, submissionFlags } from "@/lib/db/schema";

const AUTO_HIDE_THRESHOLD = 3;

/**
 * Creates a flag on a submission, increments the submission's flagCount,
 * and auto-hides the submission if flagCount reaches the threshold.
 * Uses a transaction for atomicity.
 * Returns the updated flag count.
 */
export async function createFlag(
  submissionId: string,
  userId: string,
  reason: string
): Promise<{ flagCount: number; submissionStatus: string }> {
  const db = getDb();

  return db.transaction(async (tx) => {
    await tx.insert(submissionFlags).values({
      submissionId,
      flaggedByUserId: userId,
      reason,
    });

    const [updated] = await tx
      .update(admissionSubmissions)
      .set({
        flagCount: sql`${admissionSubmissions.flagCount} + 1`,
        updatedAt: sql`now()`,
      })
      .where(eq(admissionSubmissions.id, submissionId))
      .returning({
        flagCount: admissionSubmissions.flagCount,
        submissionStatus: admissionSubmissions.submissionStatus,
      });

    if (updated.flagCount >= AUTO_HIDE_THRESHOLD && updated.submissionStatus !== "flagged") {
      const [flagged] = await tx
        .update(admissionSubmissions)
        .set({
          submissionStatus: "flagged",
          updatedAt: sql`now()`,
        })
        .where(eq(admissionSubmissions.id, submissionId))
        .returning({
          flagCount: admissionSubmissions.flagCount,
          submissionStatus: admissionSubmissions.submissionStatus,
        });

      return { flagCount: flagged.flagCount, submissionStatus: flagged.submissionStatus };
    }

    return { flagCount: updated.flagCount, submissionStatus: updated.submissionStatus };
  });
}

/**
 * Checks whether a user has already flagged a specific submission.
 */
export async function hasUserFlaggedSubmission(
  submissionId: string,
  userId: string
): Promise<boolean> {
  const db = getDb();

  const [existing] = await db
    .select({ id: submissionFlags.id })
    .from(submissionFlags)
    .where(
      and(
        eq(submissionFlags.submissionId, submissionId),
        eq(submissionFlags.flaggedByUserId, userId)
      )
    )
    .limit(1);

  return !!existing;
}

/**
 * Checks whether the given user owns the submission.
 * Users cannot flag their own submissions.
 */
export async function isOwnSubmission(
  submissionId: string,
  userId: string
): Promise<boolean> {
  const db = getDb();

  const [submission] = await db
    .select({ userId: admissionSubmissions.userId })
    .from(admissionSubmissions)
    .where(eq(admissionSubmissions.id, submissionId))
    .limit(1);

  if (!submission) return false;

  return submission.userId === userId;
}
