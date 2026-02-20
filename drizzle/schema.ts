import { pgTable, uuid, varchar, numeric, timestamp, foreignKey, text, unique, boolean, uniqueIndex, integer, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const admissionDecision = pgEnum("admission_decision", ['accepted', 'rejected', 'waitlisted', 'deferred'])
export const applicationRound = pgEnum("application_round", ['early_decision', 'early_action', 'regular', 'rolling'])
export const schoolType = pgEnum("school_type", ['public', 'private', 'community_college'])
export const submissionStatus = pgEnum("submission_status", ['pending_review', 'visible', 'hidden', 'flagged'])
export const verificationTier = pgEnum("verification_tier", ['bronze', 'silver', 'gold'])


export const schools = pgTable("schools", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	state: varchar({ length: 2 }).notNull(),
	city: varchar({ length: 100 }).notNull(),
	schoolType: schoolType("school_type").notNull(),
	acceptanceRate: numeric("acceptance_rate", { precision: 5, scale:  2 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const submissionFlags = pgTable("submission_flags", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	submissionId: uuid("submission_id").notNull(),
	flaggedByUserId: uuid("flagged_by_user_id").notNull(),
	reason: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.flaggedByUserId],
			foreignColumns: [userProfiles.id],
			name: "submission_flags_flagged_by_user_id_user_profiles_id_fk"
		}),
	foreignKey({
			columns: [table.submissionId],
			foreignColumns: [admissionSubmissions.id],
			name: "submission_flags_submission_id_admission_submissions_id_fk"
		}),
]);

export const userProfiles = pgTable("user_profiles", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	authUserId: uuid("auth_user_id").notNull(),
	email: text().notNull(),
	displayName: varchar("display_name", { length: 100 }).notNull(),
	hasSubmitted: boolean("has_submitted").default(false).notNull(),
	verificationTier: verificationTier("verification_tier").default('bronze').notNull(),
	eduEmail: text("edu_email"),
	eduEmailVerified: boolean("edu_email_verified").default(false).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("user_profiles_auth_user_id_unique").on(table.authUserId),
]);

export const admissionSubmissions = pgTable("admission_submissions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	schoolId: uuid("school_id").notNull(),
	admissionCycle: varchar("admission_cycle", { length: 9 }).notNull(),
	decision: admissionDecision().notNull(),
	gpaUnweighted: numeric("gpa_unweighted", { precision: 4, scale:  2 }),
	gpaWeighted: numeric("gpa_weighted", { precision: 4, scale:  2 }),
	satScore: integer("sat_score"),
	actScore: integer("act_score"),
	extracurriculars: text().array().default([""]).notNull(),
	intendedMajor: varchar("intended_major", { length: 100 }),
	applicationRound: applicationRound("application_round").notNull(),
	stateOfResidence: varchar("state_of_residence", { length: 2 }).notNull(),
	verificationTier: verificationTier("verification_tier").default('bronze').notNull(),
	submissionStatus: submissionStatus("submission_status").default('pending_review').notNull(),
	flagCount: integer("flag_count").default(0).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("unique_user_school_cycle").using("btree", table.userId.asc().nullsLast().op("text_ops"), table.schoolId.asc().nullsLast().op("text_ops"), table.admissionCycle.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.schoolId],
			foreignColumns: [schools.id],
			name: "admission_submissions_school_id_schools_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [userProfiles.id],
			name: "admission_submissions_user_id_user_profiles_id_fk"
		}),
]);
