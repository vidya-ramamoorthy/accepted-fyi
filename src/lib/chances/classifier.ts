/**
 * Pure functions for the chances calculator.
 *
 * Computes a composite admissions probability score (0-100) per school
 * by blending institutional data (60% weight) with crowdsourced submission
 * data (40% weight when >= 3 similar profiles exist).
 */

import type {
  SchoolData,
  SimilarProfileStats,
  StudentProfile,
  ChancesSchoolResult,
  ChancesResponse,
  ChancesClassification,
  ConfidenceLevel,
} from "./types";

const INSTITUTIONAL_WEIGHT = 0.6;
const CROWDSOURCED_WEIGHT = 0.4;

const SAFETY_THRESHOLD = 70;
const MATCH_THRESHOLD = 40;

const MIN_SIMILAR_PROFILES_FOR_CROWDSOURCED = 3;
const HIGH_CONFIDENCE_THRESHOLD = 10;

const MAX_RESULTS_PER_CATEGORY = 50;

// ─── Test Score Percentile ────────────────────────────────────────────────────

/**
 * Computes where a student's test score falls relative to a school's
 * 25th-75th percentile range. Returns a 0-100 score.
 *
 * At 75th percentile → ~90
 * At 25th percentile → ~25
 * Below 25th → 0-25
 * Above 75th → 90-100
 */
export function computeTestScorePercentile(
  satScore: number | null,
  actScore: number | null,
  school: SchoolData
): number | null {
  // Try SAT first, fall back to ACT
  const hasSatData = school.sat25thPercentile !== null && school.sat75thPercentile !== null;
  const hasActData = school.act25thPercentile !== null && school.act75thPercentile !== null;

  if (satScore !== null && hasSatData) {
    return computePercentileScore(
      satScore,
      school.sat25thPercentile!,
      school.sat75thPercentile!,
      400,
      1600
    );
  }

  if (actScore !== null && hasActData) {
    return computePercentileScore(
      actScore,
      school.act25thPercentile!,
      school.act75thPercentile!,
      1,
      36
    );
  }

  return null;
}

/**
 * Maps a student score to a 0-100 scale based on the school's percentile range.
 * Uses piecewise linear interpolation:
 *   [absoluteMin, p25] → [0, 25]
 *   [p25, p75]         → [25, 90]
 *   [p75, absoluteMax] → [90, 100]
 */
function computePercentileScore(
  studentScore: number,
  p25: number,
  p75: number,
  absoluteMin: number,
  absoluteMax: number
): number {
  let score: number;

  if (studentScore <= p25) {
    // Map [absoluteMin, p25] → [0, 25]
    const range = p25 - absoluteMin;
    if (range === 0) {
      score = 25;
    } else {
      score = ((studentScore - absoluteMin) / range) * 25;
    }
  } else if (studentScore <= p75) {
    // Map [p25, p75] → [25, 90]
    const range = p75 - p25;
    if (range === 0) {
      score = 57.5; // midpoint
    } else {
      score = 25 + ((studentScore - p25) / range) * 65;
    }
  } else {
    // Map [p75, absoluteMax] → [90, 100]
    const range = absoluteMax - p75;
    if (range === 0) {
      score = 90;
    } else {
      score = 90 + ((studentScore - p75) / range) * 10;
    }
  }

  return clamp(score, 0, 100);
}

// ─── GPA Percentile ───────────────────────────────────────────────────────────

/**
 * Computes what percentile of enrolled freshmen the student's GPA falls at,
 * using CDS GPA distribution buckets. Falls back to an acceptance-rate-based
 * heuristic if no CDS data is available.
 */
export function computeGpaPercentile(
  gpaUnweighted: number | null,
  school: SchoolData
): number | null {
  if (gpaUnweighted === null) return null;

  const hasGpaDistribution = school.gpaPercent400 !== null;

  if (hasGpaDistribution) {
    return computeGpaFromDistribution(gpaUnweighted, school);
  }

  // Fallback: heuristic based on acceptance rate
  if (school.acceptanceRate !== null) {
    return computeGpaHeuristic(gpaUnweighted, school.acceptanceRate);
  }

  return null;
}

