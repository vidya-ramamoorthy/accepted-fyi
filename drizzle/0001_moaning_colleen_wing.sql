-- Idempotent migration: uses IF NOT EXISTS / DO blocks for objects that may already exist.
-- The DB was previously kept in sync via db:push; this migration catches up the migration history
-- and adds: partial unique indexes + CHECK constraint for Reddit data ingestion.

DO $$ BEGIN
  CREATE TYPE "public"."attendance_intent" AS ENUM('yes', 'no', 'undecided');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."data_source" AS ENUM('user', 'reddit', 'college_confidential', 'public_scraped');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."geographic_classification" AS ENUM('rural', 'suburban', 'urban');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."high_school_type" AS ENUM('public', 'private', 'charter', 'magnet', 'homeschool', 'international');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."scholarship_type" AS ENUM('none', 'merit', 'need_based', 'both');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."waitlist_outcome" AS ENUM('accepted_off_waitlist', 'rejected_off_waitlist', 'withdrew');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "decision_timelines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"admission_cycle" varchar(9) NOT NULL,
	"application_round" "application_round" NOT NULL,
	"expected_date" timestamp with time zone,
	"actual_date" timestamp with time zone,
	"is_confirmed" boolean DEFAULT false NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP INDEX IF EXISTS "unique_user_school_cycle";--> statement-breakpoint
