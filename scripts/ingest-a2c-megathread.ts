/**
 * A2C "Off the Waitlist" Megathread Ingestion
 *
 * Fetches comments from a r/ApplyingToCollege waitlist megathread, parses each
 * top-level comment for school + outcome, and inserts as anonymous reddit-sourced
 * waitlist movement records.
 *
 * Why a separate script: r/collegeresults posts follow a structured template
 * (handled by ingest-reddit-ai.ts). A2C megathreads are comment trees with one
 * decision per top-level comment, requiring a different parse path.
 *
 * Usage:
 *   npx tsx scripts/ingest-a2c-megathread.ts --thread-id 1abc23 --dry-run
 *   npx tsx scripts/ingest-a2c-megathread.ts --thread-id 1abc23 --cycle 2025-2026
 *   npx tsx scripts/ingest-a2c-megathread.ts --thread-id 1abc23 --limit 200
 *
 * Find the thread ID from the megathread URL: reddit.com/r/ApplyingToCollege/comments/<ID>/...
 *
 * Prerequisites:
 *   - DATABASE_URL in .env.production
 *
 * Re-runs are safe: dedup uses (source_post_id = comment.id, school_id) and
 * onConflictDoNothing(). Schedule weekly through May–June.
 */

import * as fs from "fs";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq, and, ilike, inArray } from "drizzle-orm";
import { admissionSubmissions, schools } from "../src/lib/db/schema";
import { resolveSchoolAbbreviation } from "../src/lib/constants/school-abbreviations";
import { parseWaitlistComment } from "../src/lib/parsers/waitlist-comment";

const envFile = fs.readFileSync(".env.production", "utf8");
for (const line of envFile.split("\n")) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) process.env[match[1].trim()] = match[2].trim();
}

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("Missing DATABASE_URL in .env.production");
  process.exit(1);
}

const args = process.argv.slice(2);
function getArg(name: string): string | null {
  const index = args.indexOf(`--${name}`);
  if (index === -1) return null;
  return args[index + 1] ?? null;
}

const DRY_RUN = args.includes("--dry-run");
const THREAD_ID = getArg("thread-id");
const LIMIT = getArg("limit") ? parseInt(getArg("limit")!, 10) : null;
const CYCLE_OVERRIDE = getArg("cycle");

if (!THREAD_ID) {
  console.error("Missing --thread-id (find it in the megathread URL: reddit.com/r/ApplyingToCollege/comments/<ID>/...)");
  process.exit(1);
}
const threadId: string = THREAD_ID;

if (CYCLE_OVERRIDE && !/^\d{4}-\d{4}$/.test(CYCLE_OVERRIDE)) {
  console.error("--cycle must be YYYY-YYYY format (e.g., 2025-2026)");
  process.exit(1);
}

const pgClient = postgres(DATABASE_URL, { max: 5 });
const db = drizzle(pgClient);

interface ArcticShiftComment {
  id: string;
  body: string;
  author: string;
  created_utc: number;
  parent_id: string;
  link_id: string;
  permalink: string;
}

