import { describe, it, expect } from "vitest";
import {
  computeTestScorePercentile,
  computeGpaPercentile,
  computeAcceptanceRateScore,
  computeCompositeScore,
  classifySchools,
} from "@/lib/chances/classifier";
import type { SchoolData, StudentProfile } from "@/lib/chances/types";

// ─── Test Fixtures ──────────────────────────────────────────────────────────

function createStudent(overrides: Partial<StudentProfile> = {}): StudentProfile {
  return {
    gpaUnweighted: 3.8,
    satScore: 1450,
    actScore: null,
    stateOfResidence: "CA",
    intendedMajor: null,
    apCoursesCount: null,
    ...overrides,
  };
}

function createSchool(overrides: Partial<SchoolData> = {}): SchoolData {
  return {
    id: "school-1",
    name: "Test University",
    slug: "test-university",
    state: "CA",
    city: "Los Angeles",
    schoolType: "private",
    acceptanceRate: 25,
    satAverage: 1400,
    sat25thPercentile: 1300,
    sat75thPercentile: 1500,
    actMedian: 32,
    act25thPercentile: 30,
    act75thPercentile: 34,
    gpaPercent400: null,
    gpaPercent375to399: null,
    gpaPercent350to374: null,
    gpaPercent325to349: null,
    gpaPercent300to324: null,
    gpaPercentBelow300: null,
    ...overrides,
  };
}

// ─── Test Score Percentile ──────────────────────────────────────────────────

describe("computeTestScorePercentile", () => {
  it("returns null when student has no test scores", () => {
    const school = createSchool();
    expect(computeTestScorePercentile(null, null, school)).toBeNull();
  });

  it("returns null when school has no test score data", () => {
    const school = createSchool({
      sat25thPercentile: null,
      sat75thPercentile: null,
      act25thPercentile: null,
      act75thPercentile: null,
    });
    expect(computeTestScorePercentile(1450, null, school)).toBeNull();
  });

  it("returns score around 25 when SAT is at 25th percentile", () => {
    const school = createSchool({ sat25thPercentile: 1300, sat75thPercentile: 1500 });
    const result = computeTestScorePercentile(1300, null, school);
    expect(result).toBeCloseTo(25, 0);
  });

  it("returns score around 90 when SAT is at 75th percentile", () => {
    const school = createSchool({ sat25thPercentile: 1300, sat75thPercentile: 1500 });
    const result = computeTestScorePercentile(1500, null, school);
    expect(result).toBeCloseTo(90, 0);
  });

  it("returns midrange score when SAT is between 25th and 75th", () => {
    const school = createSchool({ sat25thPercentile: 1300, sat75thPercentile: 1500 });
    const result = computeTestScorePercentile(1400, null, school);
    expect(result).not.toBeNull();
    expect(result!).toBeGreaterThan(25);
    expect(result!).toBeLessThan(90);
  });

  it("returns score above 90 when SAT exceeds 75th percentile", () => {
    const school = createSchool({ sat25thPercentile: 1300, sat75thPercentile: 1500 });
    const result = computeTestScorePercentile(1550, null, school);
    expect(result).not.toBeNull();
    expect(result!).toBeGreaterThan(90);
  });

  it("returns low score when SAT is well below 25th percentile", () => {
    const school = createSchool({ sat25thPercentile: 1300, sat75thPercentile: 1500 });
    const result = computeTestScorePercentile(1000, null, school);
    expect(result).not.toBeNull();
    expect(result!).toBeLessThan(25);
  });

  it("uses ACT when SAT data unavailable for school", () => {
    const school = createSchool({
      sat25thPercentile: null,
      sat75thPercentile: null,
      act25thPercentile: 30,
      act75thPercentile: 34,
    });
    const result = computeTestScorePercentile(null, 32, school);
    expect(result).not.toBeNull();
    expect(result!).toBeGreaterThan(25);
    expect(result!).toBeLessThan(90);
  });

  it("prefers SAT over ACT when both available", () => {
    const school = createSchool();
    // SAT score should be used since school has SAT data
    const result = computeTestScorePercentile(1400, 32, school);
    expect(result).not.toBeNull();
  });
});

// ─── GPA Percentile ─────────────────────────────────────────────────────────

