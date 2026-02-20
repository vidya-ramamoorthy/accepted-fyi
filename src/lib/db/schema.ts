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
  state: varchar("state", { length: 2 }).notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  schoolType: schoolTypeEnum("school_type").notNull(),
  acceptanceRate: numeric("acceptance_rate", { precision: 5, scale: 2 }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const admissionSubmissions = pgTable(
  "admission_submissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => userProfiles.id),
    schoolId: uuid("school_id")
      .notNull()
      .references(() => schools.id),
    admissionCycle: varchar("admission_cycle", { length: 9 }).notNull(),
    decision: admissionDecisionEnum("decision").notNull(),
    gpaUnweighted: numeric("gpa_unweighted", { precision: 4, scale: 2 }),
    gpaWeighted: numeric("gpa_weighted", { precision: 4, scale: 2 }),
    satScore: integer("sat_score"),
    actScore: integer("act_score"),
    extracurriculars: text("extracurriculars").array().notNull().default([]),
    intendedMajor: varchar("intended_major", { length: 100 }),
    applicationRound: applicationRoundEnum("application_round").notNull(),
    stateOfResidence: varchar("state_of_residence", { length: 2 }).notNull(),
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
    uniqueIndex("unique_user_school_cycle").on(
      table.userId,
      table.schoolId,
      table.admissionCycle
    ),
  ]
);

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
