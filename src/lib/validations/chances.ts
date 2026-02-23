/**
 * Input validation for the chances calculator.
 *
 * Requires at least one of GPA, SAT, or ACT, plus a valid US state.
 * Returns all errors at once (accumulating validation).
 */

import { STATE_BY_ABBREVIATION } from "@/lib/constants/us-states";

export interface ChancesInput {
  gpaUnweighted?: string;
  satScore?: string;
  actScore?: string;
  stateOfResidence?: string;
  intendedMajor?: string;
  apCoursesCount?: string;
  admissionCycle?: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidatedChancesInput {
  gpaUnweighted: number | null;
  satScore: number | null;
  actScore: number | null;
  stateOfResidence: string;
  intendedMajor: string | null;
  apCoursesCount: number | null;
  admissionCycle: string | null;
}

const MAX_INTENDED_MAJOR_LENGTH = 100;

export function validateChancesInput(
  input: ChancesInput
): { success: true; data: ValidatedChancesInput } | { success: false; errors: ValidationError[] } {
  const errors: ValidationError[] = [];

  // Parse numeric fields (empty strings → null)
  let gpaUnweighted: number | null = null;
  if (input.gpaUnweighted && input.gpaUnweighted.trim() !== "") {
    gpaUnweighted = parseFloat(input.gpaUnweighted);
    if (isNaN(gpaUnweighted) || gpaUnweighted < 0 || gpaUnweighted > 4.0) {
      errors.push({ field: "gpaUnweighted", message: "GPA must be between 0.00 and 4.00" });
      gpaUnweighted = null;
    }
  }

  let satScore: number | null = null;
  if (input.satScore && input.satScore.trim() !== "") {
    satScore = parseInt(input.satScore, 10);
    if (isNaN(satScore) || satScore < 400 || satScore > 1600) {
      errors.push({ field: "satScore", message: "SAT score must be between 400 and 1600" });
      satScore = null;
    }
  }

  let actScore: number | null = null;
  if (input.actScore && input.actScore.trim() !== "") {
    actScore = parseInt(input.actScore, 10);
    if (isNaN(actScore) || actScore < 1 || actScore > 36) {
      errors.push({ field: "actScore", message: "ACT score must be between 1 and 36" });
      actScore = null;
    }
  }

  // Must have at least one stat
  if (gpaUnweighted === null && satScore === null && actScore === null && errors.length === 0) {
    errors.push({
      field: "stats",
      message: "At least one of GPA, SAT score, or ACT score is required",
    });
  }

  // State of residence — required
  const stateOfResidence = input.stateOfResidence?.trim().toUpperCase() ?? "";
  if (!stateOfResidence || !STATE_BY_ABBREVIATION.has(stateOfResidence)) {
    errors.push({
      field: "stateOfResidence",
      message: "A valid 2-letter US state code is required",
    });
  }

  // Optional: intended major
  const intendedMajor = input.intendedMajor?.trim() || null;
  if (intendedMajor && intendedMajor.length > MAX_INTENDED_MAJOR_LENGTH) {
    errors.push({
      field: "intendedMajor",
      message: `Intended major must be ${MAX_INTENDED_MAJOR_LENGTH} characters or less`,
    });
  }

  // Optional: admission cycle (YYYY-YYYY format)
  const admissionCycle = input.admissionCycle?.trim() || null;
  if (admissionCycle && !/^\d{4}-\d{4}$/.test(admissionCycle)) {
    errors.push({
      field: "admissionCycle",
      message: "Admission cycle must be in YYYY-YYYY format (e.g., 2025-2026)",
    });
  }

  // Optional: AP courses count
  let apCoursesCount: number | null = null;
  if (input.apCoursesCount && input.apCoursesCount.trim() !== "") {
    apCoursesCount = parseInt(input.apCoursesCount, 10);
    if (isNaN(apCoursesCount) || apCoursesCount < 0 || apCoursesCount > 30) {
      errors.push({
        field: "apCoursesCount",
        message: "AP courses count must be between 0 and 30",
      });
      apCoursesCount = null;
    }
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      gpaUnweighted,
      satScore,
      actScore,
      stateOfResidence,
      intendedMajor,
      apCoursesCount,
      admissionCycle,
    },
  };
}