/**
 * Uses CDS GPA distribution buckets to compute a cumulative percentile.
 * The GPA distribution buckets represent what % of enrolled freshmen fall
 * in each range. A student at the top of a bucket is at the cumulative
 * percentile of everyone below + their bucket.
 */
function computeGpaFromDistribution(gpa: number, school: SchoolData): number {
  // Buckets ordered from lowest to highest GPA
  const buckets = [
    { min: 0.0, max: 3.0, percent: toNumber(school.gpaPercentBelow300) },
    { min: 3.0, max: 3.25, percent: toNumber(school.gpaPercent300to324) },
    { min: 3.25, max: 3.5, percent: toNumber(school.gpaPercent325to349) },
    { min: 3.5, max: 3.75, percent: toNumber(school.gpaPercent350to374) },
    { min: 3.75, max: 4.0, percent: toNumber(school.gpaPercent375to399) },
    { min: 4.0, max: 4.0, percent: toNumber(school.gpaPercent400) },
  ];

  let cumulativeBelow = 0;

  for (const bucket of buckets) {
    if (gpa < bucket.min) {
      // Student is below this bucket entirely
      break;
    }

    if (bucket.min === bucket.max) {
      // Special case: the 4.0 bucket
      if (gpa >= 4.0) {
        cumulativeBelow += bucket.percent;
      }
      break;
    }

    if (gpa >= bucket.max) {
      // Student is above this entire bucket
      cumulativeBelow += bucket.percent;
    } else {
      // Student is within this bucket — interpolate
      const bucketRange = bucket.max - bucket.min;
      const positionInBucket = (gpa - bucket.min) / bucketRange;
      cumulativeBelow += bucket.percent * positionInBucket;
      break;
    }
  }

  // Convert cumulative percentile (0-100 of enrolled students) to score
  // Higher percentile = better position among enrolled students
  return clamp(cumulativeBelow, 0, 100);
}

/**
 * Heuristic GPA scoring when no CDS distribution data is available.
 * Uses acceptance rate as a proxy for selectivity:
 * - Very selective (< 15% acceptance): GPA < 3.7 = low score
 * - Moderately selective (15-40%): GPA < 3.5 = low score
 * - Less selective (> 40%): GPA < 3.0 = low score
 */
function computeGpaHeuristic(gpa: number, acceptanceRate: number): number {
  // The "expected GPA" for an admitted student scales with selectivity
  let expectedGpa: number;
  if (acceptanceRate < 15) {
    expectedGpa = 3.9;
  } else if (acceptanceRate < 30) {
    expectedGpa = 3.7;
  } else if (acceptanceRate < 50) {
    expectedGpa = 3.5;
  } else if (acceptanceRate < 70) {
    expectedGpa = 3.2;
  } else {
    expectedGpa = 3.0;
  }

  // Score based on how close student is to expected
  const gpaDifference = gpa - expectedGpa;
  // +0.5 above expected → score ~90, at expected → 50, -0.5 below → ~10
  const score = 50 + (gpaDifference / 0.5) * 40;
  return clamp(score, 0, 100);
}

// ─── Acceptance Rate Score ────────────────────────────────────────────────────

/**
 * Normalizes the acceptance rate to a 0-100 score.
 * Uses a slightly non-linear mapping:
 *   5% → ~10
 *   50% → ~50
 *   90% → ~85
 */
export function computeAcceptanceRateScore(acceptanceRate: number | null): number | null {
  if (acceptanceRate === null) return null;

  // Linear mapping calibrated to:
  //   5% acceptance → score ~10
  //  50% acceptance → score ~50
  //  90% acceptance → score ~85
  // Formula: score = (15 * rate + 95) / 17
  const score = (15 * acceptanceRate + 95) / 17;

  return clamp(score, 0, 100);
}

// ─── Composite Score ──────────────────────────────────────────────────────────

/**
 * Computes the final composite score blending institutional (60%) and
 * crowdsourced (40%) scores. When crowdsourced data is not available,
 * uses institutional score only.
 */
export function computeCompositeScore(
  institutionalScore: number,
  crowdsourcedScore: number | null
): number {
  if (crowdsourcedScore === null) {
    return clamp(institutionalScore, 0, 100);
  }

  const blended =
    institutionalScore * INSTITUTIONAL_WEIGHT +
    crowdsourcedScore * CROWDSOURCED_WEIGHT;

  return clamp(Math.round(blended), 0, 100);
}

