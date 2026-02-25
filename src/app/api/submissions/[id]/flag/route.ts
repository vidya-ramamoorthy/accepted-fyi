import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { createFlag, hasUserFlaggedSubmission, isOwnSubmission } from "@/lib/db/queries/flags";
import { findOrCreateUser } from "@/lib/db/queries/users";
import { extractUserProfileData } from "@/lib/utils/auth-helpers";
import { flagRateLimiter } from "@/lib/ratelimit";
import { logger } from "@/lib/logger";
import {
  createApiHandler,
  withAuth,
  withRateLimit,
  withJsonBody,
  withRequestLogging,
} from "@/lib/api-middleware";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_REASON_LENGTH = 500;

export const POST = createApiHandler(
  withRequestLogging(),
  withAuth,
  withRateLimit(flagRateLimiter),
  withJsonBody({ maxSize: 4 * 1024 }),
  async (ctx) => {
    const body = ctx.body!;

    // Validate reason
    const reason = body.reason;
    if (typeof reason !== "string" || reason.trim().length === 0) {
      return NextResponse.json(
        { error: "Reason is required" },
        { status: 400 }
      );
    }
    if (reason.length > MAX_REASON_LENGTH) {
      return NextResponse.json(
        { error: `Reason must be ${MAX_REASON_LENGTH} characters or fewer` },
        { status: 400 }
      );
    }

    // Extract submission ID from the URL path
    const urlParts = ctx.request.nextUrl.pathname.split("/");
    // Path: /api/submissions/[id]/flag → parts: ["", "api", "submissions", id, "flag"]
    const submissionId = urlParts[3];

    if (!submissionId || !UUID_REGEX.test(submissionId)) {
      return NextResponse.json(
        { error: "Invalid submission ID" },
        { status: 400 }
      );
    }

    try {
      const userProfile = await findOrCreateUser(extractUserProfileData(ctx.user!));

      // Check if user is flagging their own submission
      const ownsSubmission = await isOwnSubmission(submissionId, userProfile.id);
      if (ownsSubmission) {
        return NextResponse.json(
          { error: "You cannot flag your own submission" },
          { status: 403 }
        );
      }

      // Check if user already flagged this submission
      const alreadyFlagged = await hasUserFlaggedSubmission(submissionId, userProfile.id);
      if (alreadyFlagged) {
        return NextResponse.json(
          { error: "You have already flagged this submission" },
          { status: 409 }
        );
      }

      const result = await createFlag(submissionId, userProfile.id, reason.trim());

      logger.info("submission.flagged", {
        submissionId,
        userId: userProfile.id,
        flagCount: result.flagCount,
        autoHidden: result.submissionStatus === "flagged",
      });

      // Revalidate caches so flagged submissions are hidden from listings
      revalidateTag("chances-profiles", { expire: 0 });
      revalidateTag(`submission-card-${submissionId}`, { expire: 0 });
      revalidateTag("multi-school-stats", { expire: 0 });
      revalidateTag("per-school-stats", { expire: 0 });

      return NextResponse.json(
        { flagCount: result.flagCount, status: result.submissionStatus },
        { status: 201 }
      );
    } catch (error) {
      logger.error("submission.flag_failed", { submissionId, error });
      return NextResponse.json(
        { error: "Failed to flag submission. Please try again." },
        { status: 500 }
      );
    }
  }
);
