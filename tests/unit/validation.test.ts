import { describe, it, expect } from "vitest";
import { validateSubmission } from "@/lib/validations/submission";

describe("validateSubmission", () => {
  const validInput = {
    schoolName: "Stanford University",
    decision: "accepted",
    applicationRound: "regular",
    admissionCycle: "2025-2026",
    stateOfResidence: "CA",
    gpaUnweighted: "3.85",
    gpaWeighted: "4.32",
    satScore: "1520",
    actScore: "34",
    intendedMajor: "Computer Science",
    extracurriculars: ["Debate Team", "Math Olympiad"],
  };

  it("should accept valid complete input", () => {
    const result = validateSubmission(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.schoolName).toBe("Stanford University");
      expect(result.data.decision).toBe("accepted");
      expect(result.data.gpaUnweighted).toBe(3.85);
      expect(result.data.satScore).toBe(1520);
    }
  });

  it("should accept minimal valid input", () => {
    const result = validateSubmission({
      schoolName: "MIT",
      decision: "rejected",
      applicationRound: "early_action",
      admissionCycle: "2024-2025",
      stateOfResidence: "MA",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.gpaUnweighted).toBeNull();
      expect(result.data.satScore).toBeNull();
      expect(result.data.intendedMajor).toBeNull();
      expect(result.data.extracurriculars).toEqual([]);
    }
  });

  it("should reject empty school name", () => {
    const result = validateSubmission({ ...validInput, schoolName: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.some((error) => error.field === "schoolName")).toBe(true);
    }
  });

  it("should reject school name that is too short", () => {
    const result = validateSubmission({ ...validInput, schoolName: "A" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.some((error) => error.field === "schoolName")).toBe(true);
    }
  });

  it("should reject invalid decision value", () => {
    const result = validateSubmission({ ...validInput, decision: "maybe" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.some((error) => error.field === "decision")).toBe(true);
    }
  });

  it("should reject invalid application round", () => {
    const result = validateSubmission({ ...validInput, applicationRound: "spring" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.some((error) => error.field === "applicationRound")).toBe(true);
    }
  });

  it("should reject invalid admission cycle format", () => {
    const result = validateSubmission({ ...validInput, admissionCycle: "2025" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.some((error) => error.field === "admissionCycle")).toBe(true);
    }
  });

  it("should reject invalid state code", () => {
    const result = validateSubmission({ ...validInput, stateOfResidence: "California" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.some((error) => error.field === "stateOfResidence")).toBe(true);
    }
  });

  it("should uppercase state codes", () => {
    const result = validateSubmission({ ...validInput, stateOfResidence: "ca" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.stateOfResidence).toBe("CA");
    }
  });

  it("should reject GPA above 4.0 unweighted", () => {
    const result = validateSubmission({ ...validInput, gpaUnweighted: "4.5" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.some((error) => error.field === "gpaUnweighted")).toBe(true);
    }
  });

  it("should reject GPA above 5.0 weighted", () => {
    const result = validateSubmission({ ...validInput, gpaWeighted: "5.5" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.some((error) => error.field === "gpaWeighted")).toBe(true);
    }
  });

  it("should reject SAT score below 400", () => {
    const result = validateSubmission({ ...validInput, satScore: "300" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.some((error) => error.field === "satScore")).toBe(true);
    }
  });

  it("should reject SAT score above 1600", () => {
    const result = validateSubmission({ ...validInput, satScore: "1700" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.some((error) => error.field === "satScore")).toBe(true);
    }
  });

  it("should reject ACT score below 1", () => {
    const result = validateSubmission({ ...validInput, actScore: "0" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.some((error) => error.field === "actScore")).toBe(true);
    }
  });

  it("should reject ACT score above 36", () => {
    const result = validateSubmission({ ...validInput, actScore: "37" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.some((error) => error.field === "actScore")).toBe(true);
    }
  });

  it("should trim and filter empty extracurriculars", () => {
    const result = validateSubmission({
      ...validInput,
      extracurriculars: ["  Debate  ", "", "  ", "Math Club"],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.extracurriculars).toEqual(["Debate", "Math Club"]);
    }
  });

  it("should return multiple errors for multiple invalid fields", () => {
    const result = validateSubmission({
      schoolName: "",
      decision: "maybe",
      applicationRound: "spring",
      admissionCycle: "2025",
      stateOfResidence: "California",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.length).toBeGreaterThanOrEqual(4);
    }
  });

  it("should accept all valid decision values", () => {
    const decisions = ["accepted", "rejected", "waitlisted", "deferred"];
    for (const decisionValue of decisions) {
      const result = validateSubmission({ ...validInput, decision: decisionValue });
      expect(result.success).toBe(true);
    }
  });

  it("should accept all valid application rounds", () => {
    const rounds = ["early_decision", "early_action", "regular", "rolling"];
    for (const round of rounds) {
      const result = validateSubmission({ ...validInput, applicationRound: round });
      expect(result.success).toBe(true);
    }
  });

  it("should accept valid high school types", () => {
    const types = ["public", "private", "charter", "magnet", "homeschool", "international"];
    for (const hsType of types) {
      const result = validateSubmission({ ...validInput, highSchoolType: hsType });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.highSchoolType).toBe(hsType);
      }
    }
  });

  it("should reject invalid high school type", () => {
    const result = validateSubmission({ ...validInput, highSchoolType: "boarding" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.some((error) => error.field === "highSchoolType")).toBe(true);
    }
  });

  it("should accept boolean values for firstGeneration, legacyStatus, financialAidApplied", () => {
    const result = validateSubmission({
      ...validInput,
      firstGeneration: true,
      legacyStatus: false,
      financialAidApplied: true,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.firstGeneration).toBe(true);
      expect(result.data.legacyStatus).toBe(false);
      expect(result.data.financialAidApplied).toBe(true);
    }
  });

  it("should default boolean fields to null when not provided", () => {
    const result = validateSubmission(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.firstGeneration).toBeNull();
      expect(result.data.legacyStatus).toBeNull();
      expect(result.data.financialAidApplied).toBeNull();
    }
  });

  it("should accept valid geographic classifications", () => {
    for (const geo of ["rural", "suburban", "urban"]) {
      const result = validateSubmission({ ...validInput, geographicClassification: geo });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.geographicClassification).toBe(geo);
      }
    }
  });

  it("should reject invalid geographic classification", () => {
    const result = validateSubmission({ ...validInput, geographicClassification: "metro" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.some((error) => error.field === "geographicClassification")).toBe(true);
    }
  });

  it("should accept valid AP courses count", () => {
    const result = validateSubmission({ ...validInput, apCoursesCount: "12" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.apCoursesCount).toBe(12);
    }
  });

  it("should reject AP courses count above 30", () => {
    const result = validateSubmission({ ...validInput, apCoursesCount: "31" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.some((error) => error.field === "apCoursesCount")).toBe(true);
    }
  });

  it("should accept valid IB courses count", () => {
    const result = validateSubmission({ ...validInput, ibCoursesCount: "6" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.ibCoursesCount).toBe(6);
    }
  });

  it("should reject IB courses count above 30", () => {
    const result = validateSubmission({ ...validInput, ibCoursesCount: "31" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.some((error) => error.field === "ibCoursesCount")).toBe(true);
    }
  });

  it("should accept valid Honors courses count", () => {
    const result = validateSubmission({ ...validInput, honorsCoursesCount: "4" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.honorsCoursesCount).toBe(4);
    }
  });

  it("should reject Honors courses count above 30", () => {
    const result = validateSubmission({ ...validInput, honorsCoursesCount: "31" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.some((error) => error.field === "honorsCoursesCount")).toBe(true);
    }
  });

  it("should accept valid scholarship types", () => {
    for (const scholarship of ["none", "merit", "need_based", "both"]) {
      const result = validateSubmission({ ...validInput, scholarshipOffered: scholarship });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.scholarshipOffered).toBe(scholarship);
      }
    }
  });

  it("should accept valid attendance intents", () => {
    for (const intent of ["yes", "no", "undecided"]) {
      const result = validateSubmission({ ...validInput, willAttend: intent });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.willAttend).toBe(intent);
      }
    }
  });

  it("should accept valid waitlist outcomes", () => {
    for (const outcome of ["accepted_off_waitlist", "rejected_off_waitlist", "withdrew"]) {
      const result = validateSubmission({ ...validInput, waitlistOutcome: outcome });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.waitlistOutcome).toBe(outcome);
      }
    }
  });

  it("should reject invalid waitlist outcome", () => {
    const result = validateSubmission({ ...validInput, waitlistOutcome: "pending" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.some((error) => error.field === "waitlistOutcome")).toBe(true);
    }
  });

  it("should leave new optional fields as null when not provided", () => {
    const result = validateSubmission(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.highSchoolType).toBeNull();
      expect(result.data.geographicClassification).toBeNull();
      expect(result.data.apCoursesCount).toBeNull();
      expect(result.data.ibCoursesCount).toBeNull();
      expect(result.data.honorsCoursesCount).toBeNull();
      expect(result.data.scholarshipOffered).toBeNull();
      expect(result.data.willAttend).toBeNull();
      expect(result.data.waitlistOutcome).toBeNull();
    }
  });
});
