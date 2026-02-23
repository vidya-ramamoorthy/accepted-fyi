import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the database module
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockSelect = vi.fn();
const mockTransaction = vi.fn();

vi.mock("@/lib/db", () => ({
  getDb: () => ({
    insert: mockInsert,
    update: mockUpdate,
    select: mockSelect,
    transaction: mockTransaction,
  }),
}));

vi.mock("@/lib/db/schema", () => ({
  admissionSubmissions: {
    id: "id",
    userId: "user_id",
    flagCount: "flag_count",
    submissionStatus: "submission_status",
    updatedAt: "updated_at",
  },
  submissionFlags: {
    id: "id",
    submissionId: "submission_id",
    flaggedByUserId: "flagged_by_user_id",
    reason: "reason",
  },
}));

import { createFlag, hasUserFlaggedSubmission, isOwnSubmission } from "@/lib/db/queries/flags";

describe("hasUserFlaggedSubmission", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return true when user has already flagged the submission", async () => {
    const mockLimit = vi.fn().mockResolvedValue([{ id: "flag-1" }]);
    const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
    const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
    mockSelect.mockReturnValue({ from: mockFrom });

    const result = await hasUserFlaggedSubmission("submission-1", "user-1");

    expect(result).toBe(true);
    expect(mockSelect).toHaveBeenCalled();
  });

  it("should return false when user has not flagged the submission", async () => {
    const mockLimit = vi.fn().mockResolvedValue([]);
    const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
    const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
    mockSelect.mockReturnValue({ from: mockFrom });

    const result = await hasUserFlaggedSubmission("submission-1", "user-1");

    expect(result).toBe(false);
  });
});

describe("isOwnSubmission", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return true when user owns the submission", async () => {
    const mockLimit = vi.fn().mockResolvedValue([{ userId: "user-1" }]);
    const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
    const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
    mockSelect.mockReturnValue({ from: mockFrom });

    const result = await isOwnSubmission("submission-1", "user-1");

    expect(result).toBe(true);
  });

  it("should return false when user does not own the submission", async () => {
    const mockLimit = vi.fn().mockResolvedValue([{ userId: "other-user" }]);
    const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
    const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
    mockSelect.mockReturnValue({ from: mockFrom });

    const result = await isOwnSubmission("submission-1", "user-1");

    expect(result).toBe(false);
  });

  it("should return false when submission does not exist", async () => {
    const mockLimit = vi.fn().mockResolvedValue([]);
    const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
    const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
    mockSelect.mockReturnValue({ from: mockFrom });

    const result = await isOwnSubmission("nonexistent", "user-1");

    expect(result).toBe(false);
  });
});

describe("createFlag", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should increment flagCount and return updated count", async () => {
    mockTransaction.mockImplementation(async (callback: Function) => {
      const tx = {
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockResolvedValue(undefined),
        }),
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([
                { flagCount: 1, submissionStatus: "visible" },
              ]),
            }),
          }),
        }),
      };
      return callback(tx);
    });

    const result = await createFlag("submission-1", "user-1", "Inaccurate data");

    expect(result.flagCount).toBe(1);
    expect(result.submissionStatus).toBe("visible");
    expect(mockTransaction).toHaveBeenCalledOnce();
  });

  it("should auto-hide submission when flagCount reaches threshold of 3", async () => {
    mockTransaction.mockImplementation(async (callback: Function) => {
      let updateCallCount = 0;
      const tx = {
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockResolvedValue(undefined),
        }),
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              returning: vi.fn().mockImplementation(() => {
                updateCallCount++;
                if (updateCallCount === 1) {
                  // First update: increment flagCount
                  return [{ flagCount: 3, submissionStatus: "visible" }];
                }
                // Second update: set status to flagged
                return [{ flagCount: 3, submissionStatus: "flagged" }];
              }),
            }),
          }),
        }),
      };
      return callback(tx);
    });

    const result = await createFlag("submission-1", "user-3", "Spam/fake submission");

    expect(result.flagCount).toBe(3);
    expect(result.submissionStatus).toBe("flagged");
  });

  it("should not re-flag if submission is already flagged", async () => {
    mockTransaction.mockImplementation(async (callback: Function) => {
      const tx = {
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockResolvedValue(undefined),
        }),
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([
                { flagCount: 4, submissionStatus: "flagged" },
              ]),
            }),
          }),
        }),
      };
      return callback(tx);
    });

    const result = await createFlag("submission-1", "user-4", "Duplicate entry");

    // Should return without trying to update status again since it's already flagged
    expect(result.flagCount).toBe(4);
    expect(result.submissionStatus).toBe("flagged");
  });
});
