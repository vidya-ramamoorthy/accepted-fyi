import { describe, it, expect } from "vitest";
import {
  computeTestScorePercentile,
  computeGpaPercentile,
  computeAcceptanceRateScore,
  computeCompositeScore,
  classifySchools,
} from "@/lib/chances/classifier";
import type {
  SchoolData,
  SimilarProfileStats,
  StudentProfile,
  ChancesClassification,
} from "@/lib/chances/types";

// ─── Test Helpers ─────────────────────────────────────────────────────────────

function makeSchool(overrides: Partial<SchoolData> = {}): SchoolData {
  return {
    id: "school-1",
    name: "Test University",
    slug: "test-university",
    state: "CA",
    city: "Test City",
    schoolType: "private",
    acceptanceRate: null,
    satAverage: null,
    sat25thPercentile: null,
    sat75thPercentile: null,
    actMedian: null,
    act25thPercentile: null,
    act75thPercentile: null,
    gpaPercent400: null,
    gpaPercent375to399: null,
    gpaPercent350to374: null,
    gpaPercent325to349: null,
    gpaPercent300to324: null,
    gpaPercentBelow300: null,
    ...overrides,
  };
}

function makeProfile(overrides: Partial<StudentProfile> = {}): StudentProfile {
  return {
    gpaUnweighted: 3.8,
    satScore: 1400,
    actScore: null,
    stateOfResidence: "CA",
    intendedMajor: null,
    apCoursesCount: null,
    ...overrides,
  };
}

function makeSimilarStats(overrides: Partial<SimilarProfileStats> = {}): SimilarProfileStats {
  return {
    schoolId: "school-1",
    totalSimilar: 0,
    accepted: 0,
    rejected: 0,
    waitlisted: 0,
    acceptedEarlyDecision: 0,
    acceptedEarlyAction: 0,
    acceptedRegular: 0,
    ...overrides,
  };
}

// ─── computeTestScorePercentile ───────────────────────────────────────────────

