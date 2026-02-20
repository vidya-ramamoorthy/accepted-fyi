import { describe, it, expect } from "vitest";
import {
  admissionSubmissions,
  submissionStatusEnum,
  highSchoolTypeEnum,
  geographicClassificationEnum,
  scholarshipTypeEnum,
  attendanceIntentEnum,
  waitlistOutcomeEnum,
} from "@/lib/db/schema";

describe("Submission status configuration", () => {
  it("should have submissionStatus column defined in schema", () => {
    const columns = Object.keys(admissionSubmissions);
    expect(columns).toContain("submissionStatus");
  });

  it("should have a schema-level default for submissionStatus", () => {
    // Schema defaults to 'pending_review' as a safety net.
    // The createSubmission function explicitly overrides this to 'visible'.
    const columnConfig = admissionSubmissions.submissionStatus;
    expect(columnConfig.hasDefault).toBe(true);
  });

  it("should define all valid submission statuses", () => {
    const expectedStatuses = ["pending_review", "visible", "hidden", "flagged"];
    expect(submissionStatusEnum.enumValues).toEqual(expectedStatuses);
  });

  it("should include 'visible' as a valid submission status", () => {
    // The createSubmission function sets submissionStatus to 'visible'
    // so submissions appear immediately. This test ensures 'visible'
    // remains a valid enum value.
    expect(submissionStatusEnum.enumValues).toContain("visible");
  });
});

describe("Submission schema completeness", () => {
  it("should include all required fields for a submission", () => {
    const requiredColumns = [
      "id",
      "userId",
      "schoolId",
      "admissionCycle",
      "decision",
      "applicationRound",
      "gpaUnweighted",
      "gpaWeighted",
      "satScore",
      "actScore",
      "intendedMajor",
      "stateOfResidence",
      "extracurriculars",
      "submissionStatus",
      "verificationTier",
      "flagCount",
      "createdAt",
      "highSchoolType",
      "firstGeneration",
      "legacyStatus",
      "financialAidApplied",
      "geographicClassification",
      "apCoursesCount",
      "scholarshipOffered",
      "willAttend",
      "waitlistOutcome",
    ];

    const actualColumns = Object.keys(admissionSubmissions);

    for (const column of requiredColumns) {
      expect(actualColumns).toContain(column);
    }
  });
});

describe("New enum definitions", () => {
  it("should define all high school types", () => {
    expect(highSchoolTypeEnum.enumValues).toEqual([
      "public", "private", "charter", "magnet", "homeschool", "international",
    ]);
  });

  it("should define all geographic classifications", () => {
    expect(geographicClassificationEnum.enumValues).toEqual([
      "rural", "suburban", "urban",
    ]);
  });

  it("should define all scholarship types", () => {
    expect(scholarshipTypeEnum.enumValues).toEqual([
      "none", "merit", "need_based", "both",
    ]);
  });

  it("should define all attendance intents", () => {
    expect(attendanceIntentEnum.enumValues).toEqual([
      "yes", "no", "undecided",
    ]);
  });

  it("should define all waitlist outcomes", () => {
    expect(waitlistOutcomeEnum.enumValues).toEqual([
      "accepted_off_waitlist", "rejected_off_waitlist", "withdrew",
    ]);
  });
});
