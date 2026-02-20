import type { AdmissionDecision } from "@/types/database";

const VALID_DECISIONS: AdmissionDecision[] = [
  "accepted",
  "rejected",
  "waitlisted",
  "deferred",
];

const VALID_APPLICATION_ROUNDS = [
  "early_decision",
  "early_action",
  "regular",
  "rolling",
] as const;

const ADMISSION_CYCLE_PATTERN = /^\d{4}-\d{4}$/;
const STATE_PATTERN = /^[A-Z]{2}$/;

export interface SubmissionInput {
  schoolName: string;
  schoolState?: string;
  schoolCity?: string;
  decision: string;
  applicationRound: string;
  admissionCycle: string;
  gpaUnweighted?: string;
  gpaWeighted?: string;
  satScore?: string;
  actScore?: string;
  intendedMajor?: string;
  stateOfResidence: string;
  extracurriculars?: string[];
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidatedSubmission {
  schoolName: string;
  schoolState: string;
  schoolCity: string;
  decision: AdmissionDecision;
  applicationRound: (typeof VALID_APPLICATION_ROUNDS)[number];
  admissionCycle: string;
  gpaUnweighted: number | null;
  gpaWeighted: number | null;
  satScore: number | null;
  actScore: number | null;
  intendedMajor: string | null;
  stateOfResidence: string;
  extracurriculars: string[];
}

export function validateSubmission(
  input: SubmissionInput
): { success: true; data: ValidatedSubmission } | { success: false; errors: ValidationError[] } {
  const errors: ValidationError[] = [];

  const schoolName = input.schoolName?.trim();
  if (!schoolName || schoolName.length < 2) {
    errors.push({ field: "schoolName", message: "School name is required (min 2 characters)" });
  }
  if (schoolName && schoolName.length > 255) {
    errors.push({ field: "schoolName", message: "School name must be 255 characters or less" });
  }

  if (!VALID_DECISIONS.includes(input.decision as AdmissionDecision)) {
    errors.push({ field: "decision", message: "Invalid decision value" });
  }

  if (!VALID_APPLICATION_ROUNDS.includes(input.applicationRound as typeof VALID_APPLICATION_ROUNDS[number])) {
    errors.push({ field: "applicationRound", message: "Invalid application round" });
  }

  if (!ADMISSION_CYCLE_PATTERN.test(input.admissionCycle)) {
    errors.push({ field: "admissionCycle", message: "Admission cycle must be in YYYY-YYYY format" });
  }

  const stateOfResidence = input.stateOfResidence?.trim().toUpperCase();
  if (!stateOfResidence || !STATE_PATTERN.test(stateOfResidence)) {
    errors.push({ field: "stateOfResidence", message: "State of residence must be a 2-letter state code" });
  }

  let gpaUnweighted: number | null = null;
  if (input.gpaUnweighted) {
    gpaUnweighted = parseFloat(input.gpaUnweighted);
    if (isNaN(gpaUnweighted) || gpaUnweighted < 0 || gpaUnweighted > 4.0) {
      errors.push({ field: "gpaUnweighted", message: "Unweighted GPA must be between 0.00 and 4.00" });
    }
  }

  let gpaWeighted: number | null = null;
  if (input.gpaWeighted) {
    gpaWeighted = parseFloat(input.gpaWeighted);
    if (isNaN(gpaWeighted) || gpaWeighted < 0 || gpaWeighted > 5.0) {
      errors.push({ field: "gpaWeighted", message: "Weighted GPA must be between 0.00 and 5.00" });
    }
  }

  let satScore: number | null = null;
  if (input.satScore) {
    satScore = parseInt(input.satScore, 10);
    if (isNaN(satScore) || satScore < 400 || satScore > 1600) {
      errors.push({ field: "satScore", message: "SAT score must be between 400 and 1600" });
    }
  }

  let actScore: number | null = null;
  if (input.actScore) {
    actScore = parseInt(input.actScore, 10);
    if (isNaN(actScore) || actScore < 1 || actScore > 36) {
      errors.push({ field: "actScore", message: "ACT score must be between 1 and 36" });
    }
  }

  const extracurriculars = (input.extracurriculars ?? [])
    .map((ec) => ec.trim())
    .filter((ec) => ec.length > 0);

  const intendedMajor = input.intendedMajor?.trim() || null;

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      schoolName: schoolName!,
      schoolState: input.schoolState?.trim().toUpperCase() || stateOfResidence!,
      schoolCity: input.schoolCity?.trim() || "",
      decision: input.decision as AdmissionDecision,
      applicationRound: input.applicationRound as typeof VALID_APPLICATION_ROUNDS[number],
      admissionCycle: input.admissionCycle,
      gpaUnweighted,
      gpaWeighted,
      satScore,
      actScore,
      intendedMajor,
      stateOfResidence: stateOfResidence!,
      extracurriculars,
    },
  };
}
