import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  text,
  varchar,
  timestamp,
  boolean,
  integer,
  numeric,
  pgEnum,
  uniqueIndex,
  index,
  check,
} from "drizzle-orm/pg-core";

export const verificationTierEnum = pgEnum("verification_tier", [
  "bronze",
  "silver",
  "gold",
]);

export const admissionDecisionEnum = pgEnum("admission_decision", [
  "accepted",
  "rejected",
  "waitlisted",
  "deferred",
]);

export const submissionStatusEnum = pgEnum("submission_status", [
  "pending_review",
  "visible",
  "hidden",
  "flagged",
]);

export const applicationRoundEnum = pgEnum("application_round", [
  "early_decision",
  "early_action",
  "regular",
  "rolling",
]);

export const schoolTypeEnum = pgEnum("school_type", [
  "public",
  "private",
  "community_college",
]);

export const highSchoolTypeEnum = pgEnum("high_school_type", [
  "public",
  "private",
  "charter",
  "magnet",
  "homeschool",
  "international",
]);

export const geographicClassificationEnum = pgEnum("geographic_classification", [
  "rural",
  "suburban",
  "urban",
]);

export const scholarshipTypeEnum = pgEnum("scholarship_type", [
  "none",
  "merit",
  "need_based",
  "both",
]);

export const attendanceIntentEnum = pgEnum("attendance_intent", [
  "yes",
  "no",
  "undecided",
]);

export const waitlistOutcomeEnum = pgEnum("waitlist_outcome", [
  "accepted_off_waitlist",
  "rejected_off_waitlist",
  "withdrew",
]);

export const dataSourceEnum = pgEnum("data_source", [
  "user",
  "reddit",
  "college_confidential",
  "public_scraped",
]);