// ─── Classification ───────────────────────────────────────────────────────────

/**
 * Classifies all schools for a student profile, returning grouped results
 * sorted by composite score descending.
 */
export function classifySchools(
  profile: StudentProfile,
  schoolDataList: SchoolData[],
  similarProfileStatsList: SimilarProfileStats[]
): ChancesResponse {
  const similarStatsMap = new Map<string, SimilarProfileStats>();
  for (const stats of similarProfileStatsList) {
    similarStatsMap.set(stats.schoolId, stats);
  }

  const results: ChancesSchoolResult[] = [];

  for (const school of schoolDataList) {
    const institutionalScore = computeInstitutionalScore(profile, school);
    if (institutionalScore === null) continue; // Skip schools with no usable data

    const similarStats = similarStatsMap.get(school.id);
    const hasSufficientCrowdsourcedData =
      similarStats !== undefined &&
      similarStats.totalSimilar >= MIN_SIMILAR_PROFILES_FOR_CROWDSOURCED;

    const crowdsourcedScore = hasSufficientCrowdsourcedData
      ? (similarStats.accepted / similarStats.totalSimilar) * 100
      : null;

    const compositeScore = computeCompositeScore(institutionalScore, crowdsourcedScore);

    const classification = classifyScore(compositeScore);
    const confidence = determineConfidence(similarStats?.totalSimilar ?? 0);

    results.push({
      school,
      compositeScore,
      classification,
      confidence,
      institutionalScore: Math.round(institutionalScore),
      crowdsourcedScore: crowdsourcedScore !== null ? Math.round(crowdsourcedScore) : null,
      similarProfilesTotal: similarStats?.totalSimilar ?? 0,
      similarProfilesAccepted: similarStats?.accepted ?? 0,
    });
  }

  const safety = results
    .filter((r) => r.classification === "safety")
    .sort((a, b) => b.compositeScore - a.compositeScore)
    .slice(0, MAX_RESULTS_PER_CATEGORY);

  const match = results
    .filter((r) => r.classification === "match")
    .sort((a, b) => b.compositeScore - a.compositeScore)
    .slice(0, MAX_RESULTS_PER_CATEGORY);

  const reach = results
    .filter((r) => r.classification === "reach")
    .sort((a, b) => b.compositeScore - a.compositeScore)
    .slice(0, MAX_RESULTS_PER_CATEGORY);

  return {
    safety,
    match,
    reach,
    totalSchoolsEvaluated: results.length,
    profile,
  };
}

// ─── Internal Helpers ─────────────────────────────────────────────────────────

/**
 * Computes the institutional score by averaging available sub-scores:
 * test score percentile, GPA percentile, and acceptance rate score.
 */
function computeInstitutionalScore(profile: StudentProfile, school: SchoolData): number | null {
  const testScore = computeTestScorePercentile(profile.satScore, profile.actScore, school);
  const gpaScore = computeGpaPercentile(profile.gpaUnweighted, school);
  const acceptanceScore = computeAcceptanceRateScore(
    school.acceptanceRate !== null ? Number(school.acceptanceRate) : null
  );

  const availableScores = [testScore, gpaScore, acceptanceScore].filter(
    (score): score is number => score !== null
  );

  if (availableScores.length === 0) return null;

  return availableScores.reduce((sum, score) => sum + score, 0) / availableScores.length;
}

function classifyScore(compositeScore: number): ChancesClassification {
  if (compositeScore >= SAFETY_THRESHOLD) return "safety";
  if (compositeScore >= MATCH_THRESHOLD) return "match";
  return "reach";
}

function determineConfidence(totalSimilarProfiles: number): ConfidenceLevel {
  if (totalSimilarProfiles >= HIGH_CONFIDENCE_THRESHOLD) return "high";
  if (totalSimilarProfiles >= MIN_SIMILAR_PROFILES_FOR_CROWDSOURCED) return "medium";
  return "low";
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function toNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const parsed = typeof value === "string" ? parseFloat(value) : value;
  return isNaN(parsed) ? 0 : parsed;
}
