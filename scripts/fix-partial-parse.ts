/**
 * Fix partial-parse bugs by deleting affected entries and re-parsing with Claude AI.
 *
 * The regex parser has a bug where it only captures "Waitlist:" sections in
 * compact-format posts, dropping "Accept:" and "Reject:" sections entirely.
 * This script deletes those partial entries and re-parses via Claude Haiku.
 *
 * Usage:
 *   npx tsx scripts/fix-partial-parse.ts --dry-run   # Preview, no changes
 *   npx tsx scripts/fix-partial-parse.ts              # Delete + re-parse
 */
import * as fs from "fs";
import Anthropic from "@anthropic-ai/sdk";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq, and, ilike, inArray } from "drizzle-orm";
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

if (!DATABASE_URL || !ANTHROPIC_API_KEY) {
  console.error("Missing DATABASE_URL or ANTHROPIC_API_KEY in .env.production");
  process.exit(1);
}

// ─── CLI args ───────────────────────────────────────────────────────────────

const DRY_RUN = process.argv.includes("--dry-run");

// ─── Init clients ───────────────────────────────────────────────────────────

const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
const pgClient = postgres(DATABASE_URL, { max: 5 });
const db = drizzle(pgClient);

// ─── Post IDs with partial-parse bugs ───────────────────────────────────────
// Found by scripts/find-partial-parse.ts: all entries are waitlisted, 3+ entries

const PARTIAL_PARSE_POST_IDS = [
  // 2025-2026
  "1saa3sr", "1s63fts", "1s6k0kw", "1s833gz", "1s6hxcm",
  // 1rzddcl is legitimate (verified: body has no accepts/rejects) — excluded
  // 2024-2025
  "1k88e3m", "1jk1wly", "1k1y6cj", "1jn3nxq",
  // 2023-2024
  "1cqoebg", "17bztn3",
  // 2022-2023
  "12oyzkl", "12a93dg",
  // 2021-2022
  "q2b0fg", "tu3kbj",
  // 2018-2019
  "bapek5", "b6tf2m",
];

// ─── Claude parsing (reused from ingest-reddit-ai.ts) ───────────────────────

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

// ─── School name resolution (from ingest-reddit-ai.ts) ─────────────────────

const schoolNameCache = new Map<string, string | null>();

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