export const userProfiles = pgTable("user_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  authUserId: uuid("auth_user_id").notNull().unique(),
  email: text("email").notNull(),
  displayName: varchar("display_name", { length: 100 }).notNull(),
  hasSubmitted: boolean("has_submitted").notNull().default(false),
  verificationTier: verificationTierEnum("verification_tier")
    .notNull()
    .default("bronze"),
  eduEmail: text("edu_email"),
  eduEmailVerified: boolean("edu_email_verified").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const schools = pgTable("schools", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 300 }).unique(),
  state: varchar("state", { length: 2 }).notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  schoolType: schoolTypeEnum("school_type").notNull(),
  acceptanceRate: numeric("acceptance_rate", { precision: 5, scale: 2 }),
  // Institutional data from College Scorecard / IPEDS
  scorecardId: integer("scorecard_id"), // federal UNITID
  satAverage: integer("sat_average"),
  sat25thPercentile: integer("sat_25th_percentile"),
  sat75thPercentile: integer("sat_75th_percentile"),
  actMedian: integer("act_median"),
  act25thPercentile: integer("act_25th_percentile"),
  act75thPercentile: integer("act_75th_percentile"),
  undergradEnrollment: integer("undergrad_enrollment"),
  admissionsTotal: integer("admissions_total"),
  applicantsTotal: integer("applicants_total"),
  institutionalDataYear: varchar("institutional_data_year", { length: 9 }),
  website: text("website"),
  // CDS Section C1 — Round-specific admission counts
  edApplicants: integer("ed_applicants"),
  edAdmitted: integer("ed_admitted"),
  eaApplicants: integer("ea_applicants"),
  eaAdmitted: integer("ea_admitted"),
  // CDS Section C2 — Waitlist data
  waitlistOffered: integer("waitlist_offered"),
  waitlistAccepted: integer("waitlist_accepted"),
  waitlistAdmitted: integer("waitlist_admitted"),
  // CDS Section C7 — Admissions factor importance ratings
  // Values: "very_important" | "important" | "considered" | "not_considered"
  factorGpa: varchar("factor_gpa", { length: 20 }),
  factorClassRank: varchar("factor_class_rank", { length: 20 }),
  factorTestScores: varchar("factor_test_scores", { length: 20 }),
  factorEssay: varchar("factor_essay", { length: 20 }),
  factorRecommendations: varchar("factor_recommendations", { length: 20 }),
  factorExtracurriculars: varchar("factor_extracurriculars", { length: 20 }),
  factorTalentAbility: varchar("factor_talent_ability", { length: 20 }),
  factorCharacter: varchar("factor_character", { length: 20 }),
  factorFirstGen: varchar("factor_first_gen", { length: 20 }),
  factorAlumniRelation: varchar("factor_alumni_relation", { length: 20 }),
  factorGeographic: varchar("factor_geographic", { length: 20 }),
  factorStateResidency: varchar("factor_state_residency", { length: 20 }),
  factorVolunteer: varchar("factor_volunteer", { length: 20 }),
  factorWorkExperience: varchar("factor_work_experience", { length: 20 }),
  factorDemonstratedInterest: varchar("factor_demonstrated_interest", { length: 20 }),
  // CDS Section C10-C12 — GPA distribution of enrolled freshmen (percentages)
  gpaPercent400: numeric("gpa_percent_4_00", { precision: 5, scale: 2 }),
  gpaPercent375to399: numeric("gpa_percent_3_75_to_3_99", { precision: 5, scale: 2 }),
  gpaPercent350to374: numeric("gpa_percent_3_50_to_3_74", { precision: 5, scale: 2 }),
  gpaPercent325to349: numeric("gpa_percent_3_25_to_3_49", { precision: 5, scale: 2 }),
  gpaPercent300to324: numeric("gpa_percent_3_00_to_3_24", { precision: 5, scale: 2 }),
  gpaPercentBelow300: numeric("gpa_percent_below_3_00", { precision: 5, scale: 2 }),
  // CDS Section H — Financial aid highlights
  percentNeedMet: numeric("percent_need_met", { precision: 5, scale: 2 }),
  avgFinancialAidPackage: integer("avg_financial_aid_package"),
  percentReceivingMeritAid: numeric("percent_receiving_merit_aid", { precision: 5, scale: 2 }),
  avgMeritAidAmount: integer("avg_merit_aid_amount"),
  // CDS metadata
  cdsDataYear: varchar("cds_data_year", { length: 9 }),
  cdsSourceUrl: text("cds_source_url"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const admissionSubmissions = pgTable(
  "admission_submissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => userProfiles.id),
    schoolId: uuid("school_id")
      .notNull()
      .references(() => schools.id),
    dataSource: dataSourceEnum("data_source").notNull().default("user"),
    sourceUrl: text("source_url"),
    sourcePostId: varchar("source_post_id", { length: 100 }),
    admissionCycle: varchar("admission_cycle", { length: 9 }).notNull(),
    decision: admissionDecisionEnum("decision").notNull(),
    gpaUnweighted: numeric("gpa_unweighted", { precision: 4, scale: 2 }),
    gpaWeighted: numeric("gpa_weighted", { precision: 4, scale: 2 }),
    satScore: integer("sat_score"),
    actScore: integer("act_score"),
    extracurriculars: text("extracurriculars").array().notNull().default([]),
    applicantHighlight: text("applicant_highlight"),
    intendedMajor: varchar("intended_major", { length: 100 }),
    applicationRound: applicationRoundEnum("application_round").notNull(),
    stateOfResidence: varchar("state_of_residence", { length: 2 }),
    highSchoolType: highSchoolTypeEnum("high_school_type"),
    firstGeneration: boolean("first_generation"),
    legacyStatus: boolean("legacy_status"),
    financialAidApplied: boolean("financial_aid_applied"),
    geographicClassification: geographicClassificationEnum("geographic_classification"),
    apCoursesCount: integer("ap_courses_count"),
    ibCoursesCount: integer("ib_courses_count"),
    honorsCoursesCount: integer("honors_courses_count"),
    scholarshipOffered: scholarshipTypeEnum("scholarship_offered"),
    willAttend: attendanceIntentEnum("will_attend"),
    waitlistOutcome: waitlistOutcomeEnum("waitlist_outcome"),
    verificationTier: verificationTierEnum("verification_tier")
      .notNull()
      .default("bronze"),
    submissionStatus: submissionStatusEnum("submission_status")
      .notNull()
      .default("pending_review"),
    flagCount: integer("flag_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // User-submitted data: one submission per user per school per cycle
    uniqueIndex("unique_user_school_cycle")
      .on(table.userId, table.schoolId, table.admissionCycle)
      .where(sql`user_id IS NOT NULL`),
    // Scraped data: one entry per source post per school (prevents re-ingestion dupes)
    uniqueIndex("unique_scraped_source_school")
      .on(table.sourcePostId, table.schoolId)
      .where(sql`user_id IS NULL AND source_post_id IS NOT NULL`),
    // If data_source is 'user', userId must not be null
    check("user_submissions_require_user_id", sql`data_source = 'user' AND user_id IS NOT NULL OR data_source != 'user'`),
    index("idx_submissions_school_id").on(table.schoolId),
    index("idx_submissions_user_id").on(table.userId),
    index("idx_submissions_decision").on(table.decision),
    index("idx_submissions_status").on(table.submissionStatus),
    index("idx_submissions_created_at").on(table.createdAt),
    index("idx_submissions_data_source").on(table.dataSource),
  ]
);

export const decisionTimelines = pgTable("decision_timelines", {
  id: uuid("id").primaryKey().defaultRandom(),
  schoolId: uuid("school_id")
    .notNull()
    .references(() => schools.id),
  admissionCycle: varchar("admission_cycle", { length: 9 }).notNull(),
  applicationRound: applicationRoundEnum("application_round").notNull(),
  expectedDate: timestamp("expected_date", { withTimezone: true }),
  actualDate: timestamp("actual_date", { withTimezone: true }),
  isConfirmed: boolean("is_confirmed").notNull().default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const submissionFlags = pgTable("submission_flags", {
  id: uuid("id").primaryKey().defaultRandom(),
  submissionId: uuid("submission_id")
    .notNull()
    .references(() => admissionSubmissions.id),
  flaggedByUserId: uuid("flagged_by_user_id")
    .notNull()
    .references(() => userProfiles.id),
  reason: text("reason").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
