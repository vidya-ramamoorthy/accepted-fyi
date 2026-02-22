import { describe, it, expect } from "vitest";
import { buildContextTags, type SubmissionTagInput } from "@/lib/utils/submission-tags";

function makeEmptyInput(): SubmissionTagInput {
  return {
    highSchoolType: null,
    geographicClassification: null,
    firstGeneration: null,
    legacyStatus: null,
    apCoursesCount: null,
    ibCoursesCount: null,
    honorsCoursesCount: null,
  };
}

describe("buildContextTags", () => {
  it("returns empty array when all fields are null", () => {
    const tags = buildContextTags(makeEmptyInput());
    expect(tags).toEqual([]);
  });

  it("adds high school type tag when provided", () => {
    const tags = buildContextTags({ ...makeEmptyInput(), highSchoolType: "public" });
    expect(tags).toContain("Public HS");
  });

  it("adds private high school tag", () => {
    const tags = buildContextTags({ ...makeEmptyInput(), highSchoolType: "private" });
    expect(tags).toContain("Private HS");
  });

  it("adds magnet high school tag", () => {
    const tags = buildContextTags({ ...makeEmptyInput(), highSchoolType: "magnet" });
    expect(tags).toContain("Magnet");
  });

  it("adds homeschool tag", () => {
    const tags = buildContextTags({ ...makeEmptyInput(), highSchoolType: "homeschool" });
    expect(tags).toContain("Homeschool");
  });

  it("adds international tag", () => {
    const tags = buildContextTags({ ...makeEmptyInput(), highSchoolType: "international" });
    expect(tags).toContain("International");
  });

  it("ignores unrecognized high school type", () => {
    const tags = buildContextTags({ ...makeEmptyInput(), highSchoolType: "unknown_type" });
    expect(tags).toEqual([]);
  });

  it("capitalizes geographic classification", () => {
    const tags = buildContextTags({ ...makeEmptyInput(), geographicClassification: "urban" });
    expect(tags).toContain("Urban");
  });

  it("capitalizes suburban classification", () => {
    const tags = buildContextTags({ ...makeEmptyInput(), geographicClassification: "suburban" });
    expect(tags).toContain("Suburban");
  });

  it("capitalizes rural classification", () => {
    const tags = buildContextTags({ ...makeEmptyInput(), geographicClassification: "rural" });
    expect(tags).toContain("Rural");
  });

  it("adds First-Gen tag when true", () => {
    const tags = buildContextTags({ ...makeEmptyInput(), firstGeneration: true });
    expect(tags).toContain("First-Gen");
  });

  it("does not add First-Gen tag when false", () => {
    const tags = buildContextTags({ ...makeEmptyInput(), firstGeneration: false });
    expect(tags).not.toContain("First-Gen");
  });

  it("adds Legacy tag when true", () => {
    const tags = buildContextTags({ ...makeEmptyInput(), legacyStatus: true });
    expect(tags).toContain("Legacy");
  });

  it("does not add Legacy tag when false", () => {
    const tags = buildContextTags({ ...makeEmptyInput(), legacyStatus: false });
    expect(tags).not.toContain("Legacy");
  });

  it("adds AP courses count tag when greater than zero", () => {
    const tags = buildContextTags({ ...makeEmptyInput(), apCoursesCount: 8 });
    expect(tags).toContain("8 APs");
  });

  it("does not add AP courses tag when zero", () => {
    const tags = buildContextTags({ ...makeEmptyInput(), apCoursesCount: 0 });
    expect(tags).not.toContainEqual(expect.stringContaining("APs"));
  });

  it("adds IB courses count tag when greater than zero", () => {
    const tags = buildContextTags({ ...makeEmptyInput(), ibCoursesCount: 3 });
    expect(tags).toContain("3 IBs");
  });

  it("does not add IB courses tag when zero", () => {
    const tags = buildContextTags({ ...makeEmptyInput(), ibCoursesCount: 0 });
    expect(tags).not.toContainEqual(expect.stringContaining("IBs"));
  });

  it("adds honors courses count tag when greater than zero", () => {
    const tags = buildContextTags({ ...makeEmptyInput(), honorsCoursesCount: 5 });
    expect(tags).toContain("5 Honors");
  });

  it("does not add honors courses tag when zero", () => {
    const tags = buildContextTags({ ...makeEmptyInput(), honorsCoursesCount: 0 });
    expect(tags).not.toContainEqual(expect.stringContaining("Honors"));
  });

  it("returns all tags when all fields are populated", () => {
    const tags = buildContextTags({
      highSchoolType: "charter",
      geographicClassification: "suburban",
      firstGeneration: true,
      legacyStatus: true,
      apCoursesCount: 12,
      ibCoursesCount: 4,
      honorsCoursesCount: 6,
    });

    expect(tags).toEqual([
      "Charter",
      "Suburban",
      "First-Gen",
      "Legacy",
      "12 APs",
      "4 IBs",
      "6 Honors",
    ]);
  });

  it("maintains consistent tag order", () => {
    const tags = buildContextTags({
      highSchoolType: "public",
      geographicClassification: "urban",
      firstGeneration: true,
      legacyStatus: false,
      apCoursesCount: 5,
      ibCoursesCount: null,
      honorsCoursesCount: 3,
    });

    expect(tags).toEqual(["Public HS", "Urban", "First-Gen", "5 APs", "3 Honors"]);
  });
});