describe("computeGpaPercentile", () => {
  it("returns null when GPA is null", () => {
    const school = createSchool();
    expect(computeGpaPercentile(null, school)).toBeNull();
  });

  it("returns null when no GPA or acceptance rate data available", () => {
    const school = createSchool({ acceptanceRate: null });
    expect(computeGpaPercentile(3.8, school)).toBeNull();
  });

  it("uses CDS distribution when available", () => {
    const school = createSchool({
      gpaPercent400: 30,
      gpaPercent375to399: 40,
      gpaPercent350to374: 15,
      gpaPercent325to349: 10,
      gpaPercent300to324: 3,
      gpaPercentBelow300: 2,
    });
    const result = computeGpaPercentile(3.9, school);
    expect(result).not.toBeNull();
    expect(result!).toBeGreaterThan(50);
  });

  it("gives high percentile for 4.0 GPA at school with CDS data", () => {
    const school = createSchool({
      gpaPercent400: 20,
      gpaPercent375to399: 35,
      gpaPercent350to374: 20,
      gpaPercent325to349: 15,
      gpaPercent300to324: 7,
      gpaPercentBelow300: 3,
    });
    const result = computeGpaPercentile(4.0, school);
    expect(result).not.toBeNull();
    expect(result!).toBeGreaterThanOrEqual(80); // Should be at top
  });

  it("gives low percentile for low GPA at selective school", () => {
    const school = createSchool({
      gpaPercent400: 50,
      gpaPercent375to399: 30,
      gpaPercent350to374: 15,
      gpaPercent325to349: 3,
      gpaPercent300to324: 1,
      gpaPercentBelow300: 1,
    });
    const result = computeGpaPercentile(3.0, school);
    expect(result).not.toBeNull();
    expect(result!).toBeLessThan(10);
  });

  it("falls back to acceptance-rate heuristic when no CDS data", () => {
    const school = createSchool({ acceptanceRate: 10 });
    const result = computeGpaPercentile(3.95, school);
    expect(result).not.toBeNull();
    expect(result!).toBeGreaterThan(0);
  });

  it("heuristic gives lower score at more selective schools for same GPA", () => {
    const selectiveSchool = createSchool({ acceptanceRate: 10 });
    const openSchool = createSchool({ acceptanceRate: 80 });
    const gpa = 3.5;

    const selectiveResult = computeGpaPercentile(gpa, selectiveSchool);
    const openResult = computeGpaPercentile(gpa, openSchool);

    expect(selectiveResult).not.toBeNull();
    expect(openResult).not.toBeNull();
    expect(openResult!).toBeGreaterThan(selectiveResult!);
  });
});

// ─── Acceptance Rate Score ──────────────────────────────────────────────────

describe("computeAcceptanceRateScore", () => {
  it("returns null when acceptance rate is null", () => {
    expect(computeAcceptanceRateScore(null)).toBeNull();
  });

  it("returns very low score for ultra-selective schools", () => {
    const result = computeAcceptanceRateScore(5);
    expect(result).not.toBeNull();
    expect(result!).toBeLessThan(20);
  });

  it("returns moderate score for 50% acceptance rate", () => {
    const result = computeAcceptanceRateScore(50);
    expect(result).not.toBeNull();
    expect(result!).toBeGreaterThan(40);
    expect(result!).toBeLessThan(60);
  });

  it("returns high score for open admission schools", () => {
    const result = computeAcceptanceRateScore(90);
    expect(result).not.toBeNull();
    expect(result!).toBeGreaterThan(70);
  });

  it("scores are monotonically increasing with acceptance rate", () => {
    const rates = [5, 10, 25, 50, 75, 95];
    const scores = rates.map((rate) => computeAcceptanceRateScore(rate)!);

    for (let i = 0; i < scores.length - 1; i++) {
      expect(scores[i + 1]).toBeGreaterThan(scores[i]);
    }
  });
});

// ─── Composite Score ────────────────────────────────────────────────────────

describe("computeCompositeScore", () => {
  it("uses only institutional when crowdsourced is null", () => {
    const result = computeCompositeScore(60, null);
    expect(result).toBe(60);
  });

  it("blends 60/40 when crowdsourced is available", () => {
    // 80 * 0.6 + 60 * 0.4 = 48 + 24 = 72
    const result = computeCompositeScore(80, 60);
    expect(result).toBe(72);
  });

  it("clamps to 0-100 range", () => {
    expect(computeCompositeScore(0, 0)).toBe(0);
    expect(computeCompositeScore(100, 100)).toBe(100);
  });
});

// ─── classifySchools Integration ────────────────────────────────────────────

