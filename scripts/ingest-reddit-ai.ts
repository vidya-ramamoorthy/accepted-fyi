/**
 * AI-Powered Reddit r/collegeresults Ingestion Script
 *
 * Uses Claude Haiku to parse unstructured Reddit posts into structured
 * admissions data. Handles every format variation that the regex parser misses.
 *
 * Usage:
 *   npx tsx scripts/ingest-reddit-ai.ts --limit 100 --dry-run   # Preview 100 posts, no DB writes
 *   npx tsx scripts/ingest-reddit-ai.ts --limit 100              # Parse and insert 100 posts
 *   npx tsx scripts/ingest-reddit-ai.ts                           # Parse all remaining posts
 *   npx tsx scripts/ingest-reddit-ai.ts --after 2022-01-01       # Only posts after a date
 *
 * Prerequisites:
 *   - ANTHROPIC_API_KEY in .env.production (or environment)
 *   - DATABASE_URL in .env.production
 *
 * Cost estimate: ~$0.01 per post with Haiku 4.5
 */

import * as fs from "fs";
import Anthropic from "@anthropic-ai/sdk";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq, and, sql, ilike, inArray } from "drizzle-orm";
import { admissionSubmissions, schools } from "../src/lib/db/schema";
import { resolveSchoolAbbreviation } from "../src/lib/constants/school-abbreviations";

// ─── Load environment ───────────────────────────────────────────────────────

const envFile = fs.readFileSync(".env.production", "utf8");
for (const line of envFile.split("\n")) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) process.env[match[1].trim()] = match[2].trim();
}

const DATABASE_URL = process.env.DATABASE_URL;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

if (!DATABASE_URL) {
  console.error("Missing DATABASE_URL in .env.production");
  process.exit(1);
}
if (!ANTHROPIC_API_KEY) {
  console.error("Missing ANTHROPIC_API_KEY in .env.production");
  console.error("Get one at: https://console.anthropic.com/settings/keys");
  process.exit(1);
}

// ─── CLI args ───────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
function getArg(name: string): string | null {
  const index = args.indexOf(`--${name}`);
  if (index === -1) return null;
  return args[index + 1] ?? null;
}
const DRY_RUN = args.includes("--dry-run");
const REPROCESS = args.includes("--reprocess");
const LIMIT = getArg("limit") ? parseInt(getArg("limit")!, 10) : null;
const AFTER_DATE = getArg("after") ?? "2018-01-01";

// ─── Init clients ───────────────────────────────────────────────────────────

const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
const pgClient = postgres(DATABASE_URL, { max: 5 });
const db = drizzle(pgClient);

// ─── Types ──────────────────────────────────────────────────────────────────

interface ArcticShiftPost {
  id: string;
  title: string;
  selftext: string;
  author: string;
  created_utc: number;
  permalink: string;
  score: number;
}

interface ParsedDecision {
  schoolName: string;
  decision: "accepted" | "rejected" | "waitlisted" | "deferred";
  applicationRound: "early_decision" | "early_action" | "regular" | "rolling" | null;
}

interface ClaudeParsedPost {
  hasAdmissionsData: boolean;
  admissionCycle: string | null;
  demographics: {
    gender: string | null;
    ethnicity: string | null;
    stateOfResidence: string | null;
    highSchoolType: "public" | "private" | "charter" | "magnet" | "homeschool" | "international" | null;
    firstGeneration: boolean | null;
    legacyStatus: boolean | null;
    geographicClassification: "rural" | "suburban" | "urban" | null;
  };
  academics: {
    gpaUnweighted: number | null;
    gpaWeighted: number | null;
    satScore: number | null;
    actScore: number | null;
    apCoursesCount: number | null;
    ibCoursesCount: number | null;
    honorsCoursesCount: number | null;
  };
  intendedMajor: string | null;
  extracurriculars: string[];
  awards: string[];
  decisions: ParsedDecision[];
}

// ─── Claude parsing prompt ──────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a structured data extractor for college admissions posts from Reddit's r/collegeresults.

Given a Reddit post, extract ALL admissions data into the exact JSON schema below. Posts vary wildly in format: some use the official template with bold headers, others are freeform prose, some use comma-separated lists, some use numbered lists, some use spoiler tags.

Your job: extract every piece of data regardless of formatting.

