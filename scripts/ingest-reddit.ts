/**
 * Reddit r/collegeresults Data Ingestion Script
 *
 * Fetches posts from r/collegeresults using Reddit's public JSON API
 * and parses the standardized template into structured admission outcomes.
 *
 * Usage:
 *   npx tsx scripts/ingest-reddit.ts
 *   npx tsx scripts/ingest-reddit.ts --limit 50
 *   npx tsx scripts/ingest-reddit.ts --after t3_abc123
 *
 * Prerequisites:
 *   - Set DATABASE_URL in .env.local
 *
 * Data source: https://www.reddit.com/r/collegeresults
 * Template: https://www.reddit.com/r/collegeresults/comments/gketws/template_1_standard_template/
 *
 * Posts follow a standardized template with sections:
 *   **Demographics**, **Academics**, **Standardized Testing**,
 *   **Extracurriculars**, **Awards**, **Decisions**
 *
 * NOTE: Reddit data is UNVERIFIED. All submissions are stored with:
 *   - dataSource: "reddit"
 *   - verificationTier: "bronze"
 *   - sourceUrl: link to original Reddit post
 */

import "dotenv/config";
import { config } from "dotenv";
config({ path: ".env.local" });

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq, and } from "drizzle-orm";
import { admissionSubmissions, schools, userProfiles } from "../src/lib/db/schema";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("Missing DATABASE_URL in environment.");
  process.exit(1);
}

const REDDIT_BASE_URL = "https://www.reddit.com/r/collegeresults";
const USER_AGENT = "accepted-fyi-ingestion/1.0 (educational research)";
const REQUEST_DELAY_MS = 2000; // 2 seconds between requests (respect rate limits)
const POSTS_PER_PAGE = 100;

// ─── Types ───────────────────────────────────────────────────────────────────

interface RedditPost {
  id: string;
  title: string;
  selftext: string;
  link_flair_text: string | null;
  created_utc: number;
  permalink: string;
  score: number;
}

interface ParsedDemographics {
  gender: string | null;
  raceEthnicity: string | null;
  stateOfResidence: string | null;
  highSchoolType: string | null;
  firstGeneration: boolean | null;
  legacyStatus: boolean | null;
  geographicClassification: string | null;
}

interface ParsedAcademics {
  gpaUnweighted: number | null;
  gpaWeighted: number | null;
  satScore: number | null;
  actScore: number | null;
  apCoursesCount: number | null;
  ibCoursesCount: number | null;
  honorsCoursesCount: number | null;
}

interface ParsedDecision {
  schoolName: string;
  decision: "accepted" | "rejected" | "waitlisted" | "deferred";
  applicationRound: "early_decision" | "early_action" | "regular" | "rolling" | null;
}

interface ParsedPost {
  demographics: ParsedDemographics;
  academics: ParsedAcademics;
  intendedMajor: string | null;
  extracurriculars: string[];
  decisions: ParsedDecision[];
  admissionCycle: string;
}

// ─── Parsing Helpers ─────────────────────────────────────────────────────────

function extractSection(text: string, sectionName: string): string | null {
  // Match **Section Name** or **Section Name(s)** variations
  const escapedName = sectionName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const sectionPattern = new RegExp(
    `\\*\\*${escapedName}[^*]*\\*\\*[:\\s]*([\\s\\S]*?)(?=\\*\\*[A-Z]|$)`,
    "i"
  );
  const match = text.match(sectionPattern);
  return match ? match[1].trim() : null;
}

function extractFieldValue(sectionText: string, fieldName: string): string | null {
  const escapedField = fieldName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const fieldPattern = new RegExp(
    `(?:\\*\\s*)?${escapedField}[:\\s]*(.+)`,
    "i"
  );
  const match = sectionText.match(fieldPattern);
  if (!match) return null;
  const value = match[1].trim().replace(/^\*+|\*+$/g, "").trim();
  if (!value || value === "N/A" || value === "n/a" || value === "-") return null;
  return value;
}

