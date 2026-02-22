/**
 * College Scorecard Data Ingestion Script
 *
 * Fetches institutional admissions data from the US Department of Education's
 * College Scorecard API and upserts it into the schools table.
 *
 * Usage:
 *   npx tsx scripts/ingest-scorecard.ts
 *
 * Prerequisites:
 *   - Set COLLEGE_SCORECARD_API_KEY in .env.local
 *     (Get a free key at https://api.data.gov/signup/)
 *   - Set DATABASE_URL in .env.local
 *
 * The script fetches all 4-year degree-granting institutions, organized by state,
 * and stores admissions stats (acceptance rate, SAT/ACT ranges, enrollment).
 */

import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import { schools } from "../src/lib/db/schema";

const SCORECARD_API_KEY = process.env.COLLEGE_SCORECARD_API_KEY;
const DATABASE_URL = process.env.DATABASE_URL;

if (!SCORECARD_API_KEY) {
  console.error("Missing COLLEGE_SCORECARD_API_KEY. Get one free at https://api.data.gov/signup/");
  process.exit(1);
}

if (!DATABASE_URL) {
  console.error("Missing DATABASE_URL in environment.");
  process.exit(1);
}

const SCORECARD_BASE_URL = "https://api.data.gov/ed/collegescorecard/v1/schools";

// Fields to request from the API
const SCORECARD_FIELDS = [
  "id",
  "school.name",
  "school.city",
  "school.state",
  "school.school_url",
  "school.ownership", // 1=public, 2=private nonprofit, 3=private for-profit
  "latest.admissions.admission_rate.overall",
  "latest.admissions.sat_scores.average.overall",
  "latest.admissions.sat_scores.25th_percentile.critical_reading",
  "latest.admissions.sat_scores.75th_percentile.critical_reading",
  "latest.admissions.sat_scores.25th_percentile.math",
  "latest.admissions.sat_scores.75th_percentile.math",
  "latest.admissions.act_scores.midpoint.cumulative",
  "latest.admissions.act_scores.25th_percentile.cumulative",
  "latest.admissions.act_scores.75th_percentile.cumulative",
  "latest.student.size",
  "latest.admissions.admission_rate.overall",
].join(",");

// US state codes
const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
  "DC",
];

interface ScorecardSchool {
  id: number;
  "school.name": string;
  "school.city": string;
  "school.state": string;
  "school.school_url": string | null;
  "school.ownership": number;
  "latest.admissions.admission_rate.overall": number | null;
  "latest.admissions.sat_scores.average.overall": number | null;
  "latest.admissions.sat_scores.25th_percentile.critical_reading": number | null;
  "latest.admissions.sat_scores.75th_percentile.critical_reading": number | null;
  "latest.admissions.sat_scores.25th_percentile.math": number | null;
  "latest.admissions.sat_scores.75th_percentile.math": number | null;
  "latest.admissions.act_scores.midpoint.cumulative": number | null;
  "latest.admissions.act_scores.25th_percentile.cumulative": number | null;
  "latest.admissions.act_scores.75th_percentile.cumulative": number | null;
  "latest.student.size": number | null;
}

function mapOwnershipToSchoolType(ownership: number): "public" | "private" | "community_college" {
  switch (ownership) {
    case 1: return "public";
    case 2: return "private";
    case 3: return "private";
    default: return "private";
  }
}

function computeSatComposite25th(school: ScorecardSchool): number | null {
  const reading25 = school["latest.admissions.sat_scores.25th_percentile.critical_reading"];
  const math25 = school["latest.admissions.sat_scores.25th_percentile.math"];
  if (reading25 !== null && math25 !== null) {
    return reading25 + math25;
  }
  return null;
}

function computeSatComposite75th(school: ScorecardSchool): number | null {
  const reading75 = school["latest.admissions.sat_scores.75th_percentile.critical_reading"];
  const math75 = school["latest.admissions.sat_scores.75th_percentile.math"];
  if (reading75 !== null && math75 !== null) {
    return reading75 + math75;
  }
  return null;
}

async function fetchScorecardPage(
  state: string,
  page: number,
  perPage: number
): Promise<{ results: ScorecardSchool[]; totalResults: number }> {
  const url = new URL(SCORECARD_BASE_URL);
  url.searchParams.set("api_key", SCORECARD_API_KEY!);
  url.searchParams.set("school.state", state);
  url.searchParams.set("school.degrees_awarded.predominant", "3"); // 4-year institutions
  url.searchParams.set("school.operating", "1"); // currently operating
  url.searchParams.set("fields", SCORECARD_FIELDS);
  url.searchParams.set("per_page", perPage.toString());
  url.searchParams.set("page", page.toString());

  const response = await fetch(url.toString());

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Scorecard API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return {
    results: data.results || [],
    totalResults: data.metadata?.total || 0,
  };
}