RULES:
- If information is not present, use null (for scalars) or [] (for arrays)
- For admissionCycle: Determine which application cycle the results are from. Use the format "YYYY-YYYY" (e.g., "2024-2025" for Class of 2029, "2025-2026" for Class of 2030). Look for clues in the title and body: "Class of 20XX", "co 20XX", "c/o 20XX", "results from X years ago", "last year's cycle", graduation year mentions, or explicit cycle references. If the poster says "Class of 2029" or "co 2029", the cycle is "2024-2025". If they say "results from 2 years ago" and the post is from 2026, the cycle is "2023-2024". Return null ONLY if there is zero indication of which cycle the results belong to.
- For GPA: unweighted is out of 4.0, weighted can be higher. If only one number is given and it's <= 4.0, treat as unweighted. If > 4.0, treat as weighted.
- For SAT: must be 400-1600. Ignore SAT Subject Test scores.
- For ACT: must be 1-36. Use composite score only.
- For AP/IB/Honors counts: count the number of courses listed, or use the stated count.
- For state: use 2-letter US state abbreviation. For international students, use "INTL".
- For decisions: extract EVERY school mentioned with a decision. "Withdrew" or "Canceled" are NOT decisions; skip those schools.
- For application round: ED, ED1, ED2 = "early_decision". EA, REA, SCEA = "early_action". RD = "regular". Rolling = "rolling". If not stated, use null.
- For school names: use the full official name (e.g., "Massachusetts Institute of Technology" not "MIT", "University of California, Los Angeles" not "UCLA"). If you're unsure of the full name, use whatever the poster wrote.
- For extracurriculars: extract each activity as a short string (under 150 chars). Include leadership roles and time commitments if mentioned.
- For awards: extract each award/honor as a separate string.
- Set hasAdmissionsData to false if the post is a discussion/meta post with no personal admissions results.
- Set hasAdmissionsData to false if the post is asking others to PREDICT, GUESS, or CHANCE their results (e.g., "predict my results", "guess where I got in", "chance me", "what are my odds"). These are NOT real decisions. Only extract decisions the poster has ACTUALLY RECEIVED.
- Set hasAdmissionsData to false if the post lists schools as "pending", "waiting", or "applied" without actual accept/reject/waitlist/defer outcomes.

Respond with ONLY valid JSON, no markdown fences, no explanation.`;

const USER_PROMPT_TEMPLATE = `Extract structured admissions data from this Reddit post:

TITLE: {{TITLE}}

BODY:
{{BODY}}

