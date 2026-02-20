export type VerificationTier = "bronze" | "silver" | "gold";
export type AdmissionDecision = "accepted" | "rejected" | "waitlisted" | "deferred";
export type SubmissionStatus = "pending_review" | "visible" | "hidden" | "flagged";
export type HighSchoolType = "public" | "private" | "charter" | "magnet" | "homeschool" | "international";
export type GeographicClassification = "rural" | "suburban" | "urban";
export type ScholarshipType = "none" | "merit" | "need_based" | "both";
export type AttendanceIntent = "yes" | "no" | "undecided";
export type WaitlistOutcome = "accepted_off_waitlist" | "rejected_off_waitlist" | "withdrew";

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  hasSubmitted: boolean;
  verificationTier: VerificationTier;
  eduEmail: string | null;
  eduEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface School {
  id: string;
  name: string;
  state: string;
  city: string;
  type: "public" | "private" | "community_college";
  acceptanceRate: number | null;
  createdAt: Date;
}

export interface AdmissionSubmission {
  id: string;
  userId: string;
  schoolId: string;
  admissionCycle: string;
  decision: AdmissionDecision;
  gpaUnweighted: number | null;
  gpaWeighted: number | null;
  satScore: number | null;
  actScore: number | null;
  extracurriculars: string[];
  intendedMajor: string | null;
  applicationRound: "early_decision" | "early_action" | "regular" | "rolling";
  stateOfResidence: string;
  highSchoolType: HighSchoolType | null;
  firstGeneration: boolean | null;
  legacyStatus: boolean | null;
  financialAidApplied: boolean | null;
  geographicClassification: GeographicClassification | null;
  apCoursesCount: number | null;
  scholarshipOffered: ScholarshipType | null;
  willAttend: AttendanceIntent | null;
  waitlistOutcome: WaitlistOutcome | null;
  verificationTier: VerificationTier;
  submissionStatus: SubmissionStatus;
  flagCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubmissionFlag {
  id: string;
  submissionId: string;
  flaggedByUserId: string;
  reason: string;
  createdAt: Date;
}
