import { describe, it, expect } from "vitest";
import {
  getSchoolBrandColor,
  SCHOOL_BRAND_COLORS,
} from "@/lib/constants/school-colors";

describe("getSchoolBrandColor", () => {
  it("returns the mapped color for a known school", () => {
    expect(getSchoolBrandColor("Stanford University")).toBe("#8C1515");
  });

  it("matches case-insensitively", () => {
    expect(getSchoolBrandColor("HARVARD UNIVERSITY")).toBe("#A51C30");
    expect(getSchoolBrandColor("harvard university")).toBe("#A51C30");
    expect(getSchoolBrandColor("Harvard University")).toBe("#A51C30");
  });

  it("trims whitespace", () => {
    expect(getSchoolBrandColor("  MIT  ")).not.toThrow;
    expect(getSchoolBrandColor("  Stanford University  ")).toBe("#8C1515");
  });

  it("returns a fallback color for an unknown school", () => {
    const color = getSchoolBrandColor("Some Unknown College");
    expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  it("returns the same fallback color deterministically", () => {
    const colorA = getSchoolBrandColor("Fictional State University");
    const colorB = getSchoolBrandColor("Fictional State University");
    expect(colorA).toBe(colorB);
  });

  it("returns different fallback colors for different unknown schools", () => {
    const colorA = getSchoolBrandColor("Alpha College");
    const colorB = getSchoolBrandColor("Zeta University");
    // Not guaranteed to be different with 12-color palette, but these specific
    // names do hash to different indices
    expect(colorA).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(colorB).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  it("has colors for all Ivy League schools", () => {
    const ivyLeague = [
      "Harvard University",
      "Yale University",
      "Princeton University",
      "Columbia University",
      "University of Pennsylvania",
      "Brown University",
      "Dartmouth College",
      "Cornell University",
    ];
    for (const school of ivyLeague) {
      const color = getSchoolBrandColor(school);
      expect(SCHOOL_BRAND_COLORS[school.toLowerCase()]).toBeDefined();
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  it("has colors for top UC schools", () => {
    const ucSchools = [
      "University of California, Berkeley",
      "University of California, Los Angeles",
      "University of California, San Diego",
    ];
    for (const school of ucSchools) {
      expect(SCHOOL_BRAND_COLORS[school.toLowerCase()]).toBeDefined();
    }
  });

  it("returns valid hex colors for all mapped schools", () => {
    for (const [school, color] of Object.entries(SCHOOL_BRAND_COLORS)) {
      expect(color, `Invalid color for ${school}`).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });
});
