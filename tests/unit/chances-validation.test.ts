import { describe, it, expect } from "vitest";
import { validateChancesInput } from "@/lib/validations/chances";

describe("validateChancesInput", () => {
  const validInput = {
    gpaUnweighted: "3.8",
    satScore: "1400",
    stateOfResidence: "CA",
  };

  // ─── Happy Path ───────────────────────────────────────────────────────────

  it("should accept valid input with GPA and SAT", () => {
    const result = validateChancesInput(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.gpaUnweighted).toBe(3.8);
      expect(result.data.satScore).toBe(1400);
      expect(result.data.stateOfResidence).toBe("CA");
    }
  });

  it("should accept valid input with only GPA", () => {
    const result = validateChancesInput({
      gpaUnweighted: "3.5",
      stateOfResidence: "NY",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.gpaUnweighted).toBe(3.5);
      expect(result.data.satScore).toBeNull();
      expect(result.data.actScore).toBeNull();
    }
  });

  it("should accept valid input with only SAT", () => {
    const result = validateChancesInput({
      satScore: "1500",
      stateOfResidence: "TX",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.satScore).toBe(1500);
      expect(result.data.gpaUnweighted).toBeNull();
    }
  });

  it("should accept valid input with only ACT", () => {
    const result = validateChancesInput({
      actScore: "34",
      stateOfResidence: "FL",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.actScore).toBe(34);
    }
  });

  it("should accept all optional fields", () => {
    const result = validateChancesInput({
      gpaUnweighted: "3.9",
      satScore: "1520",
      actScore: "35",
      stateOfResidence: "CA",
      intendedMajor: "Computer Science",
      apCoursesCount: "10",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.intendedMajor).toBe("Computer Science");
      expect(result.data.apCoursesCount).toBe(10);
    }
  });

  // ─── Required Fields ──────────────────────────────────────────────────────

  it("should require at least one of GPA, SAT, or ACT", () => {
    const result = validateChancesInput({
      stateOfResidence: "CA",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.some((e) => e.field === "stats")).toBe(true);
    }
  });

  it("should require state of residence", () => {
    const result = validateChancesInput({
      gpaUnweighted: "3.8",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.some((e) => e.field === "stateOfResidence")).toBe(true);
    }
  });

  // ─── GPA Validation ───────────────────────────────────────────────────────

  it("should reject GPA below 0", () => {
    const result = validateChancesInput({
      gpaUnweighted: "-0.5",
      stateOfResidence: "CA",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.some((e) => e.field === "gpaUnweighted")).toBe(true);
    }
  });

  it("should reject GPA above 4.0", () => {
    const result = validateChancesInput({
      gpaUnweighted: "4.5",
      stateOfResidence: "CA",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.some((e) => e.field === "gpaUnweighted")).toBe(true);
    }
  });

  it("should accept GPA boundary values 0.0 and 4.0", () => {
    const lowGpa = validateChancesInput({ gpaUnweighted: "0.0", stateOfResidence: "CA" });
    expect(lowGpa.success).toBe(true);

    const highGpa = validateChancesInput({ gpaUnweighted: "4.0", stateOfResidence: "CA" });
    expect(highGpa.success).toBe(true);
  });

  it("should reject non-numeric GPA", () => {
    const result = validateChancesInput({
      gpaUnweighted: "abc",
      stateOfResidence: "CA",
    });
    expect(result.success).toBe(false);
  });

  // ─── SAT Validation ───────────────────────────────────────────────────────

  it("should reject SAT below 400", () => {
    const result = validateChancesInput({
      satScore: "300",
      stateOfResidence: "CA",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.some((e) => e.field === "satScore")).toBe(true);
    }
  });

  it("should reject SAT above 1600", () => {
    const result = validateChancesInput({
      satScore: "1700",
      stateOfResidence: "CA",
    });
    expect(result.success).toBe(false);
  });

  it("should accept SAT boundary values 400 and 1600", () => {
    const lowSat = validateChancesInput({ satScore: "400", stateOfResidence: "CA" });
    expect(lowSat.success).toBe(true);

    const highSat = validateChancesInput({ satScore: "1600", stateOfResidence: "CA" });
    expect(highSat.success).toBe(true);
  });

  // ─── ACT Validation ───────────────────────────────────────────────────────

  it("should reject ACT below 1", () => {
    const result = validateChancesInput({
      actScore: "0",
      stateOfResidence: "CA",
    });
    expect(result.success).toBe(false);
  });

  it("should reject ACT above 36", () => {
    const result = validateChancesInput({
      actScore: "37",
      stateOfResidence: "CA",
    });
    expect(result.success).toBe(false);
  });

  it("should accept ACT boundary values 1 and 36", () => {
    const lowAct = validateChancesInput({ actScore: "1", stateOfResidence: "CA" });
    expect(lowAct.success).toBe(true);

    const highAct = validateChancesInput({ actScore: "36", stateOfResidence: "CA" });
    expect(highAct.success).toBe(true);
  });

  // ─── State Validation ─────────────────────────────────────────────────────

  it("should reject invalid state codes", () => {
    const result = validateChancesInput({
      gpaUnweighted: "3.8",
      stateOfResidence: "XY",
    });
    expect(result.success).toBe(false);
  });

  it("should uppercase state codes", () => {
    const result = validateChancesInput({
      gpaUnweighted: "3.8",
      stateOfResidence: "ca",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.stateOfResidence).toBe("CA");
    }
  });

  // ─── Optional Fields ──────────────────────────────────────────────────────

  it("should trim intended major and cap at 100 chars", () => {
    const result = validateChancesInput({
      gpaUnweighted: "3.8",
      stateOfResidence: "CA",
      intendedMajor: "  Computer Science  ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.intendedMajor).toBe("Computer Science");
    }
  });

  it("should reject intended major over 100 characters", () => {
    const result = validateChancesInput({
      gpaUnweighted: "3.8",
      stateOfResidence: "CA",
      intendedMajor: "A".repeat(101),
    });
    expect(result.success).toBe(false);
  });

  it("should reject AP courses count above 30", () => {
    const result = validateChancesInput({
      gpaUnweighted: "3.8",
      stateOfResidence: "CA",
      apCoursesCount: "31",
    });
    expect(result.success).toBe(false);
  });

  it("should reject negative AP courses count", () => {
    const result = validateChancesInput({
      gpaUnweighted: "3.8",
      stateOfResidence: "CA",
      apCoursesCount: "-1",
    });
    expect(result.success).toBe(false);
  });

  // ─── Admission Cycle Validation ─────────────────────────────────────────

  it("should accept valid admission cycle format", () => {
    const result = validateChancesInput({
      gpaUnweighted: "3.8",
      stateOfResidence: "CA",
      admissionCycle: "2024-2025",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.admissionCycle).toBe("2024-2025");
    }
  });

  it("should reject invalid admission cycle format", () => {
    const result = validateChancesInput({
      gpaUnweighted: "3.8",
      stateOfResidence: "CA",
      admissionCycle: "2024",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.some((e) => e.field === "admissionCycle")).toBe(true);
    }
  });

  it("should treat empty admission cycle as null (all cycles)", () => {
    const result = validateChancesInput({
      gpaUnweighted: "3.8",
      stateOfResidence: "CA",
      admissionCycle: "",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.admissionCycle).toBeNull();
    }
  });

  // ─── Multiple Errors ──────────────────────────────────────────────────────

  it("should return multiple errors at once", () => {
    const result = validateChancesInput({
      gpaUnweighted: "5.0",
      satScore: "2000",
      stateOfResidence: "XYZ",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.length).toBeGreaterThanOrEqual(2);
    }
  });

  // ─── Empty String Handling ────────────────────────────────────────────────

  it("should treat empty strings as null for optional number fields", () => {
    const result = validateChancesInput({
      gpaUnweighted: "3.8",
      satScore: "",
      actScore: "",
      stateOfResidence: "CA",
      apCoursesCount: "",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.satScore).toBeNull();
      expect(result.data.actScore).toBeNull();
      expect(result.data.apCoursesCount).toBeNull();
    }
  });
});