async function fetchTopLevelComments(threadId: string): Promise<ArcticShiftComment[]> {
  const linkPrefix = `t3_${threadId}`;
  const results: ArcticShiftComment[] = [];
  let after = 0;
  const pageSize = 100;

  console.log(`Fetching comments for thread ${threadId}...`);

  while (true) {
    const url = `https://arctic-shift.photon-reddit.com/api/comments/search?link_id=${threadId}&after=${after}&limit=${pageSize}&sort=asc&sort_type=created_utc`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Arctic Shift fetch failed: ${response.status} ${response.statusText}`);
    }
    const data = (await response.json()) as { data: ArcticShiftComment[] };
    if (!data.data || data.data.length === 0) break;

    const topLevelOnly = data.data.filter((c) => c.parent_id === linkPrefix);
    results.push(...topLevelOnly);

    if (data.data.length < pageSize) break;
    after = data.data[data.data.length - 1].created_utc;
    process.stdout.write(`  fetched ${results.length} top-level comments\r`);
  }

  console.log(`\n  ${results.length} top-level comments collected`);
  return results;
}

const schoolNameCache = new Map<string, string | null>();

async function resolveSchoolId(rawName: string): Promise<string | null> {
  const normalized = rawName.trim();
  if (schoolNameCache.has(normalized)) {
    return schoolNameCache.get(normalized)!;
  }

  const [exactMatch] = await db
    .select({ id: schools.id })
    .from(schools)
    .where(ilike(schools.name, normalized))
    .limit(1);
  if (exactMatch) {
    schoolNameCache.set(normalized, exactMatch.id);
    return exactMatch.id;
  }

  const abbreviationMatches = resolveSchoolAbbreviation(normalized);
  if (abbreviationMatches.length > 0) {
    const [abbrMatch] = await db
      .select({ id: schools.id })
      .from(schools)
      .where(inArray(schools.name, abbreviationMatches))
      .limit(1);
    if (abbrMatch) {
      schoolNameCache.set(normalized, abbrMatch.id);
      return abbrMatch.id;
    }
  }

  const stripped = normalized.replace(/[^a-zA-Z0-9\s]/g, "").trim();
  if (stripped.length >= 4) {
    const [partialMatch] = await db
      .select({ id: schools.id })
      .from(schools)
      .where(ilike(schools.name, `%${stripped}%`))
      .limit(1);
    if (partialMatch) {
      schoolNameCache.set(normalized, partialMatch.id);
      return partialMatch.id;
    }
  }

  schoolNameCache.set(normalized, null);
  return null;
}

function inferAdmissionCycle(commentCreatedUtcSeconds: number): string {
  if (CYCLE_OVERRIDE) return CYCLE_OVERRIDE;
  const date = new Date(commentCreatedUtcSeconds * 1000);
  const month = date.getUTCMonth();
  const year = date.getUTCFullYear();
  // Waitlist movement happens Apr–Aug for current cycle. Comments before Apr
  // (rare for movement threads) map to prior cycle.
  if (month >= 7) {
    return `${year}-${year + 1}`;
  }
  return `${year - 1}-${year}`;
}

async function ingest() {
  console.log("=== A2C Megathread Ingestion ===");
  console.log(`Mode: ${DRY_RUN ? "DRY RUN (no DB writes)" : "LIVE"}`);
  console.log(`Thread: ${THREAD_ID}`);
  console.log(`Limit: ${LIMIT ?? "all"}`);
  console.log(`Cycle override: ${CYCLE_OVERRIDE ?? "auto-infer from comment date"}\n`);

  const comments = await fetchTopLevelComments(threadId);
  const toProcess = LIMIT ? comments.slice(0, LIMIT) : comments;

  let parsedCount = 0;
  let insertedCount = 0;
  let skippedExistingCount = 0;
  let skippedUnparsedCount = 0;
  let skippedNoSchoolMatchCount = 0;
  const unmatchedSchools: string[] = [];

  for (const comment of toProcess) {
    if (!comment.body || comment.body === "[deleted]" || comment.body === "[removed]") {
      skippedUnparsedCount++;
      continue;
    }

    const parsed = parseWaitlistComment(comment.body);
    if (!parsed) {
      skippedUnparsedCount++;
      continue;
    }

    parsedCount++;
    const schoolId = await resolveSchoolId(parsed.schoolName);
    if (!schoolId) {
      unmatchedSchools.push(parsed.schoolName);
      skippedNoSchoolMatchCount++;
      continue;
    }

    if (DRY_RUN) {
      insertedCount++;
      continue;
    }

    const cycle = inferAdmissionCycle(comment.created_utc);
    const sourceUrl = `https://www.reddit.com${comment.permalink ?? `/r/ApplyingToCollege/comments/${threadId}/_/${comment.id}/`}`;

    const result = await db
      .insert(admissionSubmissions)
      .values({
        userId: null,
        schoolId,
        dataSource: "reddit",
        sourceUrl,
        sourcePostId: comment.id,
        admissionCycle: cycle,
        decision: "waitlisted",
        applicationRound: "regular",
        gpaUnweighted: null,
        gpaWeighted: null,
        satScore: null,
        actScore: null,
        intendedMajor: null,
        stateOfResidence: "XX",
        extracurriculars: [],
        applicantHighlight: null,
        highSchoolType: null,
        firstGeneration: null,
        legacyStatus: null,
        financialAidApplied: null,
        geographicClassification: null,
        apCoursesCount: null,
        ibCoursesCount: null,
        honorsCoursesCount: null,
        scholarshipOffered: null,
        willAttend: null,
        waitlistOutcome: parsed.outcome,
        verificationTier: "bronze",
        submissionStatus: "visible",
      })
      .onConflictDoNothing()
      .returning({ id: admissionSubmissions.id });

    if (result.length > 0) {
      insertedCount++;
    } else {
      skippedExistingCount++;
    }
  }

  console.log("\n=== Summary ===");
  console.log(`Top-level comments fetched: ${toProcess.length}`);
  console.log(`Parsed (school + outcome found): ${parsedCount}`);
  console.log(`Inserted: ${insertedCount}`);
  console.log(`Skipped (already in DB): ${skippedExistingCount}`);
  console.log(`Skipped (no parse match): ${skippedUnparsedCount}`);
  console.log(`Skipped (no school match): ${skippedNoSchoolMatchCount}`);

  if (unmatchedSchools.length > 0) {
    const counts = new Map<string, number>();
    for (const name of unmatchedSchools) {
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    const top = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20);
    console.log("\nTop unmatched school names:");
    for (const [name, count] of top) {
      console.log(`  ${count}× ${name}`);
    }
  }

  await pgClient.end();
}

ingest().catch((error) => {
  console.error("Ingest failed:", error);
  pgClient.end().finally(() => process.exit(1));
});