async function resolveSchoolId(schoolName: string): Promise<string | null> {
  const normalizedName = schoolName.trim();
  if (schoolNameCache.has(normalizedName)) {
    return schoolNameCache.get(normalizedName)!;
  }

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

  const nameVariants = [
    normalizedName,
    normalizedName.replace(/,\s*/g, "-"),
    normalizedName.replace(/-/g, ", "),
    normalizedName.replace(/\s+at\s+/i, "-"),
    normalizedName.replace(/ College$/, " University"),
    normalizedName.replace(/ University$/, " College"),
  ];

  for (const variant of nameVariants) {
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

// ─── Validation ─────────────────────────────────────────────────────────────

function validateAdmissionCycle(aiCycle: string | null | undefined): string | null {
  if (!aiCycle) return null;
  const cycleMatch = aiCycle.match(/^(20\d{2})-(20\d{2})$/);
  if (!cycleMatch) return null;
  const startYear = parseInt(cycleMatch[1], 10);
  const endYear = parseInt(cycleMatch[2], 10);
  if (endYear !== startYear + 1) return null;
  if (startYear < 2015 || startYear > 2030) return null;
  return aiCycle;
}

function parseAdmissionCycleFromDate(createdUtc: number): string {
  const postDate = new Date(createdUtc * 1000);
  const year = postDate.getFullYear();
  const month = postDate.getMonth() + 1;
  if (month >= 8 && month <= 11) return `${year - 1}-${year}`;
  if (month === 12) return `${year}-${year + 1}`;
  return `${year - 1}-${year}`;
}

function validateParsedData(parsed: ClaudeParsedPost): ClaudeParsedPost {
  const validated = { ...parsed };
  if (validated.academics.gpaUnweighted !== null) {
    if (validated.academics.gpaUnweighted < 0 || validated.academics.gpaUnweighted > 4.5)
      validated.academics.gpaUnweighted = null;
  }
  if (validated.academics.gpaWeighted !== null) {
    if (validated.academics.gpaWeighted < 0 || validated.academics.gpaWeighted > 6.0)
      validated.academics.gpaWeighted = null;
  }
  if (validated.academics.satScore !== null) {
    if (validated.academics.satScore < 400 || validated.academics.satScore > 1600)
      validated.academics.satScore = null;
  }
  if (validated.academics.actScore !== null) {
    if (validated.academics.actScore < 1 || validated.academics.actScore > 36)
      validated.academics.actScore = null;
  }

  const validStates = new Set([
    "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
    "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
    "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
    "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
    "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
    "DC", "XX",
  ]);
  if (validated.demographics.stateOfResidence === "INTL")
    validated.demographics.stateOfResidence = "XX";
  if (validated.demographics.stateOfResidence && !validStates.has(validated.demographics.stateOfResidence))
    validated.demographics.stateOfResidence = null;

  const validDecisions = new Set(["accepted", "rejected", "waitlisted", "deferred"]);
  validated.decisions = validated.decisions.filter(
    (d) => d.schoolName && d.schoolName.length >= 2 && validDecisions.has(d.decision)
  );
  return validated;
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log("=== Fix Partial-Parse Bugs ===");
  console.log(`Mode: ${DRY_RUN ? "DRY RUN" : "LIVE"}`);
  console.log(`Posts to fix: ${PARTIAL_PARSE_POST_IDS.length}\n`);

  // Step 1: Count existing entries for these posts
  const existingCounts = await pgClient`
    SELECT source_post_id, count(*)::int as cnt
    FROM admission_submissions
    WHERE source_post_id IN ${pgClient(PARTIAL_PARSE_POST_IDS)}
    GROUP BY source_post_id
    ORDER BY source_post_id
  `;

  let totalExisting = 0;
  for (const row of existingCounts) {
    totalExisting += row.cnt;
    console.log(`  ${row.source_post_id}: ${row.cnt} entries to delete`);
  }
  console.log(`\nTotal entries to delete: ${totalExisting}`);

  // Step 2: Delete existing entries
  if (!DRY_RUN) {
    const deleted = await pgClient`
      DELETE FROM admission_submissions
      WHERE source_post_id IN ${pgClient(PARTIAL_PARSE_POST_IDS)}
      RETURNING id
    `;
    console.log(`Deleted ${deleted.length} entries.\n`);
  } else {
    console.log(`[DRY RUN] Would delete ${totalExisting} entries.\n`);
  }

  // Step 3: Fetch posts from Arctic Shift
  console.log("Fetching posts from Arctic Shift...");
  const idsParam = PARTIAL_PARSE_POST_IDS.join(",");
  const response = await fetch(
    `https://arctic-shift.photon-reddit.com/api/posts/ids?ids=${idsParam}`
  );

  if (!response.ok) {
    console.error(`Arctic Shift error: ${response.status}`);
    await pgClient.end();
    return;
  }

  const data = (await response.json()) as any;
  const fetchedPosts = data.data ?? [];
  console.log(`Fetched ${fetchedPosts.length} posts from Arctic Shift.\n`);

  // Step 4: Parse each post with Claude and insert
  let totalParsed = 0;
  let totalInserted = 0;
  let totalDecisions = 0;
  const unmatchedSchools: string[] = [];

  for (const post of fetchedPosts) {
    const selftext = post.selftext ?? "";
    if (!selftext || selftext === "[deleted]" || selftext === "[removed]") {
      console.log(`  SKIP (deleted): ${post.id} — ${post.title?.slice(0, 60)}`);
      continue;
    }

    const truncatedBody = selftext.length > 4000 ? selftext.slice(0, 4000) + "\n[truncated]" : selftext;
    const userPrompt = USER_PROMPT_TEMPLATE
      .replace("{{TITLE}}", post.title)
      .replace("{{BODY}}", truncatedBody);

    try {
      const aiResponse = await anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 2000,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
      });

      const text = aiResponse.content[0].type === "text" ? aiResponse.content[0].text : "";
      const jsonText = text.replace(/^```json?\s*\n?/, "").replace(/\n?```\s*$/, "").trim();
      const parsed: ClaudeParsedPost = JSON.parse(jsonText);

      if (!parsed.hasAdmissionsData || parsed.decisions.length === 0) {
        console.log(`  NO DATA: ${post.id} — ${post.title?.slice(0, 60)}`);
        continue;
      }

      const validated = validateParsedData(parsed);
      const dateBasedCycle = parseAdmissionCycleFromDate(post.created_utc);
      const admissionCycle = validateAdmissionCycle(validated.admissionCycle) ?? dateBasedCycle;

      totalParsed++;
      totalDecisions += validated.decisions.length;

      const allExtracurriculars = [
        ...validated.extracurriculars,
        ...validated.awards.map((a: string) => `[Award] ${a}`),
      ].slice(0, 10);

      console.log(`\n  PARSED: ${post.id} — ${post.title?.slice(0, 60)}`);
      console.log(`    Cycle: ${admissionCycle} | SAT: ${validated.academics.satScore ?? "?"} | GPA: ${validated.academics.gpaUnweighted ?? "?"}`);
      console.log(`    Decisions (${validated.decisions.length}):`);

      let postInserted = 0;
      for (const decision of validated.decisions) {
        const schoolId = await resolveSchoolId(decision.schoolName);
        const matchStatus = schoolId ? "OK" : "UNMATCHED";
        console.log(`      ${decision.decision.toUpperCase().padEnd(10)} ${decision.schoolName} [${matchStatus}]`);

        if (!schoolId) {
          unmatchedSchools.push(decision.schoolName);
          continue;
        }

        if (!DRY_RUN) {
          await db.insert(admissionSubmissions).values({
            userId: null,
            schoolId,
            dataSource: "reddit",
            sourceUrl: `https://www.reddit.com${post.permalink}`,
            sourcePostId: post.id,
            admissionCycle,
            decision: decision.decision,
            applicationRound: decision.applicationRound ?? "regular",
            gpaUnweighted: validated.academics.gpaUnweighted?.toString() ?? null,
            gpaWeighted: validated.academics.gpaWeighted?.toString() ?? null,
            satScore: validated.academics.satScore,
            actScore: validated.academics.actScore,
            intendedMajor: validated.intendedMajor?.slice(0, 100) ?? null,
            stateOfResidence: validated.demographics.stateOfResidence ?? "XX",
            extracurriculars: allExtracurriculars,
            applicantHighlight: validated.awards.length > 0 ? validated.awards.join("; ") : null,
            highSchoolType: validated.demographics.highSchoolType,
            firstGeneration: validated.demographics.firstGeneration,
            legacyStatus: validated.demographics.legacyStatus,
            financialAidApplied: null,
            geographicClassification: validated.demographics.geographicClassification,
            apCoursesCount: validated.academics.apCoursesCount,
            ibCoursesCount: validated.academics.ibCoursesCount,
            honorsCoursesCount: validated.academics.honorsCoursesCount,
            scholarshipOffered: null,
            willAttend: null,
            waitlistOutcome: null,
            verificationTier: "bronze",
            submissionStatus: "visible",
          }).onConflictDoNothing();
          postInserted++;
        }
      }
      totalInserted += postInserted;

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`  ERROR parsing ${post.id}: ${errorMessage}`);
    }

    // Rate limit
    await new Promise((resolve) => setTimeout(resolve, 350));
  }

  // Summary
  console.log("\n=== SUMMARY ===");
  console.log(`Posts fetched:     ${fetchedPosts.length}`);
  console.log(`Posts parsed:      ${totalParsed}`);
  console.log(`Total decisions:   ${totalDecisions}`);
  console.log(`Entries deleted:   ${totalExisting}`);
  console.log(`Entries inserted:  ${DRY_RUN ? "(dry run)" : totalInserted}`);
  console.log(`Net change:        ${DRY_RUN ? "(dry run)" : `${totalInserted - totalExisting}`}`);

  if (unmatchedSchools.length > 0) {
    const unmatchedCounts = new Map<string, number>();
    for (const name of unmatchedSchools) {
      unmatchedCounts.set(name, (unmatchedCounts.get(name) ?? 0) + 1);
    }
    console.log(`\nUnmatched schools:`);
    for (const [name, count] of [...unmatchedCounts.entries()].sort((a, b) => b[1] - a[1])) {
      console.log(`  ${count}x  ${name}`);
    }
  }

  await pgClient.end();
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
