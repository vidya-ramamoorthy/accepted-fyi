/**
 * Types for the chances calculator feature.
 *
 * The calculator computes a composite admissions probability score per school
 * by blending institutional data (College Scorecard/CDS) with crowdsourced
 * submission data.
 */

export interface StudentProfile {
  gpaUnweighted: number | null;
  satScore: number | null;
  actScore: number | null;
  stateOfResidence: string;
  intendedMajor: string | null;
  apCoursesCount: number | null;
}

export interface SchoolData {
  id: string;
  name: string;
  slug: string | null;
  state: string;
  city: string;
  schoolType: "public" | "private" | "community_college";
  acceptanceRate: number | null;
  satAverage: number | null;
  sat25thPercentile: number | null;
  sat75thPercentile: number | null;
  actMedian: number | null;
  act25thPercentile: number | null;
  act75thPercentile: number | null;
  gpaPercent400: number | null;
  gpaPercent375to399: number | null;
  gpaPercent350to374: number | null;
  gpaPercent325to349: number | null;
  gpaPercent300to324: number | null;
  gpaPercentBelow300: number | null;
}

export interface SimilarProfileStats {
  schoolId: string;
  totalSimilar: number;
  accepted: number;
  rejected: number;
  waitlisted: number;
  acceptedEarlyDecision: number;
  acceptedEarlyAction: number;
  acceptedRegular: number;
}

export type ChancesClassification = "safety" | "match" | "reach";

export type ConfidenceLevel = "high" | "medium" | "low";

export interface ChancesSchoolResult {
  school: SchoolData;
  compositeScore: number;
  classification: ChancesClassification;
  confidence: ConfidenceLevel;
  institutionalScore: number;
  crowdsourcedScore: number | null;
  similarProfilesTotal: number;
  similarProfilesAccepted: number;
}

export interface ChancesResponse {
  safety: ChancesSchoolResult[];
  match: ChancesSchoolResult[];
  reach: ChancesSchoolResult[];
  totalSchoolsEvaluated: number;
  profile: StudentProfile;
}
