import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import {
  getSubmissionOwnership,
  updateWaitlistOutcome,
} from "@/lib/db/queries/submissions";
import { findOrCreateUser } from "@/lib/db/queries/users";
import { extractUserProfileData } from "@/lib/utils/auth-helpers";
import { isValidWaitlistOutcome } from "@/lib/validations/submission";
import { submissionRateLimiter } from "@/lib/ratelimit";
import { logger } from "@/lib/logger";
import {
  createApiHandler,
  withAuth,
  withRateLimit,
  withJsonBody,
  withRequestLogging,
} from "@/lib/api-middleware";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const PATCH = createApiHandler(
  withRequestLogging(),
  withAuth,
  withRateLimit(submissionRateLimiter),
  withJsonBody({ maxSize: 4 * 1024 }),
  async (ctx) => {
    const body = ctx.body!;
    const outcome = body.waitlistOutcome;

    if (!isValidWaitlistOutcome(outcome)) {
      return NextResponse.json(
        { error: "Invalid or missing waitlistOutcome" },
        { status: 400 },
      );
    }

    const urlParts = ctx.request.nextUrl.pathname.split("/");
    const submissionId = urlParts[3];

    if (!submissionId || !UUID_REGEX.test(submissionId)) {
      return NextResponse.json(
        { error: "Invalid submission ID" },
        { status: 400 },
      );
    }

    try {
      const userProfile = await findOrCreateUser(extractUserProfileData(ctx.user!));

      const ownership = await getSubmissionOwnership(submissionId);
      if (!ownership) {
        return NextResponse.json({ error: "Submission not found" }, { status: 404 });
      }

      if (ownership.userId !== userProfile.id) {
        return NextResponse.json(
          { error: "You can only update your own submissions" },
          { status: 403 },
        );
      }

      if (ownership.decision !== "waitlisted") {
        return NextResponse.json(
          { error: "Outcome can only be updated on waitlisted submissions" },
          { status: 422 },
        );
      }

      const updated = await updateWaitlistOutcome(submissionId, userProfile.id, outcome);
      if (!updated) {
        return NextResponse.json(
          { error: "Update failed" },
          { status: 500 },
        );
      }

      revalidateTag(`school-submissions-${updated.schoolId}`, { expire: 0 });
      revalidateTag(`submission-card-${submissionId}`, { expire: 0 });
      revalidateTag("chances-profiles", { expire: 0 });

      logger.info("submission.outcome_updated", {
        submissionId,
        userId: userProfile.id,
        outcome,
      });

      return NextResponse.json({ submission: updated }, { status: 200 });
    } catch (error) {
      logger.error("submission.outcome_update_failed", { submissionId, error });
      return NextResponse.json(
        { error: "Failed to update submission. Please try again." },
        { status: 500 },
      );
    }
  },
);