function parseGpa(gpaText: string | null): { unweighted: number | null; weighted: number | null } {
  if (!gpaText) return { unweighted: null, weighted: null };

  let unweighted: number | null = null;
  let weighted: number | null = null;

  // Match patterns like "3.95 UW / 4.3 W" or "3.95/4.3" or "3.95 UW, 4.3 W"
  const uwPattern = /(\d+\.?\d*)\s*(?:UW|unweighted)/i;
  const wPattern = /(\d+\.?\d*)\s*(?:W(?:eighted)?(?!\s*UW))/i;

  const uwMatch = gpaText.match(uwPattern);
  const wMatch = gpaText.match(wPattern);

  if (uwMatch) unweighted = parseFloat(uwMatch[1]);
  if (wMatch) weighted = parseFloat(wMatch[1]);

  // If only one number found like "3.95/4.3", assume first is UW, second is W
  if (unweighted === null && weighted === null) {
    const slashPattern = /(\d+\.?\d*)\s*[\/,]\s*(\d+\.?\d*)/;
    const slashMatch = gpaText.match(slashPattern);
    if (slashMatch) {
      const firstVal = parseFloat(slashMatch[1]);
      const secondVal = parseFloat(slashMatch[2]);
      // Unweighted is typically <= 4.0, weighted can be higher
      if (firstVal <= 4.01) unweighted = firstVal;
      if (secondVal > firstVal) weighted = secondVal;
      else if (secondVal <= 4.01 && unweighted === null) unweighted = secondVal;
    }
  }

  // Single number — guess based on value
  if (unweighted === null && weighted === null) {
    const singlePattern = /(\d+\.?\d*)/;
    const singleMatch = gpaText.match(singlePattern);
    if (singleMatch) {
      const val = parseFloat(singleMatch[1]);
      if (val <= 4.01) unweighted = val;
      else weighted = val;
    }
  }

  // Sanity check
  if (unweighted !== null && (unweighted < 0 || unweighted > 4.5)) unweighted = null;
  if (weighted !== null && (weighted < 0 || weighted > 6.0)) weighted = null;

  return { unweighted, weighted };
}

function parseSat(testingText: string | null): number | null {
  if (!testingText) return null;
  // Match "SAT I: 1560" or "SAT: 1560" or "1560 SAT" or "SAT I: 1560 (780RW, 780M)"
  const satPattern = /SAT\s*(?:I\s*)?:?\s*(\d{3,4})/i;
  const match = testingText.match(satPattern);
  if (match) {
    const score = parseInt(match[1], 10);
    if (score >= 400 && score <= 1600) return score;
  }
  // Try reverse: "1560 SAT"
  const reversePattern = /(\d{3,4})\s*SAT/i;
  const reverseMatch = testingText.match(reversePattern);
  if (reverseMatch) {
    const score = parseInt(reverseMatch[1], 10);
    if (score >= 400 && score <= 1600) return score;
  }
  return null;
}

function parseAct(testingText: string | null): number | null {
  if (!testingText) return null;
  // Match "ACT: 35" or "35 ACT" or "ACT: 35 (36E, 35M, 35R, 34S)"
  const actPattern = /ACT\s*:?\s*(\d{1,2})/i;
  const match = testingText.match(actPattern);
  if (match) {
    const score = parseInt(match[1], 10);
    if (score >= 1 && score <= 36) return score;
  }
  const reversePattern = /(\d{1,2})\s*ACT/i;
  const reverseMatch = testingText.match(reversePattern);
  if (reverseMatch) {
    const score = parseInt(reverseMatch[1], 10);
    if (score >= 1 && score <= 36) return score;
  }
  return null;
}

function parseApIbCount(academicsText: string | null): { ap: number | null; ib: number | null; honors: number | null } {
  if (!academicsText) return { ap: null, ib: null, honors: null };

  let ap: number | null = null;
  let ib: number | null = null;
  let honors: number | null = null;

  const apPattern = /(\d+)\s*(?:AP|APs)/i;
  const ibPattern = /(\d+)\s*(?:IB|IBs)/i;
  const honorsPattern = /(\d+)\s*(?:Honors|Hon)/i;

  const apMatch = academicsText.match(apPattern);
  const ibMatch = academicsText.match(ibPattern);
  const honorsMatch = academicsText.match(honorsPattern);

  if (apMatch) ap = parseInt(apMatch[1], 10);
  if (ibMatch) ib = parseInt(ibMatch[1], 10);
  if (honorsMatch) honors = parseInt(honorsMatch[1], 10);

  return { ap, ib, honors };
}