ALTER TABLE "admission_submissions" ALTER COLUMN "user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "admission_submissions" ALTER COLUMN "extracurriculars" SET DEFAULT '{}';--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "admission_submissions" ALTER COLUMN "state_of_residence" DROP NOT NULL;
EXCEPTION WHEN others THEN NULL;
END $$;--> statement-breakpoint
ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "slug" varchar(300);--> statement-breakpoint
ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "scorecard_id" integer;--> statement-breakpoint
ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "sat_average" integer;--> statement-breakpoint
ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "sat_25th_percentile" integer;--> statement-breakpoint
ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "sat_75th_percentile" integer;--> statement-breakpoint
ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "act_median" integer;--> statement-breakpoint
ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "act_25th_percentile" integer;--> statement-breakpoint
ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "act_75th_percentile" integer;--> statement-breakpoint
ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "undergrad_enrollment" integer;--> statement-breakpoint
ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "admissions_total" integer;--> statement-breakpoint
ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "applicants_total" integer;--> statement-breakpoint
ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "institutional_data_year" varchar(9);--> statement-breakpoint
ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "website" text;--> statement-breakpoint
ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "ed_applicants" integer;--> statement-breakpoint
ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "ed_admitted" integer;--> statement-breakpoint
ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "ea_applicants" integer;--> statement-breakpoint
ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "ea_admitted" integer;--> statement-breakpoint
ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "waitlist_offered" integer;--> statement-breakpoint
ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "waitlist_accepted" integer;--> statement-breakpoint
ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "waitlist_admitted" integer;--> statement-breakpoint
ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "factor_gpa" varchar(20);--> statement-breakpoint
ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "factor_class_rank" varchar(20);--> statement-breakpoint
ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "factor_test_scores" varchar(20);--> statement-breakpoint
ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "factor_essay" varchar(20);--> statement-breakpoint
ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "factor_recommendations" varchar(20);--> statement-breakpoint
ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "factor_extracurriculars" varchar(20);--> statement-breakpoint
ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "factor_talent_ability" varchar(20);--> statement-breakpoint
ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "factor_character" varchar(20);--> statement-breakpoint
ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "factor_first_gen" varchar(20);--> statement-breakpoint
ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "factor_alumni_relation" varchar(20);--> statement-breakpoint
ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "factor_geographic" varchar(20);--> statement-breakpoint
ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "factor_state_residency" varchar(20);--> statement-breakpoint
ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "factor_volunteer" varchar(20);--> statement-breakpoint
ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "factor_work_experience" varchar(20);--> statement-breakpoint
ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "factor_demonstrated_interest" varchar(20);--> statement-breakpoint
ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "gpa_percent_4_00" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "gpa_percent_3_75_to_3_99" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "gpa_percent_3_50_to_3_74" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "gpa_percent_3_25_to_3_49" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "gpa_percent_3_00_to_3_24" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "gpa_percent_below_3_00" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "percent_need_met" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "avg_financial_aid_package" integer;--> statement-breakpoint
ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "percent_receiving_merit_aid" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "avg_merit_aid_amount" integer;--> statement-breakpoint
ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "cds_data_year" varchar(9);--> statement-breakpoint
ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "cds_source_url" text;--> statement-breakpoint
ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "admission_submissions" ADD COLUMN IF NOT EXISTS "data_source" "data_source" DEFAULT 'user' NOT NULL;--> statement-breakpoint
ALTER TABLE "admission_submissions" ADD COLUMN IF NOT EXISTS "source_url" text;--> statement-breakpoint
ALTER TABLE "admission_submissions" ADD COLUMN IF NOT EXISTS "source_post_id" varchar(100);--> statement-breakpoint
ALTER TABLE "admission_submissions" ADD COLUMN IF NOT EXISTS "high_school_type" "high_school_type";--> statement-breakpoint
ALTER TABLE "admission_submissions" ADD COLUMN IF NOT EXISTS "first_generation" boolean;--> statement-breakpoint
ALTER TABLE "admission_submissions" ADD COLUMN IF NOT EXISTS "legacy_status" boolean;--> statement-breakpoint
ALTER TABLE "admission_submissions" ADD COLUMN IF NOT EXISTS "financial_aid_applied" boolean;--> statement-breakpoint
ALTER TABLE "admission_submissions" ADD COLUMN IF NOT EXISTS "geographic_classification" "geographic_classification";--> statement-breakpoint
ALTER TABLE "admission_submissions" ADD COLUMN IF NOT EXISTS "ap_courses_count" integer;--> statement-breakpoint
ALTER TABLE "admission_submissions" ADD COLUMN IF NOT EXISTS "ib_courses_count" integer;--> statement-breakpoint
ALTER TABLE "admission_submissions" ADD COLUMN IF NOT EXISTS "honors_courses_count" integer;--> statement-breakpoint
ALTER TABLE "admission_submissions" ADD COLUMN IF NOT EXISTS "scholarship_offered" "scholarship_type";--> statement-breakpoint
ALTER TABLE "admission_submissions" ADD COLUMN IF NOT EXISTS "will_attend" "attendance_intent";--> statement-breakpoint
ALTER TABLE "admission_submissions" ADD COLUMN IF NOT EXISTS "waitlist_outcome" "waitlist_outcome";--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "decision_timelines" ADD CONSTRAINT "decision_timelines_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "unique_scraped_source_school" ON "admission_submissions" USING btree ("source_post_id","school_id") WHERE user_id IS NULL AND source_post_id IS NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_submissions_school_id" ON "admission_submissions" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_submissions_user_id" ON "admission_submissions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_submissions_decision" ON "admission_submissions" USING btree ("decision");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_submissions_status" ON "admission_submissions" USING btree ("submission_status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_submissions_created_at" ON "admission_submissions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_submissions_data_source" ON "admission_submissions" USING btree ("data_source");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "unique_user_school_cycle" ON "admission_submissions" USING btree ("user_id","school_id","admission_cycle") WHERE user_id IS NOT NULL;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "schools" ADD CONSTRAINT "schools_slug_unique" UNIQUE("slug");
EXCEPTION WHEN others THEN NULL;
END $$;--> statement-breakpoint
ALTER TABLE "admission_submissions" DROP CONSTRAINT IF EXISTS "user_submissions_require_user_id";--> statement-breakpoint
ALTER TABLE "admission_submissions" ADD CONSTRAINT "user_submissions_require_user_id" CHECK (data_source = 'user' AND user_id IS NOT NULL OR data_source != 'user');