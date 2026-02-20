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
});