function parseHighSchoolType(demographicsText: string): string | null {
  const typeField = extractFieldValue(demographicsText, "Type of School");
  if (!typeField) return null;

  const lowerType = typeField.toLowerCase();
  if (lowerType.includes("private")) return "private";
  if (lowerType.includes("public")) return "public";
  if (lowerType.includes("charter")) return "charter";
  if (lowerType.includes("magnet")) return "magnet";
  if (lowerType.includes("homeschool") || lowerType.includes("home school")) return "homeschool";
  if (lowerType.includes("international")) return "international";
  return null;
}

function parseStateOfResidence(demographicsText: string): string | null {
  const residenceField = extractFieldValue(demographicsText, "Residence");
  if (!residenceField) return null;

  // Try to extract a US state abbreviation or name
  const stateAbbreviations: Record<string, string> = {
    alabama: "AL", alaska: "AK", arizona: "AZ", arkansas: "AR", california: "CA",
    colorado: "CO", connecticut: "CT", delaware: "DE", florida: "FL", georgia: "GA",
    hawaii: "HI", idaho: "ID", illinois: "IL", indiana: "IN", iowa: "IA",
    kansas: "KS", kentucky: "KY", louisiana: "LA", maine: "ME", maryland: "MD",
    massachusetts: "MA", michigan: "MI", minnesota: "MN", mississippi: "MS",
    missouri: "MO", montana: "MT", nebraska: "NE", nevada: "NV",
    "new hampshire": "NH", "new jersey": "NJ", "new mexico": "NM", "new york": "NY",
    "north carolina": "NC", "north dakota": "ND", ohio: "OH", oklahoma: "OK",
    oregon: "OR", pennsylvania: "PA", "rhode island": "RI", "south carolina": "SC",
    "south dakota": "SD", tennessee: "TN", texas: "TX", utah: "UT", vermont: "VT",
    virginia: "VA", washington: "WA", "west virginia": "WV", wisconsin: "WI",
    wyoming: "WY", "district of columbia": "DC",
  };

  // Check for 2-letter state code
  const abbreviationMatch = residenceField.match(/\b([A-Z]{2})\b/);
  if (abbreviationMatch) {
    const possibleState = abbreviationMatch[1];
    if (Object.values(stateAbbreviations).includes(possibleState)) {
      return possibleState;
    }
  }

  // Check for full state name
  const lowerResidence = residenceField.toLowerCase();
  for (const [stateName, stateCode] of Object.entries(stateAbbreviations)) {
    if (lowerResidence.includes(stateName)) return stateCode;
  }

  return null;
}