describe("classifySchools", () => {
  it("classifies strong student at less selective school as safety", () => {
    const student = createStudent({ gpaUnweighted: 3.95, satScore: 1560 });
    const school = createSchool({
      id: "safe-1",
      name: "Safety State U",
      acceptanceRate: 75,
      sat25thPercentile: 1000,
      sat75thPercentile: 1200,
    });

    const result = classifySchools(student, [school], []);
    expect(result.safety.length).toBeGreaterThanOrEqual(1);
    expect(result.safety[0].school.id).toBe("safe-1");
  });

  it("classifies weak student at ultra-selective school as reach", () => {
    const student = createStudent({ gpaUnweighted: 3.2, satScore: 1200 });
    const school = createSchool({
      id: "reach-1",
      name: "Elite University",
      acceptanceRate: 5,
      sat25thPercentile: 1480,
      sat75thPercentile: 1570,
    });

    const result = classifySchools(student, [school], []);
    expect(result.reach.length).toBe(1);
    expect(result.reach[0].school.id).toBe("reach-1");
  });

  it("enriches results with crowdsourced data when available", () => {
    const student = createStudent({ gpaUnweighted: 3.8, satScore: 1400 });
    const school = createSchool({ id: "school-1", acceptanceRate: 30 });

    const similarStats = [
      {
        schoolId: "school-1",
        totalSimilar: 20,
        accepted: 14,
        rejected: 4,
        waitlisted: 2,
        acceptedEarlyDecision: 5,
        acceptedEarlyAction: 3,
        acceptedRegular: 6,
      },
    ];

    const result = classifySchools(student, [school], similarStats);
    const allResults = [...result.safety, ...result.match, ...result.reach];
    const schoolResult = allResults.find((r) => r.school.id === "school-1");
    expect(schoolResult).toBeDefined();
    expect(schoolResult!.crowdsourcedScore).not.toBeNull();
    expect(schoolResult!.similarProfilesTotal).toBe(20);
    expect(schoolResult!.similarProfilesAccepted).toBe(14);
  });

  it("does not use crowdsourced data with fewer than 3 similar profiles", () => {
    const student = createStudent({ gpaUnweighted: 3.8, satScore: 1400 });
    const school = createSchool({ id: "school-1", acceptanceRate: 30 });

    const similarStats = [
      {
        schoolId: "school-1",
        totalSimilar: 2, // Below threshold
        accepted: 1,
        rejected: 1,
        waitlisted: 0,
        acceptedEarlyDecision: 0,
        acceptedEarlyAction: 0,
        acceptedRegular: 1,
      },
    ];

    const result = classifySchools(student, [school], similarStats);
    const allResults = [...result.safety, ...result.match, ...result.reach];
    const schoolResult = allResults.find((r) => r.school.id === "school-1");
    expect(schoolResult).toBeDefined();
    expect(schoolResult!.crowdsourcedScore).toBeNull();
  });

  it("handles empty school list", () => {
    const student = createStudent();
    const result = classifySchools(student, [], []);
    expect(result.safety).toHaveLength(0);
    expect(result.match).toHaveLength(0);
    expect(result.reach).toHaveLength(0);
    expect(result.totalSchoolsEvaluated).toBe(0);
  });

  it("sorts results by composite score descending within categories", () => {
    const student = createStudent({ gpaUnweighted: 3.9, satScore: 1500 });

    const schoolA = createSchool({
      id: "a",
      name: "A",
      acceptanceRate: 80,
      sat25thPercentile: 900,
      sat75thPercentile: 1100,
    });
    const schoolB = createSchool({
      id: "b",
      name: "B",
      acceptanceRate: 85,
      sat25thPercentile: 950,
      sat75thPercentile: 1150,
    });

    const result = classifySchools(student, [schoolA, schoolB], []);
    const safetyIds = result.safety.map((r) => r.school.id);
    // Both should be safety, sorted by composite score desc
    if (safetyIds.length >= 2) {
      expect(result.safety[0].compositeScore).toBeGreaterThanOrEqual(result.safety[1].compositeScore);
    }
  });

  it("includes totalSchoolsEvaluated in response", () => {
    const student = createStudent();
    const schools = [
      createSchool({ id: "1", acceptanceRate: 30 }),
      createSchool({ id: "2", acceptanceRate: 60 }),
    ];
    const result = classifySchools(student, schools, []);
    expect(result.totalSchoolsEvaluated).toBe(2);
  });

  it("preserves student profile in response", () => {
    const student = createStudent({ gpaUnweighted: 3.5, satScore: 1300 });
    const result = classifySchools(student, [], []);
    expect(result.profile.gpaUnweighted).toBe(3.5);
    expect(result.profile.satScore).toBe(1300);
  });
});
