import type {
  AdmissionDecision,
  HighSchoolType,
  GeographicClassification,
  ScholarshipType,
  AttendanceIntent,
  WaitlistOutcome,
} from "@/types/database";

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

const VALID_HIGH_SCHOOL_TYPES: HighSchoolType[] = [
  "public",
  "private",
  "charter",
  "magnet",
  "homeschool",
  "international",
];

const VALID_GEOGRAPHIC_CLASSIFICATIONS: GeographicClassification[] = [
  "rural",
  "suburban",
  "urban",
];

const VALID_SCHOLARSHIP_TYPES: ScholarshipType[] = [
  "none",
  "merit",
  "need_based",
  "both",
];

const VALID_ATTENDANCE_INTENTS: AttendanceIntent[] = [
  "yes",
  "no",
  "undecided",
];

const VALID_WAITLIST_OUTCOMES: WaitlistOutcome[] = [
  "accepted_off_waitlist",
  "rejected_off_waitlist",
  "withdrew",
];

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
  highSchoolType?: string;
  firstGeneration?: boolean;
  legacyStatus?: boolean;
  financialAidApplied?: boolean;
  geographicClassification?: string;
  apCoursesCount?: string;
  ibCoursesCount?: string;
  honorsCoursesCount?: string;
  scholarshipOffered?: string;
  willAttend?: string;
  waitlistOutcome?: string;
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
  highSchoolType: HighSchoolType | null;
  firstGeneration: boolean | null;
  legacyStatus: boolean | null;
  financialAidApplied: boolean | null;
  geographicClassification: GeographicClassification | null;
  apCoursesCount: number | null;
  ibCoursesCount: number | null;
  honorsCoursesCount: number | null;
  scholarshipOffered: ScholarshipType | null;
  willAttend: AttendanceIntent | null;
  waitlistOutcome: WaitlistOutcome | null;
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

  const schoolState = input.schoolState?.trim().toUpperCase();
  if (schoolState && !STATE_PATTERN.test(schoolState)) {
    errors.push({ field: "schoolState", message: "School state must be a 2-letter state code" });
  }

  const schoolCity = input.schoolCity?.trim();
  if (schoolCity && schoolCity.length > 100) {
    errors.push({ field: "schoolCity", message: "School city must be 100 characters or less" });
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

  const MAX_EXTRACURRICULARS = 20;
  const MAX_EXTRACURRICULAR_LENGTH = 200;
  const MAX_INTENDED_MAJOR_LENGTH = 100;

  const extracurriculars = (input.extracurriculars ?? [])
    .map((ec) => ec.trim())
    .filter((ec) => ec.length > 0);

  if (extracurriculars.length > MAX_EXTRACURRICULARS) {
    errors.push({ field: "extracurriculars", message: `Maximum ${MAX_EXTRACURRICULARS} extracurriculars allowed` });
  }

  const oversizedExtracurricular = extracurriculars.find(
    (ec) => ec.length > MAX_EXTRACURRICULAR_LENGTH
  );
  if (oversizedExtracurricular) {
    errors.push({
      field: "extracurriculars",
      message: `Each extracurricular must be ${MAX_EXTRACURRICULAR_LENGTH} characters or less`,
    });
  }

  const intendedMajor = input.intendedMajor?.trim() || null;
  if (intendedMajor && intendedMajor.length > MAX_INTENDED_MAJOR_LENGTH) {
    errors.push({
      field: "intendedMajor",
      message: `Intended major must be ${MAX_INTENDED_MAJOR_LENGTH} characters or less`,
    });
  }

  // Validate new optional fields
  let highSchoolType: HighSchoolType | null = null;
  if (input.highSchoolType) {
    if (!VALID_HIGH_SCHOOL_TYPES.includes(input.highSchoolType as HighSchoolType)) {
      errors.push({ field: "highSchoolType", message: "Invalid high school type" });
    } else {
      highSchoolType = input.highSchoolType as HighSchoolType;
    }
  }

  let geographicClassification: GeographicClassification | null = null;
  if (input.geographicClassification) {
    if (!VALID_GEOGRAPHIC_CLASSIFICATIONS.includes(input.geographicClassification as GeographicClassification)) {
      errors.push({ field: "geographicClassification", message: "Invalid geographic classification" });
    } else {
      geographicClassification = input.geographicClassification as GeographicClassification;
    }
  }

  let apCoursesCount: number | null = null;
  if (input.apCoursesCount) {
    apCoursesCount = parseInt(input.apCoursesCount, 10);
    if (isNaN(apCoursesCount) || apCoursesCount < 0 || apCoursesCount > 30) {
      errors.push({ field: "apCoursesCount", message: "AP courses count must be between 0 and 30" });
    }
  }

  let ibCoursesCount: number | null = null;
  if (input.ibCoursesCount) {
    ibCoursesCount = parseInt(input.ibCoursesCount, 10);
    if (isNaN(ibCoursesCount) || ibCoursesCount < 0 || ibCoursesCount > 30) {
      errors.push({ field: "ibCoursesCount", message: "IB courses count must be between 0 and 30" });
    }
  }

  let honorsCoursesCount: number | null = null;
  if (input.honorsCoursesCount) {
    honorsCoursesCount = parseInt(input.honorsCoursesCount, 10);
    if (isNaN(honorsCoursesCount) || honorsCoursesCount < 0 || honorsCoursesCount > 30) {
      errors.push({ field: "honorsCoursesCount", message: "Honors courses count must be between 0 and 30" });
    }
  }

  let scholarshipOffered: ScholarshipType | null = null;
  if (input.scholarshipOffered) {
    if (!VALID_SCHOLARSHIP_TYPES.includes(input.scholarshipOffered as ScholarshipType)) {
      errors.push({ field: "scholarshipOffered", message: "Invalid scholarship type" });
    } else {
      scholarshipOffered = input.scholarshipOffered as ScholarshipType;
    }
  }

  let willAttend: AttendanceIntent | null = null;
  if (input.willAttend) {
    if (!VALID_ATTENDANCE_INTENTS.includes(input.willAttend as AttendanceIntent)) {
      errors.push({ field: "willAttend", message: "Invalid attendance intent" });
    } else {
      willAttend = input.willAttend as AttendanceIntent;
    }
  }

  let waitlistOutcome: WaitlistOutcome | null = null;
  if (input.waitlistOutcome) {
    if (!VALID_WAITLIST_OUTCOMES.includes(input.waitlistOutcome as WaitlistOutcome)) {
      errors.push({ field: "waitlistOutcome", message: "Invalid waitlist outcome" });
    } else {
      waitlistOutcome = input.waitlistOutcome as WaitlistOutcome;
    }
  }

  const firstGeneration = input.firstGeneration ?? null;
  const legacyStatus = input.legacyStatus ?? null;
  const financialAidApplied = input.financialAidApplied ?? null;

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      schoolName: schoolName!,
      schoolState: schoolState || stateOfResidence!,
      schoolCity: schoolCity || "",
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
      highSchoolType,
      firstGeneration,
      legacyStatus,
      financialAidApplied,
      geographicClassification,
      apCoursesCount,
      ibCoursesCount,
      honorsCoursesCount,
      scholarshipOffered,
      willAttend,
      waitlistOutcome,
    },
  };
}