function parseDecisions(text: string): ParsedDecision[] {
  const decisions: ParsedDecision[] = [];

  // Find decisions section
  const decisionsSection = extractSection(text, "Decisions");
  if (!decisionsSection) {
    // Try alternative section names
    const altSection = text.match(
      /\*\*(?:Acceptances|Results|College Results)[^*]*\*\*[\s\S]*$/i
    );
    if (!altSection) return decisions;
  }

  const sectionText = decisionsSection || text;

  // Parse acceptance, waitlist, rejection sub-sections
  const decisionTypes: Array<{ pattern: RegExp; decision: ParsedDecision["decision"] }> = [
    { pattern: /(?:\*?\*?Acceptances?\*?\*?:?)([\s\S]*?)(?=\*?\*?(?:Waitlist|Rejection|Deferred|Additional|$))/i, decision: "accepted" },
    { pattern: /(?:\*?\*?Waitlist(?:ed|s)?\*?\*?:?)([\s\S]*?)(?=\*?\*?(?:Acceptance|Rejection|Deferred|Additional|$))/i, decision: "waitlisted" },
    { pattern: /(?:\*?\*?Rejection(?:s)?\*?\*?:?)([\s\S]*?)(?=\*?\*?(?:Acceptance|Waitlist|Deferred|Additional|$))/i, decision: "rejected" },
    { pattern: /(?:\*?\*?Deferred?\*?\*?:?)([\s\S]*?)(?=\*?\*?(?:Acceptance|Waitlist|Rejection|Additional|$))/i, decision: "deferred" },
  ];

  for (const { pattern, decision } of decisionTypes) {
    const match = sectionText.match(pattern);
    if (!match) continue;

    const schoolLines = match[1].trim().split("\n");
    for (const line of schoolLines) {
      const cleanLine = line.replace(/^[\s*\-•]+/, "").trim();
      if (!cleanLine || cleanLine.length < 2) continue;

      // Extract school name and round
      let schoolName = cleanLine;
      let applicationRound: ParsedDecision["applicationRound"] = null;

      // Check for round indicators
      const roundPatterns: Array<{ pattern: RegExp; round: NonNullable<ParsedDecision["applicationRound"]> }> = [
        { pattern: /\b(?:ED|Early\s*Decision)\b/i, round: "early_decision" },
        { pattern: /\b(?:EA|Early\s*Action|REA|SCEA)\b/i, round: "early_action" },
        { pattern: /\b(?:RD|Regular\s*Decision|Regular)\b/i, round: "regular" },
        { pattern: /\bRolling\b/i, round: "rolling" },
      ];

      for (const { pattern: roundPattern, round } of roundPatterns) {
        if (roundPattern.test(cleanLine)) {
          applicationRound = round;
          // Remove the round text from school name
          schoolName = cleanLine.replace(roundPattern, "").trim();
          break;
        }
      }

      // Clean up school name: remove parentheses content, extra punctuation
      schoolName = schoolName
        .replace(/\([^)]*\)/g, "") // remove parenthetical notes
        .replace(/[*_~`#]/g, "") // remove markdown formatting
        .replace(/\s*[-–—]\s*$/, "") // remove trailing dashes
        .replace(/^\d+\.\s*/, "") // remove leading numbers like "1. "
        .replace(/,\s*$/, "") // remove trailing commas
        .trim();

      // Clean HTML entities and zero-width spaces
      schoolName = schoolName
        .replace(/&amp;x200b;/g, "")
        .replace(/&x200b;/g, "")
        .replace(/&amp;/g, "&")
        .replace(/&#\w+;/g, "")
        .replace(/\u200b/g, "")
        .trim();

      // Skip non-school entries (too short, too long, section headers, sentences)
      const wordCount = schoolName.split(/\s+/).length;
      if (
        schoolName.length < 3 ||
        schoolName.length > 100 ||
        wordCount > 8 ||
        /^(list|none|n\/a|pending|waiting|final thoughts|additional|overall|comments|tldr|thank|okay|most|after|the )/i.test(schoolName) ||
        /[.!?]$/.test(schoolName) // ends with sentence punctuation
      ) {
        continue;
      }

      decisions.push({
        schoolName,
        decision,
        applicationRound,
      });
    }
  }

  return decisions;
}

function parseAdmissionCycle(createdUtc: number): string {
  const postDate = new Date(createdUtc * 1000);
  const year = postDate.getFullYear();
  const month = postDate.getMonth() + 1;

  // Posts from August onward are for the current cycle (applying fall, decisions spring)
  // Posts from January-July are for the cycle that started the previous fall
  if (month >= 8) {
    return `${year}-${year + 1}`;
  }
  return `${year - 1}-${year}`;
}

function parseIntendedMajor(text: string): string | null {
  const majorSection = extractSection(text, "Intended Major");
  if (majorSection) {
    const cleanMajor = majorSection
      .split("\n")[0]
      .replace(/^[\s*:]+/, "")
      .trim();
    if (cleanMajor && cleanMajor.length < 100) return cleanMajor;
  }

  // Try flair-based extraction
  return null;
}

function parseExtracurriculars(text: string): string[] {
  const ecSection = extractSection(text, "Extracurriculars") || extractSection(text, "Activities");
  if (!ecSection) return [];

  const extracurriculars: string[] = [];
  const lines = ecSection.split("\n");
  for (const line of lines) {
    const cleanLine = line.replace(/^\s*\d+[\.\)]\s*/, "").replace(/^[\s*\-•]+/, "").trim();
    if (cleanLine && cleanLine.length >= 3 && cleanLine.length <= 200) {
      // Take just the activity name/title, not the full description
      const activityName = cleanLine.split(/[:\-–—]/)[0].trim();
      if (activityName.length >= 3) {
        extracurriculars.push(activityName.slice(0, 100));
      }
    }
  }

  return extracurriculars.slice(0, 10); // Max 10 ECs
}

function parsePost(post: RedditPost): ParsedPost | null {
  const text = post.selftext;
  if (!text || text.length < 100) return null;

  // Must have at least a Decisions section to be useful
  const hasDecisions = /\*\*Decisions?\*\*/i.test(text) ||
    /\*\*Acceptances?\*\*/i.test(text) ||
    /\*\*Results?\*\*/i.test(text);
  if (!hasDecisions) return null;

  const demographicsText = extractSection(text, "Demographics") || "";
  const academicsText = extractSection(text, "Academics") || "";
  const testingText = extractSection(text, "Standardized Testing") || extractSection(text, "Testing") || "";
  const fullAcademicsContext = academicsText + "\n" + testingText;

  const gpaField = extractFieldValue(academicsText, "GPA");
  const gpa = parseGpa(gpaField);
  const courseCounts = parseApIbCount(fullAcademicsContext);

  const decisions = parseDecisions(text);
  if (decisions.length === 0) return null;

  const demographics: ParsedDemographics = {
    gender: extractFieldValue(demographicsText, "Gender"),
    raceEthnicity: extractFieldValue(demographicsText, "Race"),
    stateOfResidence: parseStateOfResidence(demographicsText),
    highSchoolType: parseHighSchoolType(demographicsText),
    firstGeneration: demographicsText.toLowerCase().includes("first-gen") ||
      demographicsText.toLowerCase().includes("first gen")
      ? true
      : null,
    legacyStatus: demographicsText.toLowerCase().includes("legacy") ? true : null,
    geographicClassification: null,
  };

  // Try to extract geographic classification from demographics
  const lowerDemographics = demographicsText.toLowerCase();
  if (lowerDemographics.includes("rural")) demographics.geographicClassification = "rural";
  else if (lowerDemographics.includes("suburban")) demographics.geographicClassification = "suburban";
  else if (lowerDemographics.includes("urban")) demographics.geographicClassification = "urban";

  const academics: ParsedAcademics = {
    gpaUnweighted: gpa.unweighted,
    gpaWeighted: gpa.weighted,
    satScore: parseSat(testingText || fullAcademicsContext),
    actScore: parseAct(testingText || fullAcademicsContext),
    apCoursesCount: courseCounts.ap,
    ibCoursesCount: courseCounts.ib,
    honorsCoursesCount: courseCounts.honors,
  };

  return {
    demographics,
    academics,
    intendedMajor: parseIntendedMajor(text),
    extracurriculars: parseExtracurriculars(text),
    decisions,
    admissionCycle: parseAdmissionCycle(post.created_utc),
  };
}

// ─── Reddit API ──────────────────────────────────────────────────────────────

async function fetchRedditPage(after: string | null, sort: string = "new", timeRange: string = "year"): Promise<{
  posts: RedditPost[];
  after: string | null;
}> {
  const url = new URL(`${REDDIT_BASE_URL}/${sort}.json`);
  url.searchParams.set("limit", POSTS_PER_PAGE.toString());
  if (sort === "top") url.searchParams.set("t", timeRange);
  if (after) url.searchParams.set("after", after);

  const response = await fetch(url.toString(), {
    headers: { "User-Agent": USER_AGENT },
  });

  if (!response.ok) {
    throw new Error(`Reddit API error (${response.status}): ${await response.text()}`);
  }

  const data = await response.json();
  const posts: RedditPost[] = data.data.children
    .filter((child: { kind: string }) => child.kind === "t3")
    .map((child: { data: RedditPost }) => child.data);

  return {
    posts,
    after: data.data.after || null,
  };
}

// ─── School Matching ─────────────────────────────────────────────────────────

const schoolNameCache = new Map<string, string | null>();

async function findSchoolId(
  db: ReturnType<typeof drizzle>,
  schoolName: string
): Promise<string | null> {
  const normalizedName = schoolName.toLowerCase().trim();

  if (schoolNameCache.has(normalizedName)) {
    return schoolNameCache.get(normalizedName)!;
  }

  // Try exact match first
  const exactMatch = await db
    .select({ id: schools.id })
    .from(schools)
    .where(eq(schools.name, schoolName))
    .limit(1);

  if (exactMatch.length > 0) {
    schoolNameCache.set(normalizedName, exactMatch[0].id);
    return exactMatch[0].id;
  }

  // Try case-insensitive partial match using SQL
  const { ilike } = await import("drizzle-orm");
  const partialMatch = await db
    .select({ id: schools.id, name: schools.name })
    .from(schools)
    .where(ilike(schools.name, `%${normalizedName}%`))
    .limit(5);

  if (partialMatch.length === 1) {
    schoolNameCache.set(normalizedName, partialMatch[0].id);
    return partialMatch[0].id;
  }

  // Common abbreviation mappings
  const abbreviationMap: Record<string, string> = {
    "mit": "Massachusetts Institute of Technology",
    "caltech": "California Institute of Technology",
    "upenn": "University of Pennsylvania",
    "penn": "University of Pennsylvania",
    "uchicago": "University of Chicago",
    "washu": "Washington University in St Louis",
    "gatech": "Georgia Institute of Technology",
    "georgia tech": "Georgia Institute of Technology",
    "gt": "Georgia Institute of Technology",
    "uva": "University of Virginia",
    "umich": "University of Michigan-Ann Arbor",
    "umich lsa": "University of Michigan-Ann Arbor",
    "unc": "University of North Carolina at Chapel Hill",
    "ucb": "University of California-Berkeley",
    "uc berkeley": "University of California-Berkeley",
    "berkeley": "University of California-Berkeley",
    "cal": "University of California-Berkeley",
    "ucla": "University of California-Los Angeles",
    "ucd": "University of California-Davis",
    "uc davis": "University of California-Davis",
    "ucsb": "University of California-Santa Barbara",
    "uc santa barbara": "University of California-Santa Barbara",
    "ucsd": "University of California-San Diego",
    "uc san diego": "University of California-San Diego",
    "uci": "University of California-Irvine",
    "uc irvine": "University of California-Irvine",
    "ucsc": "University of California-Santa Cruz",
    "uc santa cruz": "University of California-Santa Cruz",
    "ucr": "University of California-Riverside",
    "uc riverside": "University of California-Riverside",
    "nyu": "New York University",
    "bu": "Boston University",
    "bc": "Boston College",
    "cmu": "Carnegie Mellon University",
    "usc": "University of Southern California",
    "northeastern": "Northeastern University",
    "northwestern": "Northwestern University",
    "jhu": "Johns Hopkins University",
    "cornell": "Cornell University",
    "columbia": "Columbia University in the City of New York",
    "brown": "Brown University",
    "dartmouth": "Dartmouth College",
    "emory": "Emory University",
    "williams": "Williams College",
    "amherst": "Amherst College",
    "cal poly slo": "California Polytechnic State University-San Luis Obispo",
    "cal poly": "California Polytechnic State University-San Luis Obispo",
    "rice": "Rice University",
    "duke": "Duke University",
    "vanderbilt": "Vanderbilt University",
    "georgetown": "Georgetown University",
    "tufts": "Tufts University",
    "notre dame": "University of Notre Dame",
    "purdue": "Purdue University-Main Campus",
    "uiuc": "University of Illinois Urbana-Champaign",
    "ut austin": "The University of Texas at Austin",
    "uw madison": "University of Wisconsin-Madison",
    "virginia tech": "Virginia Polytechnic Institute and State University",
    "william and mary": "William & Mary",
    "wellesley": "Wellesley College",
    "swarthmore": "Swarthmore College",
    "pomona": "Pomona College",
    "barnard": "Barnard College",
    "bowdoin": "Bowdoin College",
    "colby": "Colby College",
    "middlebury": "Middlebury College",
    "harvey mudd": "Harvey Mudd College",
    "ufl": "University of Florida",
    "uf": "University of Florida",
    "penn state": "Pennsylvania State University-Main Campus",
    "ohio state": "Ohio State University-Main Campus",
    "osu": "Ohio State University-Main Campus",
    "uw": "University of Washington-Seattle Campus",
    "u of washington": "University of Washington-Seattle Campus",
    "umd": "University of Maryland-College Park",
    "rutgers": "Rutgers University-New Brunswick",
    "umass amherst": "University of Massachusetts-Amherst",
    "umass": "University of Massachusetts-Amherst",
    "case western": "Case Western Reserve University",
    "cwru": "Case Western Reserve University",
    "wpi": "Worcester Polytechnic Institute",
    "rpi": "Rensselaer Polytechnic Institute",
    "lehigh": "Lehigh University",
    "villanova": "Villanova University",
    "pitt": "University of Pittsburgh-Pittsburgh Campus",
    "asu": "Arizona State University-Tempe",
    "csu long beach": "California State University-Long Beach",
  };

  const mappedName = abbreviationMap[normalizedName];
  if (mappedName) {
    const mappedMatch = await db
      .select({ id: schools.id })
      .from(schools)
      .where(ilike(schools.name, `%${mappedName}%`))
      .limit(1);

    if (mappedMatch.length > 0) {
      schoolNameCache.set(normalizedName, mappedMatch[0].id);
      return mappedMatch[0].id;
    }
  }

  schoolNameCache.set(normalizedName, null);
  return null;
}

// ─── System User ─────────────────────────────────────────────────────────────

async function getOrCreateSystemUser(db: ReturnType<typeof drizzle>): Promise<string> {
  const SYSTEM_USER_AUTH_ID = "00000000-0000-0000-0000-000000000000";

  const existingUser = await db
    .select({ id: userProfiles.id })
    .from(userProfiles)
    .where(eq(userProfiles.authUserId, SYSTEM_USER_AUTH_ID))
    .limit(1);

  if (existingUser.length > 0) return existingUser[0].id;

  const [newUser] = await db
    .insert(userProfiles)
    .values({
      authUserId: SYSTEM_USER_AUTH_ID,
      email: "system@accepted.fyi",
      displayName: "Reddit Import",
      hasSubmitted: false,
      verificationTier: "bronze",
    })
    .returning({ id: userProfiles.id });

  return newUser.id;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  let maxPosts = 500; // Default: fetch 500 posts
  let startAfter: string | null = null;
  let sortBy = "top"; // Default: top posts (better parse rate)
  let timeRange = "all"; // Default: all time

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--limit" && args[i + 1]) {
      maxPosts = parseInt(args[i + 1], 10);
      i++;
    }
    if (args[i] === "--after" && args[i + 1]) {
      startAfter = args[i + 1];
      i++;
    }
    if (args[i] === "--sort" && args[i + 1]) {
      sortBy = args[i + 1];
      i++;
    }
    if (args[i] === "--time" && args[i + 1]) {
      timeRange = args[i + 1];
      i++;
    }
  }

  const connectionString = DATABASE_URL!;
  const client = postgres(connectionString);
  const db = drizzle(client);

  console.log("Starting Reddit r/collegeresults ingestion...");
  console.log(`Max posts: ${maxPosts}, Sort: ${sortBy}, Time: ${timeRange}`);
  if (startAfter) console.log(`Starting after: ${startAfter}`);
  console.log();

  let totalFetched = 0;
  let totalParsed = 0;
  let totalInserted = 0;
  let totalSkippedNoSchool = 0;
  let totalSkippedDuplicate = 0;
  let after = startAfter;

  const unmatchedSchoolNames = new Map<string, number>();

  while (totalFetched < maxPosts) {
    process.stdout.write(`Fetching page (after=${after || "start"})... `);

    try {
      const page = await fetchRedditPage(after, sortBy, timeRange);
      if (page.posts.length === 0) {
        console.log("No more posts.");
        break;
      }

      totalFetched += page.posts.length;
      console.log(`${page.posts.length} posts`);

      for (const post of page.posts) {
        const parsed = parsePost(post);
        if (!parsed) continue;
        totalParsed++;

        for (const decision of parsed.decisions) {
          const schoolId = await findSchoolId(db, decision.schoolName);

          if (!schoolId) {
            const normalizedName = decision.schoolName.toLowerCase().trim();
            unmatchedSchoolNames.set(
              normalizedName,
              (unmatchedSchoolNames.get(normalizedName) || 0) + 1
            );
            totalSkippedNoSchool++;
            continue;
          }

          // Check for duplicate (same source post + school)
          const existingSubmission = await db
            .select({ id: admissionSubmissions.id })
            .from(admissionSubmissions)
            .where(
              and(
                eq(admissionSubmissions.sourcePostId, post.id),
                eq(admissionSubmissions.schoolId, schoolId)
              )
            )
            .limit(1);

          if (existingSubmission.length > 0) {
            totalSkippedDuplicate++;
            continue;
          }

          try {
            await db.insert(admissionSubmissions).values({
              userId: null, // No real user for scraped data; null avoids unique constraint conflicts
              schoolId,
              dataSource: "reddit",
              sourceUrl: `https://www.reddit.com${post.permalink}`,
              sourcePostId: post.id,
              admissionCycle: parsed.admissionCycle,
              decision: decision.decision,
              applicationRound: decision.applicationRound || "regular",
              gpaUnweighted: parsed.academics.gpaUnweighted?.toString() ?? null,
              gpaWeighted: parsed.academics.gpaWeighted?.toString() ?? null,
              satScore: parsed.academics.satScore,
              actScore: parsed.academics.actScore,
              intendedMajor: parsed.intendedMajor,
              stateOfResidence: parsed.demographics.stateOfResidence,
              extracurriculars: parsed.extracurriculars,
              highSchoolType: parsed.demographics.highSchoolType as "public" | "private" | "charter" | "magnet" | "homeschool" | "international" | null,
              firstGeneration: parsed.demographics.firstGeneration,
              legacyStatus: parsed.demographics.legacyStatus,
              financialAidApplied: null,
              geographicClassification: parsed.demographics.geographicClassification as "rural" | "suburban" | "urban" | null,
              apCoursesCount: parsed.academics.apCoursesCount,
              ibCoursesCount: parsed.academics.ibCoursesCount,
              honorsCoursesCount: parsed.academics.honorsCoursesCount,
              scholarshipOffered: null,
              willAttend: null,
              waitlistOutcome: null,
              verificationTier: "bronze",
              submissionStatus: "visible",
            });
            totalInserted++;
          } catch (insertError) {
            // Skip unique constraint violations (duplicate user+school+cycle)
            const errorMessage = insertError instanceof Error ? insertError.message : String(insertError);
            if (!errorMessage.includes("unique")) {
              console.error(`  Insert error for ${decision.schoolName}: ${errorMessage}`);
            }
          }
        }
      }

      after = page.after;
      if (!after) {
        console.log("Reached end of subreddit.");
        break;
      }

      // Rate limit
      await new Promise((resolve) => setTimeout(resolve, REQUEST_DELAY_MS));
    } catch (fetchError) {
      console.error(`Error: ${fetchError instanceof Error ? fetchError.message : fetchError}`);
      // Wait longer on error
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }

  console.log("\n--- Ingestion Complete ---");
  console.log(`Posts fetched: ${totalFetched}`);
  console.log(`Posts with parseable data: ${totalParsed}`);
  console.log(`Outcomes inserted: ${totalInserted}`);
  console.log(`Skipped (no matching school): ${totalSkippedNoSchool}`);
  console.log(`Skipped (duplicate): ${totalSkippedDuplicate}`);

  if (unmatchedSchoolNames.size > 0) {
    console.log(`\nTop 20 unmatched school names (add to abbreviation map or schools table):`);
    const sortedUnmatched = [...unmatchedSchoolNames.entries()]
      .sort(([, countA], [, countB]) => countB - countA)
      .slice(0, 20);
    for (const [schoolName, count] of sortedUnmatched) {
      console.log(`  ${schoolName}: ${count} mentions`);
    }
  }

  if (after) {
    console.log(`\nTo continue from where we left off, run:`);
    console.log(`  npx tsx scripts/ingest-reddit.ts --after ${after}`);
  }

  await client.end();
  process.exit(0);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