describe("computeTestScorePercentile", () => {
  it("should return null when student has no test score", () => {
    const school = makeSchool({ sat25thPercentile: 1200, sat75thPercentile: 1500 });
    expect(computeTestScorePercentile(null, null, school)).toBeNull();
  });

  it("should return null when school has no SAT percentile data", () => {
    const school = makeSchool();
    expect(computeTestScorePercentile(1400, null, school)).toBeNull();
  });

  it("should score ~90 when SAT is at the 75th percentile", () => {
    const school = makeSchool({ sat25thPercentile: 1200, sat75thPercentile: 1500 });
    const score = computeTestScorePercentile(1500, null, school);
    expect(score).toBeCloseTo(90, 0);
  });

  it("should score ~25 when SAT is at the 25th percentile", () => {
    const school = makeSchool({ sat25thPercentile: 1200, sat75thPercentile: 1500 });
    const score = computeTestScorePercentile(1200, null, school);
    expect(score).toBeCloseTo(25, 0);
  });

  it("should score between 25 and 90 when SAT is in the middle range", () => {
    const school = makeSchool({ sat25thPercentile: 1200, sat75thPercentile: 1500 });
    const score = computeTestScorePercentile(1350, null, school)!;
    expect(score).toBeGreaterThan(25);
    expect(score).toBeLessThan(90);
  });

  it("should score above 90 when SAT is above the 75th percentile", () => {
    const school = makeSchool({ sat25thPercentile: 1200, sat75thPercentile: 1500 });
    const score = computeTestScorePercentile(1580, null, school)!;
    expect(score).toBeGreaterThan(90);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("should score below 25 when SAT is below the 25th percentile", () => {
    const school = makeSchool({ sat25thPercentile: 1200, sat75thPercentile: 1500 });
    const score = computeTestScorePercentile(1000, null, school)!;
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThan(25);
  });

  it("should never return below 0", () => {
    const school = makeSchool({ sat25thPercentile: 1400, sat75thPercentile: 1550 });
    const score = computeTestScorePercentile(400, null, school)!;
    expect(score).toBeGreaterThanOrEqual(0);
  });

  it("should never return above 100", () => {
    const school = makeSchool({ sat25thPercentile: 1000, sat75thPercentile: 1200 });
    const score = computeTestScorePercentile(1600, null, school)!;
    expect(score).toBeLessThanOrEqual(100);
  });

  it("should use ACT data when SAT is not provided", () => {
    const school = makeSchool({ act25thPercentile: 28, act75thPercentile: 34 });
    const score = computeTestScorePercentile(null, 34, school);
    expect(score).toBeCloseTo(90, 0);
  });

  it("should prefer SAT when both SAT and ACT are provided and school has both", () => {
    const school = makeSchool({
      sat25thPercentile: 1200,
      sat75thPercentile: 1500,
      act25thPercentile: 28,
      act75thPercentile: 34,
    });
    // SAT 1500 = 90, ACT 28 = 25 — should return 90 (SAT-based)
    const score = computeTestScorePercentile(1500, 28, school)!;
    expect(score).toBeCloseTo(90, 0);
  });

  it("should fall back to ACT when school only has ACT data", () => {
    const school = makeSchool({ act25thPercentile: 28, act75thPercentile: 34 });
    const score = computeTestScorePercentile(1500, 31, school);
    // Should use ACT since school has no SAT data
    expect(score).not.toBeNull();
    expect(score).toBeGreaterThan(25);
    expect(score).toBeLessThan(90);
  });
});

// ─── computeGpaPercentile ─────────────────────────────────────────────────────

describe("computeGpaPercentile", () => {
  it("should return null when student has no GPA", () => {
    const school = makeSchool({ gpaPercent400: 50 });
    expect(computeGpaPercentile(null, school)).toBeNull();
  });

  it("should score high when GPA is 4.0 and most freshmen have 4.0", () => {
    const school = makeSchool({
      gpaPercent400: 80,
      gpaPercent375to399: 15,
      gpaPercent350to374: 5,
    });
    const score = computeGpaPercentile(4.0, school)!;
    expect(score).toBeGreaterThanOrEqual(70);
  });

  it("should score low when GPA is below 3.0 at a selective school", () => {
    const school = makeSchool({
      gpaPercent400: 80,
      gpaPercent375to399: 15,
      gpaPercent350to374: 4,
      gpaPercent325to349: 1,
      gpaPercent300to324: 0,
      gpaPercentBelow300: 0,
    });
    const score = computeGpaPercentile(2.8, school)!;
    expect(score).toBeLessThan(20);
  });

  it("should handle school with no GPA data using acceptance rate fallback", () => {
    const school = makeSchool({ acceptanceRate: 10 });
    const score = computeGpaPercentile(3.5, school);
    // Should use heuristic based on acceptance rate
    expect(score).not.toBeNull();
  });

  it("should return null when school has neither GPA data nor acceptance rate", () => {
    const school = makeSchool();
    expect(computeGpaPercentile(3.5, school)).toBeNull();
  });

  it("should return a score between 0 and 100", () => {
    const school = makeSchool({
      gpaPercent400: 50,
      gpaPercent375to399: 25,
      gpaPercent350to374: 15,
      gpaPercent325to349: 5,
      gpaPercent300to324: 3,
      gpaPercentBelow300: 2,
    });

    for (const gpa of [2.0, 2.5, 3.0, 3.25, 3.5, 3.75, 4.0]) {
      const score = computeGpaPercentile(gpa, school)!;
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    }
  });
});

// ─── computeAcceptanceRateScore ───────────────────────────────────────────────

describe("computeAcceptanceRateScore", () => {
  it("should return null when acceptance rate is not available", () => {
    expect(computeAcceptanceRateScore(null)).toBeNull();
  });

  it("should return ~10 for 5% acceptance rate", () => {
    const score = computeAcceptanceRateScore(5)!;
    expect(score).toBeCloseTo(10, 0);
  });

  it("should return ~50 for 50% acceptance rate", () => {
    const score = computeAcceptanceRateScore(50)!;
    expect(score).toBeCloseTo(50, 0);
  });

  it("should return ~85 for 90% acceptance rate", () => {
    const score = computeAcceptanceRateScore(90)!;
    expect(score).toBeCloseTo(85, 0);
  });

  it("should return values between 0 and 100", () => {
    for (const rate of [1, 5, 10, 25, 50, 75, 90, 99]) {
      const score = computeAcceptanceRateScore(rate)!;
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    }
  });

  it("should be monotonically increasing with acceptance rate", () => {
    const rates = [5, 10, 20, 40, 60, 80, 95];
    const scores = rates.map((rate) => computeAcceptanceRateScore(rate)!);
    for (let i = 1; i < scores.length; i++) {
      expect(scores[i]).toBeGreaterThan(scores[i - 1]);
    }
  });
});

// ─── computeCompositeScore ────────────────────────────────────────────────────

describe("computeCompositeScore", () => {
  it("should use institutional-only score when no crowdsourced data", () => {
    const score = computeCompositeScore(70, null);
    expect(score).toBe(70);
  });

  it("should blend 60% institutional + 40% crowdsourced when crowdsourced data exists", () => {
    const score = computeCompositeScore(80, 50);
    // 80 * 0.6 + 50 * 0.4 = 48 + 20 = 68
    expect(score).toBeCloseTo(68, 0);
  });

  it("should clamp to 0 minimum", () => {
    const score = computeCompositeScore(0, 0);
    expect(score).toBe(0);
  });

  it("should clamp to 100 maximum", () => {
    const score = computeCompositeScore(100, 100);
    expect(score).toBe(100);
  });
});

// ─── classifySchools ──────────────────────────────────────────────────────────

describe("classifySchools", () => {
  const profile = makeProfile();

  it("should classify safety when composite >= 70", () => {
    const school = makeSchool({
      id: "safety-school",
      acceptanceRate: 90,
      sat25thPercentile: 900,
      sat75thPercentile: 1100,
    });
    const result = classifySchools(profile, [school], []);
    const safetySchool = result.safety.find((s) => s.school.id === "safety-school");
    expect(safetySchool).toBeDefined();
    expect(safetySchool!.classification).toBe("safety");
  });

  it("should classify reach when composite < 40", () => {
    const school = makeSchool({
      id: "reach-school",
      acceptanceRate: 5,
      sat25thPercentile: 1500,
      sat75thPercentile: 1570,
      gpaPercent400: 95,
      gpaPercent375to399: 5,
    });
    const profileWithLowerStats = makeProfile({ satScore: 1200, gpaUnweighted: 3.5 });
    const result = classifySchools(profileWithLowerStats, [school], []);
    const reachSchool = result.reach.find((s) => s.school.id === "reach-school");
    expect(reachSchool).toBeDefined();
    expect(reachSchool!.classification).toBe("reach");
  });

  it("should return high confidence when >= 10 similar profiles", () => {
    const school = makeSchool({
      id: "high-conf-school",
      acceptanceRate: 50,
      sat25thPercentile: 1100,
      sat75thPercentile: 1300,
    });
    const stats = makeSimilarStats({
      schoolId: "high-conf-school",
      totalSimilar: 15,
      accepted: 8,
    });
    const result = classifySchools(profile, [school], [stats]);
    const found = [...result.safety, ...result.match, ...result.reach].find(
      (s) => s.school.id === "high-conf-school"
    );
    expect(found).toBeDefined();
    expect(found!.confidence).toBe("high");
  });

  it("should return medium confidence when 3-9 similar profiles", () => {
    const school = makeSchool({
      id: "med-conf-school",
      acceptanceRate: 50,
      sat25thPercentile: 1100,
      sat75thPercentile: 1300,
    });
    const stats = makeSimilarStats({
      schoolId: "med-conf-school",
      totalSimilar: 5,
      accepted: 3,
    });
    const result = classifySchools(profile, [school], [stats]);
    const found = [...result.safety, ...result.match, ...result.reach].find(
      (s) => s.school.id === "med-conf-school"
    );
    expect(found).toBeDefined();
    expect(found!.confidence).toBe("medium");
  });

  it("should return low confidence when < 3 similar profiles", () => {
    const school = makeSchool({
      id: "low-conf-school",
      acceptanceRate: 50,
      sat25thPercentile: 1100,
      sat75thPercentile: 1300,
    });
    const result = classifySchools(profile, [school], []);
    const found = [...result.safety, ...result.match, ...result.reach].find(
      (s) => s.school.id === "low-conf-school"
    );
    expect(found).toBeDefined();
    expect(found!.confidence).toBe("low");
  });

  it("should use crowdsourced score when >= 3 similar profiles exist", () => {
    const school = makeSchool({
      id: "crowd-school",
      acceptanceRate: 50,
      sat25thPercentile: 1100,
      sat75thPercentile: 1300,
    });
    const stats = makeSimilarStats({
      schoolId: "crowd-school",
      totalSimilar: 10,
      accepted: 9,
    });
    const result = classifySchools(profile, [school], [stats]);
    const found = [...result.safety, ...result.match, ...result.reach].find(
      (s) => s.school.id === "crowd-school"
    );
    expect(found).toBeDefined();
    expect(found!.crowdsourcedScore).not.toBeNull();
    expect(found!.similarProfilesTotal).toBe(10);
    expect(found!.similarProfilesAccepted).toBe(9);
  });

  it("should sort each category by composite score descending", () => {
    const schools = [
      makeSchool({ id: "s1", acceptanceRate: 80, sat25thPercentile: 900, sat75thPercentile: 1100 }),
      makeSchool({ id: "s2", acceptanceRate: 95, sat25thPercentile: 800, sat75thPercentile: 1000 }),
      makeSchool({ id: "s3", acceptanceRate: 70, sat25thPercentile: 1000, sat75thPercentile: 1200 }),
    ];
    const result = classifySchools(profile, schools, []);
    const safetyScores = result.safety.map((s) => s.compositeScore);
    for (let i = 1; i < safetyScores.length; i++) {
      expect(safetyScores[i]).toBeLessThanOrEqual(safetyScores[i - 1]);
    }
  });

  it("should limit results to 50 per category", () => {
    const schools = Array.from({ length: 80 }, (_, i) =>
      makeSchool({
        id: `safety-${i}`,
        acceptanceRate: 95,
        sat25thPercentile: 800,
        sat75thPercentile: 1000,
      })
    );
    const result = classifySchools(profile, schools, []);
    expect(result.safety.length).toBeLessThanOrEqual(50);
  });

  it("should skip schools with no usable institutional data", () => {
    const school = makeSchool({ id: "no-data-school" });
    // No acceptance rate, no SAT/ACT data, no GPA data
    const result = classifySchools(profile, [school], []);
    const allResults = [...result.safety, ...result.match, ...result.reach];
    const found = allResults.find((s) => s.school.id === "no-data-school");
    expect(found).toBeUndefined();
  });

  it("should handle empty school list", () => {
    const result = classifySchools(profile, [], []);
    expect(result.safety).toHaveLength(0);
    expect(result.match).toHaveLength(0);
    expect(result.reach).toHaveLength(0);
  });

  it("should include totalSchoolsEvaluated count", () => {
    const schools = [
      makeSchool({ id: "s1", acceptanceRate: 50, sat25thPercentile: 1100, sat75thPercentile: 1300 }),
      makeSchool({ id: "s2", acceptanceRate: 80, sat25thPercentile: 900, sat75thPercentile: 1100 }),
    ];
    const result = classifySchools(profile, schools, []);
    expect(result.totalSchoolsEvaluated).toBe(2);
  });

  it("should include the student profile in the response", () => {
    const result = classifySchools(profile, [], []);
    expect(result.profile).toEqual(profile);
  });
});
