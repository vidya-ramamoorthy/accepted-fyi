import { relations } from "drizzle-orm/relations";
import { userProfiles, submissionFlags, admissionSubmissions, schools } from "./schema";

export const submissionFlagsRelations = relations(submissionFlags, ({one}) => ({
	userProfile: one(userProfiles, {
		fields: [submissionFlags.flaggedByUserId],
		references: [userProfiles.id]
	}),
	admissionSubmission: one(admissionSubmissions, {
		fields: [submissionFlags.submissionId],
		references: [admissionSubmissions.id]
	}),
}));

export const userProfilesRelations = relations(userProfiles, ({many}) => ({
	submissionFlags: many(submissionFlags),
	admissionSubmissions: many(admissionSubmissions),
}));

export const admissionSubmissionsRelations = relations(admissionSubmissions, ({one, many}) => ({
	submissionFlags: many(submissionFlags),
	school: one(schools, {
		fields: [admissionSubmissions.schoolId],
		references: [schools.id]
	}),
	userProfile: one(userProfiles, {
		fields: [admissionSubmissions.userId],
		references: [userProfiles.id]
	}),
}));

export const schoolsRelations = relations(schools, ({many}) => ({
	admissionSubmissions: many(admissionSubmissions),
}));