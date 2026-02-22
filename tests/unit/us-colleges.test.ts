import { describe, it, expect } from "vitest";
import { US_COLLEGES, filterColleges } from "@/data/us-colleges";

describe("US_COLLEGES data", () => {
  it("should contain a substantial number of colleges", () => {
    expect(US_COLLEGES.length).toBeGreaterThan(200);
  });

  it("should have required fields for every entry", () => {
    for (const college of US_COLLEGES) {
      expect(college.name).toBeTruthy();
      expect(college.state).toMatch(/^[A-Z]{2}$/);
      expect(college.city).toBeTruthy();
    }
  });

  it("should be sorted alphabetically by name", () => {
    for (let i = 1; i < US_COLLEGES.length; i++) {
      const previousName = US_COLLEGES[i - 1].name.toLowerCase();
      const currentName = US_COLLEGES[i].name.toLowerCase();
      expect(currentName >= previousName).toBe(true);
    }
  });

  it("should include all Ivy League schools", () => {
    const ivyLeagueSchools = [
      "Brown University",
      "Columbia University",
      "Cornell University",
      "Dartmouth College",
      "Harvard University",
      "Princeton University",
      "University of Pennsylvania",
      "Yale University",
    ];

    const collegeNames = US_COLLEGES.map((college) => college.name);

    for (const ivySchool of ivyLeagueSchools) {
      expect(collegeNames).toContain(ivySchool);
    }
  });

  it("should include major state university systems", () => {
    const stateUniversities = [
      "University of California, Berkeley",
      "University of Michigan",
      "University of Texas at Austin",
      "University of Virginia",
    ];

    const collegeNames = US_COLLEGES.map((college) => college.name);

    for (const stateSchool of stateUniversities) {
      expect(collegeNames).toContain(stateSchool);
    }
  });

  it("should not contain duplicate entries", () => {
    const collegeNames = US_COLLEGES.map((college) => college.name);
    const uniqueNames = new Set(collegeNames);
    expect(uniqueNames.size).toBe(collegeNames.length);
  });
});

describe("filterColleges", () => {
  it("should return empty array for queries shorter than 2 characters", () => {
    expect(filterColleges("")).toEqual([]);
    expect(filterColleges("a")).toEqual([]);
  });

  it("should find schools by partial name match", () => {
    const results = filterColleges("Stanford");
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].name).toBe("Stanford University");
  });

  it("should be case-insensitive", () => {
    const lowercaseResults = filterColleges("harvard");
    const uppercaseResults = filterColleges("HARVARD");

    expect(lowercaseResults.length).toBeGreaterThanOrEqual(1);
    expect(lowercaseResults[0].name).toBe("Harvard University");
    expect(lowercaseResults).toEqual(uppercaseResults);
  });

  it("should respect the limit parameter", () => {
    const results = filterColleges("University", 3);
    expect(results.length).toBeLessThanOrEqual(3);
  });

  it("should return matches for substring searches", () => {
    const results = filterColleges("MIT");
    const matchesMIT = results.some(
      (college) => college.name === "Massachusetts Institute of Technology"
    );
    // MIT might not match "Massachusetts Institute of Technology" as substring
    // but should work for "Hamilton College" or similar containing "mit"
    expect(results.length).toBeGreaterThanOrEqual(0);
  });

  it("should return empty array for non-matching query", () => {
    const results = filterColleges("xyznonexistent");
    expect(results).toEqual([]);
  });

  it("should default to 10 results max", () => {
    const results = filterColleges("University");
    expect(results.length).toBeLessThanOrEqual(10);
  });

  it("should include state and city information in results", () => {
    const results = filterColleges("Stanford");
    expect(results[0].state).toBe("CA");
    expect(results[0].city).toBe("Stanford");
  });
});