Respond with this exact JSON schema:
{
  "hasAdmissionsData": boolean,
  "admissionCycle": "YYYY-YYYY" | null,
  "demographics": {
    "gender": string | null,
    "ethnicity": string | null,
    "stateOfResidence": "XX" | "INTL" | null,
    "highSchoolType": "public" | "private" | "charter" | "magnet" | "homeschool" | "international" | null,
    "firstGeneration": boolean | null,
    "legacyStatus": boolean | null,
    "geographicClassification": "rural" | "suburban" | "urban" | null
  },
  "academics": {
    "gpaUnweighted": number | null,
    "gpaWeighted": number | null,
    "satScore": number | null,
    "actScore": number | null,
    "apCoursesCount": number | null,
    "ibCoursesCount": number | null,
    "honorsCoursesCount": number | null
  },
  "intendedMajor": string | null,
  "extracurriculars": ["activity 1", "activity 2", ...],
  "awards": ["award 1", "award 2", ...],
  "decisions": [
    {
      "schoolName": "Full School Name",
      "decision": "accepted" | "rejected" | "waitlisted" | "deferred",
      "applicationRound": "early_decision" | "early_action" | "regular" | "rolling" | null
    }
  ]
}`;

// ─── Arctic Shift fetching ──────────────────────────────────────────────────

async function fetchPostsFromArcticShift(
  afterDate: string,
  limit: number | null
): Promise<ArcticShiftPost[]> {
  const allPosts: ArcticShiftPost[] = [];
  const afterTimestamp = Math.floor(new Date(afterDate).getTime() / 1000);
  const batchSize = 100;
  let currentAfter = afterTimestamp;
  const effectiveLimit = limit ?? 100000;

  console.log(`Fetching posts from Arctic Shift (after ${afterDate})...`);

  while (allPosts.length < effectiveLimit) {
    const remaining = effectiveLimit - allPosts.length;
    const fetchSize = Math.min(batchSize, remaining);
    const url = `https://arctic-shift.photon-reddit.com/api/posts/search?subreddit=collegeresults&after=${currentAfter}&limit=${fetchSize}&sort=asc&sort_type=created_utc`;

    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Arctic Shift API error: ${response.status}`);
      break;
    }

    const data = await response.json();
    const posts: ArcticShiftPost[] = data.data ?? [];

    if (posts.length === 0) break;

    allPosts.push(...posts);
    currentAfter = posts[posts.length - 1].created_utc;

    console.log(`  Fetched ${allPosts.length} posts so far (up to ${new Date(currentAfter * 1000).toISOString().slice(0, 10)})`);

    if (posts.length < fetchSize) break;

    // Rate limit: be nice to Arctic Shift
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  return allPosts;
}

// ─── Filter out already-ingested posts ──────────────────────────────────────

async function filterNewPosts(posts: ArcticShiftPost[]): Promise<ArcticShiftPost[]> {
  if (posts.length === 0) return [];

  // Get all source_post_ids already in DB
  const postIds = posts.map((p) => p.id);

  // Query in batches of 500 to avoid parameter limits
  const existingPostIds = new Set<string>();
  for (let i = 0; i < postIds.length; i += 500) {
    const batch = postIds.slice(i, i + 500);
    const existing = await db
      .selectDistinct({ sourcePostId: admissionSubmissions.sourcePostId })
      .from(admissionSubmissions)
      .where(inArray(admissionSubmissions.sourcePostId, batch));
    for (const row of existing) {
      if (row.sourcePostId) existingPostIds.add(row.sourcePostId);
    }
  }

  const newPosts = posts.filter((p) => !existingPostIds.has(p.id));
  console.log(`\n${posts.length} total posts fetched, ${existingPostIds.size} already in DB, ${newPosts.length} new to parse`);
  return newPosts;
}

// ─── Call Claude to parse a post ────────────────────────────────────────────

async function parsePostWithClaude(post: ArcticShiftPost): Promise<ClaudeParsedPost | null> {
  const selftext = post.selftext ?? "";
  if (!selftext || selftext === "[deleted]" || selftext === "[removed]" || selftext.length < 50) {
    return null;
  }

  // Pre-filter: skip posts unlikely to contain admissions decisions (saves API cost)
  // Must mention at least one decision-related keyword in title or body
  const combinedText = (post.title + " " + selftext).toLowerCase();
  const hasDecisionKeyword = /\b(accepted|rejected|waitlisted|deferred|admitted|denied|got in(?:to)?|acceptances?|rejections?|decisions?)\b/.test(combinedText);
  if (!hasDecisionKeyword) {
    return null;
  }

  // Truncate very long posts to save tokens
  const truncatedBody = selftext.length > 4000 ? selftext.slice(0, 4000) + "\n[truncated]" : selftext;

  const userPrompt = USER_PROMPT_TEMPLATE
    .replace("{{TITLE}}", post.title)
    .replace("{{BODY}}", truncatedBody);

  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";

    // Strip markdown fences if present
    const jsonText = text.replace(/^```json?\s*\n?/, "").replace(/\n?```\s*$/, "").trim();

    const parsed: ClaudeParsedPost = JSON.parse(jsonText);
    return parsed;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`  Failed to parse post ${post.id}: ${errorMessage}`);
    return null;
  }
}

// ─── School name resolution ─────────────────────────────────────────────────

const schoolNameCache = new Map<string, string | null>();

async function resolveSchoolId(schoolName: string): Promise<string | null> {
  const normalizedName = schoolName.trim();
  if (schoolNameCache.has(normalizedName)) {
    return schoolNameCache.get(normalizedName)!;
  }

  // Hard-coded overrides for names Claude consistently gets wrong
  const FULL_NAME_OVERRIDES: Record<string, string> = {
    "Texas A&M University": "Texas A&M University-College Station",
    "Texas A & M University": "Texas A&M University-College Station",
    "College of William and Mary": "William & Mary",
    "College of William & Mary": "William & Mary",
    "California Polytechnic State University, Pomona": "California State Polytechnic University-Pomona",
    "Cal Poly Pomona": "California State Polytechnic University-Pomona",
    "Cal Poly San Luis Obispo": "California Polytechnic State University-San Luis Obispo",
    "University of Illinois at Urbana-Champaign": "University of Illinois Urbana-Champaign",
    "University of Illinois at Urbana Champaign": "University of Illinois Urbana-Champaign",
    "University of Washington, Seattle": "University of Washington-Seattle Campus",
    "Columbia University School of Engineering and Applied Science": "Columbia University in the City of New York",
    "Columbia University": "Columbia University in the City of New York",
    "University of Massachusetts Amherst": "University of Massachusetts-Amherst",
    "UMass Amherst": "University of Massachusetts-Amherst",
    "University of Minnesota": "University of Minnesota-Twin Cities",
    "University of Minnesota, Twin Cities": "University of Minnesota-Twin Cities",
  };

  const overrideName = FULL_NAME_OVERRIDES[normalizedName];
  if (overrideName) {
    const [overrideMatch] = await db
      .select({ id: schools.id })
      .from(schools)
      .where(ilike(schools.name, overrideName))
      .limit(1);
    if (overrideMatch) {
      schoolNameCache.set(normalizedName, overrideMatch.id);
      return overrideMatch.id;
    }
  }

  // Generate name variants: comma→hyphen, hyphen→comma, "at"→hyphen, etc.
  const nameVariants = [
    normalizedName,
    normalizedName.replace(/,\s*/g, "-"),           // "University of California, Berkeley" → "University of California-Berkeley"
    normalizedName.replace(/-/g, ", "),              // reverse
    normalizedName.replace(/\s+at\s+/i, "-"),       // "University of X at Y" → "University of X-Y"
    normalizedName.replace(/ College$/, " University"),  // try University suffix
    normalizedName.replace(/ University$/, " College"),  // try College suffix
  ];

  for (const variant of nameVariants) {
    // 1. Try exact match
    const [exactMatch] = await db
      .select({ id: schools.id })
      .from(schools)
      .where(ilike(schools.name, variant))
      .limit(1);

    if (exactMatch) {
      schoolNameCache.set(normalizedName, exactMatch.id);
      return exactMatch.id;
    }
  }

  // 2. Try abbreviation resolution
  const abbreviationMatches = resolveSchoolAbbreviation(normalizedName);
  if (abbreviationMatches.length > 0) {
    const [abbrMatch] = await db
      .select({ id: schools.id })
      .from(schools)
      .where(inArray(schools.name, abbreviationMatches))
      .limit(1);
    if (abbrMatch) {
      schoolNameCache.set(normalizedName, abbrMatch.id);
      return abbrMatch.id;
    }
  }

  // 3. Try partial ILIKE match (strip punctuation first)
  const partialName = normalizedName.replace(/[^a-zA-Z0-9\s]/g, "").trim();
  if (partialName.length >= 4) {
    const [partialMatch] = await db
      .select({ id: schools.id })
      .from(schools)
      .where(ilike(schools.name, `%${partialName}%`))
      .limit(1);
    if (partialMatch) {
      schoolNameCache.set(normalizedName, partialMatch.id);
      return partialMatch.id;
    }
  }

  schoolNameCache.set(normalizedName, null);
  return null;
}

// ─── Admission cycle from post date (fallback only) ─────────────────────────
// NOTE: On r/collegeresults, people often post results months after decisions.
// A post from Aug-Nov likely contains PREVIOUS cycle results (student posting
// after starting college). Only Dec-Jul posts reliably map to a specific cycle.

function parseAdmissionCycle(createdUtc: number): string {
  const postDate = new Date(createdUtc * 1000);
  const year = postDate.getFullYear();
  const month = postDate.getMonth() + 1;

  // Aug-Nov: most r/collegeresults posts are from students sharing PREVIOUS
  // cycle results after starting college. Map to previous cycle.
  if (month >= 8 && month <= 11) return `${year - 1}-${year}`;

  // Dec: ambiguous — could be EA/ED for current cycle or late previous cycle.
  // Default to current cycle (EA/ED results come out in Dec).
  if (month === 12) return `${year}-${year + 1}`;

  // Jan-Jul: current cycle (RD season through summer)
  return `${year - 1}-${year}`;
}

// ─── Validate AI-extracted admission cycle ──────────────────────────────────

function validateAdmissionCycle(aiCycle: string | null | undefined): string | null {
  if (!aiCycle) return null;
  // Must match "YYYY-YYYY" format where second year = first year + 1
  const cycleMatch = aiCycle.match(/^(20\d{2})-(20\d{2})$/);
  if (!cycleMatch) return null;
  const startYear = parseInt(cycleMatch[1], 10);
  const endYear = parseInt(cycleMatch[2], 10);
  if (endYear !== startYear + 1) return null;
  // Reasonable range: 2015-2016 through 2030-2031
  if (startYear < 2015 || startYear > 2030) return null;
  return aiCycle;
}

// ─── Validate parsed data ───────────────────────────────────────────────────

function validateParsedData(parsed: ClaudeParsedPost): ClaudeParsedPost {
  const validated = { ...parsed };

  // Clamp GPA
  if (validated.academics.gpaUnweighted !== null) {
    if (validated.academics.gpaUnweighted < 0 || validated.academics.gpaUnweighted > 4.5) {
      validated.academics.gpaUnweighted = null;
    }
  }
  if (validated.academics.gpaWeighted !== null) {
    if (validated.academics.gpaWeighted < 0 || validated.academics.gpaWeighted > 6.0) {
      validated.academics.gpaWeighted = null;
    }
  }

  // Clamp SAT
  if (validated.academics.satScore !== null) {
    if (validated.academics.satScore < 400 || validated.academics.satScore > 1600) {
      validated.academics.satScore = null;
    }
  }

  // Clamp ACT
  if (validated.academics.actScore !== null) {
    if (validated.academics.actScore < 1 || validated.academics.actScore > 36) {
      validated.academics.actScore = null;
    }
  }

  // Validate state
  const validStates = new Set([
    "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
    "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
    "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
    "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
    "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
    "DC", "XX",
  ]);
  if (validated.demographics.stateOfResidence === "INTL") {
    validated.demographics.stateOfResidence = "XX";
  }
  if (validated.demographics.stateOfResidence && !validStates.has(validated.demographics.stateOfResidence)) {
    validated.demographics.stateOfResidence = null;
  }

  // Filter out invalid decisions
  const validDecisions = new Set(["accepted", "rejected", "waitlisted", "deferred"]);
  validated.decisions = validated.decisions.filter(
    (d) => d.schoolName && d.schoolName.length >= 2 && validDecisions.has(d.decision)
  );

  return validated;
}

// ─── Insert into database ───────────────────────────────────────────────────

async function insertParsedResults(
  post: ArcticShiftPost,
  parsed: ClaudeParsedPost
): Promise<{ inserted: number; skipped: number; unmatchedSchools: string[] }> {
  const dateBasedCycle = parseAdmissionCycle(post.created_utc);
  const admissionCycle = validateAdmissionCycle(parsed.admissionCycle) ?? dateBasedCycle;
  if (parsed.admissionCycle && admissionCycle !== dateBasedCycle) {
    console.log(
      `  ⚠️  AI-detected cycle ${admissionCycle} differs from date-based ${dateBasedCycle} for post ${post.id}`
    );
  }
  let inserted = 0;
  let skipped = 0;
  const unmatchedSchools: string[] = [];

  // Combine ECs and awards into extracurriculars array (awards appended with prefix)
  const allExtracurriculars = [
    ...parsed.extracurriculars,
    ...parsed.awards.map((a) => `[Award] ${a}`),
  ].slice(0, 10); // Cap at 10 entries

  for (const decision of parsed.decisions) {
    const schoolId = await resolveSchoolId(decision.schoolName);
    if (!schoolId) {
      unmatchedSchools.push(decision.schoolName);
      skipped++;
      continue;
    }

    // Check for existing duplicate
    const [existing] = await db
      .select({ id: admissionSubmissions.id })
      .from(admissionSubmissions)
      .where(
        and(
          eq(admissionSubmissions.sourcePostId, post.id),
          eq(admissionSubmissions.schoolId, schoolId)
        )
      )
      .limit(1);

    if (existing) {
      skipped++;
      continue;
    }

    await db.insert(admissionSubmissions).values({
      userId: null,
      schoolId,
      dataSource: "reddit",
      sourceUrl: `https://www.reddit.com${post.permalink}`,
      sourcePostId: post.id,
      admissionCycle,
      decision: decision.decision,
      applicationRound: decision.applicationRound ?? "regular",
      gpaUnweighted: parsed.academics.gpaUnweighted?.toString() ?? null,
      gpaWeighted: parsed.academics.gpaWeighted?.toString() ?? null,
      satScore: parsed.academics.satScore,
      actScore: parsed.academics.actScore,
      intendedMajor: parsed.intendedMajor?.slice(0, 100) ?? null,
      stateOfResidence: parsed.demographics.stateOfResidence ?? "XX",
      extracurriculars: allExtracurriculars,
      applicantHighlight: parsed.awards.length > 0 ? parsed.awards.join("; ") : null,
      highSchoolType: parsed.demographics.highSchoolType,
      firstGeneration: parsed.demographics.firstGeneration,
      legacyStatus: parsed.demographics.legacyStatus,
      financialAidApplied: null,
      geographicClassification: parsed.demographics.geographicClassification,
      apCoursesCount: parsed.academics.apCoursesCount,
      ibCoursesCount: parsed.academics.ibCoursesCount,
      honorsCoursesCount: parsed.academics.honorsCoursesCount,
      scholarshipOffered: null,
      willAttend: null,
      waitlistOutcome: null,
      verificationTier: "bronze",
      submissionStatus: "visible",
    }).onConflictDoNothing();

    inserted++;
  }

  return { inserted, skipped, unmatchedSchools };
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log("=== AI-Powered Reddit Ingestion ===");
  console.log(`Mode: ${DRY_RUN ? "DRY RUN (no DB writes)" : "LIVE (writing to DB)"}`);
  console.log(`Reprocess: ${REPROCESS ? "YES (re-parsing posts with unmatched schools)" : "NO"}`);
  console.log(`Limit: ${LIMIT ?? "all"}`);
  console.log(`After: ${AFTER_DATE}\n`);

  // 1. Fetch posts from Arctic Shift
  const allPosts = await fetchPostsFromArcticShift(AFTER_DATE, REPROCESS ? null : (LIMIT ? LIMIT * 3 : null));

  let postsToProcess: ArcticShiftPost[];

  if (REPROCESS) {
    // Reprocess mode: skip filterNewPosts, but pre-filter by text to only
    // re-parse posts likely mentioning schools that had name mismatches.
    // Focus on schools with the biggest coverage gaps
    const reprocessKeywords = [
      "a&m", "a & m", "tamu", "texas a",
      "william and mary", "william & mary", "w&m",
    ];
    const textFiltered = allPosts.filter((post) => {
      const text = (post.title + " " + (post.selftext ?? "")).toLowerCase();
      return text.length >= 50 && reprocessKeywords.some((kw) => text.includes(kw));
    });
    postsToProcess = LIMIT ? textFiltered.slice(0, LIMIT) : textFiltered;
    console.log(`\n${allPosts.length} total posts fetched, ${textFiltered.length} match reprocess keywords, processing ${postsToProcess.length}`);
  } else {
    // Normal mode: only process posts not yet in the DB
    const newPosts = await filterNewPosts(allPosts);
    postsToProcess = LIMIT ? newPosts.slice(0, LIMIT) : newPosts;
  }

  console.log(`Processing ${postsToProcess.length} posts\n`);

  if (postsToProcess.length === 0) {
    console.log("No new posts to process.");
    await pgClient.end();
    process.exit(0);
  }

  // 3. Parse each post with Claude
  let totalParsed = 0;
  let totalInserted = 0;
  let totalSkipped = 0;
  let totalNonAdmissions = 0;
  let totalParseFailures = 0;
  let totalDecisionsFound = 0;
  const allUnmatchedSchools: string[] = [];
  const sampleResults: Array<{
    postId: string;
    title: string;
    decisions: ParsedDecision[];
    academics: ClaudeParsedPost["academics"];
    awards: string[];
    insertResult: { inserted: number; skipped: number; unmatchedSchools: string[] } | null;
  }> = [];

  for (let i = 0; i < postsToProcess.length; i++) {
    const post = postsToProcess[i];
    const progress = `[${i + 1}/${postsToProcess.length}]`;

    // Parse with Claude
    const parsed = await parsePostWithClaude(post);

    if (!parsed) {
      totalParseFailures++;
      console.log(`${progress} SKIP (deleted/empty): ${post.title.slice(0, 60)}`);
      continue;
    }

    if (!parsed.hasAdmissionsData || parsed.decisions.length === 0) {
      totalNonAdmissions++;
      console.log(`${progress} SKIP (no admissions data): ${post.title.slice(0, 60)}`);
      continue;
    }

    // Validate
    const validated = validateParsedData(parsed);
    totalParsed++;
    totalDecisionsFound += validated.decisions.length;

    console.log(
      `${progress} PARSED: ${post.title.slice(0, 50)} | ` +
      `${validated.decisions.length} decisions, ` +
      `SAT:${validated.academics.satScore ?? "?"}, ` +
      `GPA:${validated.academics.gpaUnweighted ?? "?"}, ` +
      `Awards:[${validated.awards.join(", ").slice(0, 60)}]`
    );

    // Insert (or collect for dry run)
    let insertResult: { inserted: number; skipped: number; unmatchedSchools: string[] } | null = null;

    if (!DRY_RUN) {
      try {
        insertResult = await insertParsedResults(post, validated);
        totalInserted += insertResult.inserted;
        totalSkipped += insertResult.skipped;
        allUnmatchedSchools.push(...insertResult.unmatchedSchools);
      } catch (insertError: unknown) {
        const errorMsg = insertError instanceof Error ? insertError.message : String(insertError);
        console.error(`  DB INSERT ERROR for post ${post.id}: ${errorMsg.slice(0, 150)}`);
        totalParseFailures++;
      }
    }

    // Save first 20 results for review
    if (sampleResults.length < 20) {
      sampleResults.push({
        postId: post.id,
        title: post.title,
        decisions: validated.decisions,
        academics: validated.academics,
        awards: validated.awards,
        insertResult,
      });
    }

    // Rate limit: ~3 requests/sec to stay well under Haiku limits
    await new Promise((resolve) => setTimeout(resolve, 350));
  }

  // 4. Print summary
  console.log("\n=== SUMMARY ===");
  console.log(`Posts processed:    ${postsToProcess.length}`);
  console.log(`Parsed with data:   ${totalParsed}`);
  console.log(`Non-admissions:     ${totalNonAdmissions}`);
  console.log(`Parse failures:     ${totalParseFailures}`);
  console.log(`Total decisions:    ${totalDecisionsFound}`);
  if (!DRY_RUN) {
    console.log(`Inserted to DB:     ${totalInserted}`);
    console.log(`Skipped (dup/no match): ${totalSkipped}`);
  }

  if (allUnmatchedSchools.length > 0) {
    const unmatchedCounts = new Map<string, number>();
    for (const name of allUnmatchedSchools) {
      unmatchedCounts.set(name, (unmatchedCounts.get(name) ?? 0) + 1);
    }
    const sortedUnmatched = [...unmatchedCounts.entries()].sort((a, b) => b[1] - a[1]);
    console.log(`\nUnmatched schools (top 20):`);
    for (const [name, count] of sortedUnmatched.slice(0, 20)) {
      console.log(`  ${count}x  ${name}`);
    }
  }

  // Print sample results for review
  console.log("\n=== SAMPLE RESULTS (first 20 parsed posts) ===");
  for (const result of sampleResults) {
    console.log(`\n--- Post: ${result.title.slice(0, 70)} ---`);
    console.log(`  Academics: SAT=${result.academics.satScore}, ACT=${result.academics.actScore}, GPA_UW=${result.academics.gpaUnweighted}, GPA_W=${result.academics.gpaWeighted}`);
    console.log(`  Awards: ${result.awards.length > 0 ? result.awards.join("; ") : "(none)"}`);
    console.log(`  Decisions (${result.decisions.length}):`);
    for (const d of result.decisions) {
      console.log(`    ${d.decision.toUpperCase().padEnd(10)} ${d.schoolName} ${d.applicationRound ? `(${d.applicationRound})` : ""}`);
    }
    if (result.insertResult) {
      console.log(`  DB: ${result.insertResult.inserted} inserted, ${result.insertResult.skipped} skipped`);
      if (result.insertResult.unmatchedSchools.length > 0) {
        console.log(`  Unmatched: ${result.insertResult.unmatchedSchools.join(", ")}`);
      }
    }
  }

  await pgClient.end();
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
