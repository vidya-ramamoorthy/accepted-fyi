import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/server", () => {
  class MockNextRequest {
    public headers: Map<string, string>;
    public method: string;
    public url: string;
    public nextUrl: { pathname: string; searchParams: URLSearchParams };
    private bodyContent: string | null;

    constructor(url: string, options?: { method?: string; headers?: Record<string, string>; body?: string }) {
      this.url = url;
      this.method = options?.method ?? "GET";
      this.headers = new Map(Object.entries(options?.headers ?? {}));
      const parsed = new URL(url);
      this.nextUrl = { pathname: parsed.pathname, searchParams: parsed.searchParams };
      this.bodyContent = options?.body ?? null;
    }

    async json() {
      if (!this.bodyContent) throw new Error("No body");
      return JSON.parse(this.bodyContent);
    }
  }

  return {
    NextRequest: MockNextRequest,
    NextResponse: {
      json: (body: unknown, init?: { status?: number; headers?: Record<string, string> }) => ({
        body,
        status: init?.status ?? 200,
        headers: new Map(Object.entries(init?.headers ?? {})),
        async json() {
          return body;
        },
      }),
    },
  };
});

vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

vi.mock("@/lib/ratelimit", () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ allowed: true }),
  getClientIp: vi.fn().mockReturnValue("127.0.0.1"),
  submissionRateLimiter: null,
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/lib/db/queries/submissions", () => ({
  getSubmissionOwnership: vi.fn(),
  updateWaitlistOutcome: vi.fn(),
}));

vi.mock("@/lib/db/queries/users", () => ({
  findOrCreateUser: vi.fn(),
}));

vi.mock("@/lib/utils/auth-helpers", () => ({
  extractUserProfileData: vi.fn().mockReturnValue({
    authUserId: "auth-user-1",
    email: "test@test.com",
    displayName: "Test User",
  }),
}));

import { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getSubmissionOwnership,
  updateWaitlistOutcome,
} from "@/lib/db/queries/submissions";
import { findOrCreateUser } from "@/lib/db/queries/users";

const VALID_SUBMISSION_ID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

function setupAuthenticatedUser(profileId: string = "profile-user-1") {
  const mockUser = { id: "auth-user-1", email: "test@test.com" };
  vi.mocked(createSupabaseServerClient).mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
    },
  } as never);

  vi.mocked(findOrCreateUser).mockResolvedValue({
    id: profileId,
    authUserId: "auth-user-1",
    email: "test@test.com",
    displayName: "Test User",
    hasSubmitted: true,
    verificationTier: "bronze",
    eduEmail: null,
    eduEmailVerified: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as never);
}

function buildPatchRequest(submissionId: string, body: unknown) {
  return new NextRequest(`http://localhost/api/submissions/${submissionId}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("PATCH /api/submissions/[id] — waitlist outcome update", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      },
    } as never);

    const { PATCH } = await import("@/app/api/submissions/[id]/route");

    const response = await PATCH(
      buildPatchRequest(VALID_SUBMISSION_ID, { waitlistOutcome: "accepted_off_waitlist" })
    );

    expect(response.status).toBe(401);
  });

  it("returns 400 when submission ID is not a UUID", async () => {
    setupAuthenticatedUser();

    const { PATCH } = await import("@/app/api/submissions/[id]/route");

    const response = await PATCH(
      buildPatchRequest("not-a-uuid", { waitlistOutcome: "accepted_off_waitlist" })
    );

    expect(response.status).toBe(400);
  });

  it("returns 400 when waitlistOutcome is missing", async () => {
    setupAuthenticatedUser();

    const { PATCH } = await import("@/app/api/submissions/[id]/route");

    const response = await PATCH(buildPatchRequest(VALID_SUBMISSION_ID, {}));

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toContain("waitlistOutcome");
  });

  it("returns 400 when waitlistOutcome is invalid", async () => {
    setupAuthenticatedUser();

    const { PATCH } = await import("@/app/api/submissions/[id]/route");

    const response = await PATCH(
      buildPatchRequest(VALID_SUBMISSION_ID, { waitlistOutcome: "made_up_outcome" })
    );

    expect(response.status).toBe(400);
  });

  it("returns 404 when submission does not exist", async () => {
    setupAuthenticatedUser();
    vi.mocked(getSubmissionOwnership).mockResolvedValue(null);

    const { PATCH } = await import("@/app/api/submissions/[id]/route");

    const response = await PATCH(
      buildPatchRequest(VALID_SUBMISSION_ID, { waitlistOutcome: "accepted_off_waitlist" })
    );

    expect(response.status).toBe(404);
  });

  it("returns 403 when submission belongs to another user", async () => {
    setupAuthenticatedUser("profile-user-1");
    vi.mocked(getSubmissionOwnership).mockResolvedValue({
      userId: "profile-user-2",
      decision: "waitlisted",
    });

    const { PATCH } = await import("@/app/api/submissions/[id]/route");

    const response = await PATCH(
      buildPatchRequest(VALID_SUBMISSION_ID, { waitlistOutcome: "accepted_off_waitlist" })
    );

    expect(response.status).toBe(403);
  });

  it("returns 422 when submission decision is not waitlisted", async () => {
    setupAuthenticatedUser("profile-user-1");
    vi.mocked(getSubmissionOwnership).mockResolvedValue({
      userId: "profile-user-1",
      decision: "accepted",
    });

    const { PATCH } = await import("@/app/api/submissions/[id]/route");

    const response = await PATCH(
      buildPatchRequest(VALID_SUBMISSION_ID, { waitlistOutcome: "accepted_off_waitlist" })
    );

    expect(response.status).toBe(422);
    const body = await response.json();
    expect(body.error).toContain("waitlisted");
  });

  it("returns 200 and updates outcome on success", async () => {
    setupAuthenticatedUser("profile-user-1");
    vi.mocked(getSubmissionOwnership).mockResolvedValue({
      userId: "profile-user-1",
      decision: "waitlisted",
    });
    vi.mocked(updateWaitlistOutcome).mockResolvedValue({
      id: VALID_SUBMISSION_ID,
      waitlistOutcome: "accepted_off_waitlist",
      schoolId: "school-1",
    });

    const { PATCH } = await import("@/app/api/submissions/[id]/route");

    const response = await PATCH(
      buildPatchRequest(VALID_SUBMISSION_ID, { waitlistOutcome: "accepted_off_waitlist" })
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.submission.waitlistOutcome).toBe("accepted_off_waitlist");
    expect(updateWaitlistOutcome).toHaveBeenCalledWith(
      VALID_SUBMISSION_ID,
      "profile-user-1",
      "accepted_off_waitlist"
    );
  });

  it.each(["accepted_off_waitlist", "rejected_off_waitlist", "withdrew"] as const)(
    "accepts %s as a valid outcome",
    async (outcome) => {
      setupAuthenticatedUser("profile-user-1");
      vi.mocked(getSubmissionOwnership).mockResolvedValue({
        userId: "profile-user-1",
        decision: "waitlisted",
      });
      vi.mocked(updateWaitlistOutcome).mockResolvedValue({
        id: VALID_SUBMISSION_ID,
        waitlistOutcome: outcome,
        schoolId: "school-1",
      });

      const { PATCH } = await import("@/app/api/submissions/[id]/route");

      const response = await PATCH(
        buildPatchRequest(VALID_SUBMISSION_ID, { waitlistOutcome: outcome })
      );

      expect(response.status).toBe(200);
    }
  );
});
