import { describe, it, expect } from "vitest";
import {
  userProfiles,
  schools,
  admissionSubmissions,
  submissionFlags,
} from "@/lib/db/schema";

describe("Database Schema", () => {
  it("should define userProfiles table with required columns", () => {
    const columns = Object.keys(userProfiles);
    expect(columns).toContain("id");
    expect(columns).toContain("authUserId");
    expect(columns).toContain("email");
    expect(columns).toContain("displayName");
    expect(columns).toContain("hasSubmitted");
    expect(columns).toContain("verificationTier");
    expect(columns).toContain("eduEmail");
    expect(columns).toContain("eduEmailVerified");
  });

  it("should define schools table with required columns", () => {
    const columns = Object.keys(schools);
    expect(columns).toContain("id");
    expect(columns).toContain("name");
    expect(columns).toContain("state");
    expect(columns).toContain("city");
    expect(columns).toContain("schoolType");
    expect(columns).toContain("acceptanceRate");
  });

  it("should define admissionSubmissions table with required columns", () => {
    const columns = Object.keys(admissionSubmissions);
    expect(columns).toContain("id");
    expect(columns).toContain("userId");
    expect(columns).toContain("schoolId");
    expect(columns).toContain("admissionCycle");
    expect(columns).toContain("decision");
    expect(columns).toContain("gpaUnweighted");
    expect(columns).toContain("gpaWeighted");
    expect(columns).toContain("satScore");
    expect(columns).toContain("actScore");
    expect(columns).toContain("extracurriculars");
    expect(columns).toContain("intendedMajor");
    expect(columns).toContain("applicationRound");
    expect(columns).toContain("stateOfResidence");
    expect(columns).toContain("verificationTier");
    expect(columns).toContain("submissionStatus");
    expect(columns).toContain("flagCount");
  });

  it("should define submissionFlags table with required columns", () => {
    const columns = Object.keys(submissionFlags);
    expect(columns).toContain("id");
    expect(columns).toContain("submissionId");
    expect(columns).toContain("flaggedByUserId");
    expect(columns).toContain("reason");
  });
});