async function fetchAllSchoolsForState(state: string): Promise<ScorecardSchool[]> {
  const perPage = 100;
  const allSchools: ScorecardSchool[] = [];

  const firstPage = await fetchScorecardPage(state, 0, perPage);
  allSchools.push(...firstPage.results);

  const totalPages = Math.ceil(firstPage.totalResults / perPage);

  for (let page = 1; page < totalPages; page++) {
    // Rate limit: stay well under 1000 req/hr
    await new Promise((resolve) => setTimeout(resolve, 200));
    const pageData = await fetchScorecardPage(state, page, perPage);
    allSchools.push(...pageData.results);
  }

  return allSchools;
}

async function main() {
  const connectionString = DATABASE_URL!;
  const client = postgres(connectionString);
  const db = drizzle(client);

  console.log("Starting College Scorecard data ingestion...\n");

  let totalInserted = 0;
  let totalUpdated = 0;
  let totalSkipped = 0;

  const stateSummary: Record<string, number> = {};

  for (const state of US_STATES) {
    process.stdout.write(`Fetching ${state}... `);

    try {
      const stateSchools = await fetchAllSchoolsForState(state);
      let stateCount = 0;

      for (const scorecardSchool of stateSchools) {
        const schoolName = scorecardSchool["school.name"];
        const schoolCity = scorecardSchool["school.city"];
        const schoolState = scorecardSchool["school.state"];
        const admissionRate = scorecardSchool["latest.admissions.admission_rate.overall"];

        // Skip schools with no admissions data at all
        if (!schoolName) {
          totalSkipped++;
          continue;
        }

        const schoolData = {
          name: schoolName,
          state: schoolState,
          city: schoolCity || "Unknown",
          schoolType: mapOwnershipToSchoolType(scorecardSchool["school.ownership"]),
          acceptanceRate: admissionRate !== null
            ? (admissionRate * 100).toFixed(2)
            : null,
          scorecardId: scorecardSchool.id,
          satAverage: scorecardSchool["latest.admissions.sat_scores.average.overall"],
          sat25thPercentile: computeSatComposite25th(scorecardSchool),
          sat75thPercentile: computeSatComposite75th(scorecardSchool),
          actMedian: scorecardSchool["latest.admissions.act_scores.midpoint.cumulative"],
          act25thPercentile: scorecardSchool["latest.admissions.act_scores.25th_percentile.cumulative"],
          act75thPercentile: scorecardSchool["latest.admissions.act_scores.75th_percentile.cumulative"],
          undergradEnrollment: scorecardSchool["latest.student.size"],
          institutionalDataYear: "2024-2025",
          website: scorecardSchool["school.school_url"],
          updatedAt: new Date(),
        };

        // Check if school exists by scorecard ID or name match
        const existingByScorecard = scorecardSchool.id
          ? await db.select().from(schools).where(eq(schools.scorecardId, scorecardSchool.id)).limit(1)
          : [];

        if (existingByScorecard.length > 0) {
          // Update existing school with latest institutional data
          await db
            .update(schools)
            .set(schoolData)
            .where(eq(schools.id, existingByScorecard[0].id));
          totalUpdated++;
        } else {
          // Check by name (may have been created via user submission)
          const existingByName = await db
            .select()
            .from(schools)
            .where(eq(schools.name, schoolName))
            .limit(1);

          if (existingByName.length > 0) {
            await db
              .update(schools)
              .set(schoolData)
              .where(eq(schools.id, existingByName[0].id));
            totalUpdated++;
          } else {
            await db.insert(schools).values(schoolData);
            totalInserted++;
          }
        }

        stateCount++;
      }

      stateSummary[state] = stateCount;
      console.log(`${stateCount} schools`);
    } catch (error) {
      console.log(`ERROR: ${error instanceof Error ? error.message : error}`);
    }

    // Small delay between states to be nice to the API
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  console.log("\n--- Ingestion Complete ---");
  console.log(`Inserted: ${totalInserted} new schools`);
  console.log(`Updated: ${totalUpdated} existing schools`);
  console.log(`Skipped: ${totalSkipped}`);
  console.log(`\nSchools by state:`);

  const sortedStates = Object.entries(stateSummary)
    .sort(([, countA], [, countB]) => countB - countA);

  for (const [state, count] of sortedStates) {
    console.log(`  ${state}: ${count}`);
  }

  await client.end();
  process.exit(0);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
