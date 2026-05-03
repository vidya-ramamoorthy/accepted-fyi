import { describe, it, expect } from "vitest";
import {
  buildSchoolPageTitle,
  buildSchoolPageDescription,
  formatAcceptanceRate,
} from "@/lib/seo/school-metadata";

describe("formatAcceptanceRate", () => {
  it("strips trailing zeros from whole numbers", () => {
    expect(formatAcceptanceRate("4.00")).toBe("4");
  });

  it("strips single trailing zero", () => {
    expect(formatAcceptanceRate("25.80")).toBe("25.8");
  });

  it("keeps one decimal for non-zero fractions", () => {
    expect(formatAcceptanceRate("12.34")).toBe("12.3");
  });

  it("accepts a number value", () => {
    expect(formatAcceptanceRate(3.9)).toBe("3.9");
  });

  it("returns null for null input", () => {
    expect(formatAcceptanceRate(null)).toBeNull();
  });

  it("returns null for undefined input", () => {
    expect(formatAcceptanceRate(undefined)).toBeNull();
  });

  it("returns null for non-numeric string", () => {
    expect(formatAcceptanceRate("n/a")).toBeNull();
  });
});

describe("buildSchoolPageTitle", () => {
  it("puts school name, acceptance rate keyword, and cycle year up front", () => {
    const title = buildSchoolPageTitle({
      schoolName: "MIT",
      acceptanceRate: "3.90",
      cycleYear: 2026,
    });
    expect(title).toContain("MIT");
    expect(title).toContain("Acceptance Rate");
    expect(title).toContain("2026");
  });

  it("includes the formatted acceptance rate when available", () => {
    const title = buildSchoolPageTitle({
      schoolName: "MIT",
      acceptanceRate: "3.90",
      cycleYear: 2026,
    });
    expect(title).toContain("3.9%");
  });

  it("falls back to generic title when acceptance rate is missing", () => {
    const title = buildSchoolPageTitle({
      schoolName: "Obscure College",
      acceptanceRate: null,
      cycleYear: 2026,
    });
    expect(title).toContain("Obscure College");
    expect(title).toContain("Acceptance Rate");
    expect(title).toContain("2026");
    expect(title).not.toContain("null");
    expect(title).not.toContain("undefined");
  });

  it("keeps title under 60 characters for typical short school names", () => {
    const title = buildSchoolPageTitle({
      schoolName: "MIT",
      acceptanceRate: "3.90",
      cycleYear: 2026,
    });
    // leaves room for ' | accepted.fyi' suffix template (~14 chars)
    expect(title.length).toBeLessThanOrEqual(60);
  });

  it("puts the core keyword within the first 55 chars even for long school names", () => {
    const title = buildSchoolPageTitle({
      schoolName: "University of California Santa Barbara",
      acceptanceRate: "25.80",
      cycleYear: 2026,
    });
    const firstChunk = title.slice(0, 55);
    // we want at minimum the school name + the acceptance rate keyword visible
    expect(firstChunk).toContain("University of California Santa Barbara");
  });
});

describe("buildSchoolPageDescription", () => {
  it("leads with school name and actual acceptance rate", () => {
    const description = buildSchoolPageDescription({
      schoolName: "MIT",
      acceptanceRate: "3.90",
      submissionCount: 12,
      city: "Cambridge",
      state: "MA",
      cycleYear: 2026,
    });
    expect(description).toContain("MIT");
    expect(description).toContain("3.9%");
  });

  it("includes real submission count when greater than zero", () => {
    const description = buildSchoolPageDescription({
      schoolName: "MIT",
      acceptanceRate: "3.90",
      submissionCount: 47,
      city: "Cambridge",
      state: "MA",
      cycleYear: 2026,
    });
    expect(description).toContain("47");
    expect(description).toMatch(/admit|student/i);
  });

  it("omits the submission count when zero but still promises real data", () => {
    const description = buildSchoolPageDescription({
      schoolName: "Obscure College",
      acceptanceRate: "25.00",
      submissionCount: 0,
      city: "Nowhere",
      state: "NE",
      cycleYear: 2026,
    });
    expect(description).not.toContain(" 0 ");
    expect(description.toLowerCase()).toMatch(/gpa|sat|act/);
  });

  it("includes SAT, GPA, and ACT keywords for long-tail SEO", () => {
    const description = buildSchoolPageDescription({
      schoolName: "MIT",
      acceptanceRate: "3.90",
      submissionCount: 12,
      city: "Cambridge",
      state: "MA",
      cycleYear: 2026,
    });
    expect(description).toContain("GPA");
    expect(description).toContain("SAT");
  });

  it("stays under Google's 160 character description limit", () => {
    const description = buildSchoolPageDescription({
      schoolName: "University of California Santa Barbara",
      acceptanceRate: "25.80",
      submissionCount: 150,
      city: "Santa Barbara",
      state: "CA",
      cycleYear: 2026,
    });
    expect(description.length).toBeLessThanOrEqual(160);
  });

  it("handles missing acceptance rate gracefully", () => {
    const description = buildSchoolPageDescription({
      schoolName: "Obscure College",
      acceptanceRate: null,
      submissionCount: 3,
      city: "Somewhere",
      state: "NE",
      cycleYear: 2026,
    });
    expect(description).toContain("Obscure College");
    expect(description).not.toContain("null");
    expect(description).not.toContain("undefined");
    expect(description).not.toContain("%");
  });

  it("mentions the cycle year for year-specific query matching", () => {
    const description = buildSchoolPageDescription({
      schoolName: "MIT",
      acceptanceRate: "3.90",
      submissionCount: 12,
      city: "Cambridge",
      state: "MA",
      cycleYear: 2026,
    });
    expect(description).toContain("2026");
  });
});
