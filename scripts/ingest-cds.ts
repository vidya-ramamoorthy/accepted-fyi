/**
 * Common Data Set (CDS) Data Ingestion Script
 *
 * Uses Puppeteer to scrape JS-rendered pages from commondatasets.fyi
 * and updates the schools table with CDS-specific fields:
 *   - Admissions factor importance ratings (Section C7)
 *   - GPA distribution of enrolled freshmen (Section C10-C12)
 *   - ED/EA admission counts (Section C1)
 *   - Waitlist statistics (Section C2)
 *   - Financial aid highlights (Section H)
 *
 * Usage:
 *   npx tsx scripts/ingest-cds.ts
 *
 * Prerequisites:
 *   - Set DATABASE_URL in .env.local
 *   - Schools must already exist in DB (run ingest:scorecard first)
 *   - Puppeteer installed (npm install --save-dev puppeteer)
 */

import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import puppeteer, { type Browser } from "puppeteer";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq, ilike } from "drizzle-orm";
import { schools } from "../src/lib/db/schema";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("Missing DATABASE_URL in environment.");
  process.exit(1);
}

const REQUEST_DELAY_MS = 2000;
const PAGE_LOAD_TIMEOUT_MS = 30000;

// ─── School Mappings ─────────────────────────────────────────────────────────

interface CdsSchoolConfig {
  slug: string; // URL slug on commondatasets.fyi
  dbSearchName: string; // Name to search for in our DB
}

const CDS_SCHOOLS: CdsSchoolConfig[] = [
  { slug: "harvard", dbSearchName: "Harvard University" },
  { slug: "mit", dbSearchName: "Massachusetts Institute of Technology" },
  { slug: "stanford", dbSearchName: "Stanford University" },
  { slug: "princeton", dbSearchName: "Princeton University" },
  { slug: "yale", dbSearchName: "Yale University" },
  { slug: "columbia", dbSearchName: "Columbia University in the City of New York" },
  { slug: "uchicago", dbSearchName: "University of Chicago" },
  { slug: "johns-hopkins", dbSearchName: "Johns Hopkins University" },
  { slug: "upenn", dbSearchName: "University of Pennsylvania" },
  { slug: "dartmouth", dbSearchName: "Dartmouth College" },
  { slug: "brown", dbSearchName: "Brown University" },
  { slug: "cornell", dbSearchName: "Cornell University" },
];

// ─── Parsed CDS Data ─────────────────────────────────────────────────────────

type FactorRating = "very_important" | "important" | "considered" | "not_considered";

interface ParsedCdsData {
  // Section C1 — Round-specific counts
  edApplicants: number | null;
  edAdmitted: number | null;
  eaApplicants: number | null;
  eaAdmitted: number | null;
  // Section C2 — Waitlist
  waitlistOffered: number | null;
  waitlistAccepted: number | null;
  waitlistAdmitted: number | null;
  // Section C7 — Factor importance
  factorGpa: FactorRating | null;
  factorClassRank: FactorRating | null;
  factorTestScores: FactorRating | null;
  factorEssay: FactorRating | null;
  factorRecommendations: FactorRating | null;
  factorExtracurriculars: FactorRating | null;
  factorTalentAbility: FactorRating | null;
  factorCharacter: FactorRating | null;
  factorFirstGen: FactorRating | null;
  factorAlumniRelation: FactorRating | null;
  factorGeographic: FactorRating | null;
  factorStateResidency: FactorRating | null;
  factorVolunteer: FactorRating | null;
  factorWorkExperience: FactorRating | null;
  factorDemonstratedInterest: FactorRating | null;
  // Section C10-C12 — GPA distribution
  gpaPercent400: number | null;
  gpaPercent375to399: number | null;
  gpaPercent350to374: number | null;
  gpaPercent325to349: number | null;
  gpaPercent300to324: number | null;
  gpaPercentBelow300: number | null;
  // Section H — Financial aid
  percentNeedMet: number | null;
  avgFinancialAidPackage: number | null;
  percentReceivingMeritAid: number | null;
  avgMeritAidAmount: number | null;
}

// ─── Puppeteer Page Fetcher ─────────────────────────────────────────────────

async function fetchRenderedPageText(browser: Browser, slug: string): Promise<string> {
  const page = await browser.newPage();

  try {
    const url = `https://www.commondatasets.fyi/${slug}`;
    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: PAGE_LOAD_TIMEOUT_MS,
    });

    const textContent = await page.evaluate(() => document.body.innerText);
    return textContent;
  } finally {
    await page.close();
  }
}

// ─── Text Parsers ───────────────────────────────────────────────────────────

/**
 * Parse a number from a string, stripping commas and handling "N/A".
 */
function parseNumber(value: string): number | null {
  const cleaned = value.trim().replace(/,/g, "").replace(/\$/, "");
  if (cleaned === "N/A" || cleaned === "" || cleaned === "X") return null;
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

/**
 * Parse a percentage string like "74.02%" → 74.02
 */
function parsePercent(value: string): number | null {
  const cleaned = value.trim().replace(/%$/, "");
  return parseNumber(cleaned);
}

/**
 * Maps rendered factor labels to our DB field names.
 */
const FACTOR_LABEL_TO_FIELD: Record<string, keyof ParsedCdsData> = {
  "academic gpa": "factorGpa",
  "class rank": "factorClassRank",
  "standardized test scores": "factorTestScores",
  "application essay": "factorEssay",
  "recommendation(s)": "factorRecommendations",
  "recommendations": "factorRecommendations",
  "extracurricular activities": "factorExtracurriculars",
  "talent/ability": "factorTalentAbility",
  "character/personal qualities": "factorCharacter",
  "first generation": "factorFirstGen",
  "alumni/ae relation": "factorAlumniRelation",
  "geographical residence": "factorGeographic",
  "state residence": "factorStateResidency",
  "volunteer work": "factorVolunteer",
  "work experience": "factorWorkExperience",
  "level of applicant's interest": "factorDemonstratedInterest",
  "level of applicant\u2019s interest": "factorDemonstratedInterest",
};

/**
 * Column header values mapped to our FactorRating type.
 */
const COLUMN_TO_RATING: Record<string, FactorRating> = {
  "very important": "very_important",
  "important": "important",
  "considered": "considered",
  "not considered": "not_considered",
};

/**
 * Parse the "Applicant Pools" table from the rendered text.
 *
 * Expected format:
 *   Applicant Pools
 *   Type\tNumber of Students\tNumber of Students Accepted\tAcceptance Rate
 *   Early Action\t9,544\t721\t7.55%
 *   Regular Decision\t47,384\t1,220\t2.57%
 *   Waitlist\tN/A\tN/A\tN/A
 */
function parseApplicantPools(text: string, data: ParsedCdsData): void {
  const lines = text.split("\n");
  const applicantPoolsIndex = lines.findIndex(
    (line) => line.trim().startsWith("Applicant Pools")
  );

  if (applicantPoolsIndex === -1) return;

  // Scan lines after the header row for data rows
  for (let i = applicantPoolsIndex + 1; i < lines.length && i < applicantPoolsIndex + 10; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const columns = line.split("\t");
    if (columns.length < 3) continue;

    const rowType = columns[0].trim().toLowerCase();
    const applicants = parseNumber(columns[1]);
    const admitted = parseNumber(columns[2]);

    if (rowType.includes("early action")) {
      data.eaApplicants = applicants;
      data.eaAdmitted = admitted;
    } else if (rowType.includes("early decision")) {
      data.edApplicants = applicants;
      data.edAdmitted = admitted;
    } else if (rowType.includes("waitlist")) {
      // Table columns: Number of Students | Number Accepted | Acceptance Rate
      // For waitlist: col 1 = offered a spot, col 2 = admitted from waitlist
      // col 3 = acceptance rate percentage (derived, skip)
      data.waitlistOffered = applicants;
      data.waitlistAdmitted = admitted;
      // waitlistAccepted (how many chose to stay on waitlist) is not in this table
    }
  }
}

/**
 * Parse the "GPA Breakdown" table from the rendered text.
 *
 * Expected format:
 *   GPA Breakdown\tPercent of Admitted Students
 *   GPA 4.0\t74.02%
 *   GPA between 3.75 and 3.99\t19.67%
 *   GPA between 3.50 and 3.74\t4.10%
 *   GPA between 3.25 and 3.49\t1.07%
 *   GPA between 3.00 and 3.24\t0.82%
 *   GPA between 2.50 and 2.99\t0.25%
 *   GPA between 2.00 and 2.49\t0.00%
 *   GPA between 1.00 and 1.99\t0.07%
 */
function parseGpaBreakdown(text: string, data: ParsedCdsData): void {
  const lines = text.split("\n");
  const gpaHeaderIndex = lines.findIndex(
    (line) => line.trim().toLowerCase().startsWith("gpa breakdown")
  );

  if (gpaHeaderIndex === -1) return;

  for (let i = gpaHeaderIndex + 1; i < lines.length && i < gpaHeaderIndex + 12; i++) {
    const line = lines[i].trim();
    if (!line.toLowerCase().startsWith("gpa")) continue;

    const columns = line.split("\t");
    if (columns.length < 2) continue;

    const label = columns[0].trim().toLowerCase();
    const percentValue = parsePercent(columns[1]);

    if (label === "gpa 4.0" || label === "gpa 4.00") {
      data.gpaPercent400 = percentValue;
    } else if (label.includes("3.75") && label.includes("3.99")) {
      data.gpaPercent375to399 = percentValue;
    } else if (label.includes("3.50") && label.includes("3.74")) {
      data.gpaPercent350to374 = percentValue;
    } else if (label.includes("3.25") && label.includes("3.49")) {
      data.gpaPercent325to349 = percentValue;
    } else if (label.includes("3.00") && label.includes("3.24")) {
      data.gpaPercent300to324 = percentValue;
    } else if (label.includes("2.50") && label.includes("2.99")) {
      // Below 3.0 bucket — combine 2.50-2.99 as the primary "below 3.0"
      data.gpaPercentBelow300 = percentValue;
    } else if (label.includes("2.00") && label.includes("2.49")) {
      // Add to below 3.0 bucket if we already have 2.50-2.99
      if (data.gpaPercentBelow300 !== null && percentValue !== null) {
        data.gpaPercentBelow300 += percentValue;
      } else {
        data.gpaPercentBelow300 = percentValue;
      }
    } else if (label.includes("1.00") && label.includes("1.99")) {
      // Add to below 3.0 bucket
      if (data.gpaPercentBelow300 !== null && percentValue !== null) {
        data.gpaPercentBelow300 += percentValue;
      }
    }
  }
}

/**
 * Parse the "Factors of Admission" table from the rendered text.
 *
 * The table has a header row with columns:
 *   Factors of Admission\tVery Important\tImportant\tConsidered\tNot Considered
 *
 * Each data row has the factor name and an "X" in the appropriate column.
 * When rendered as innerText, empty cells become empty strings between tabs.
 */
function parseAdmissionFactors(text: string, data: ParsedCdsData): void {
  const lines = text.split("\n");
  const factorsHeaderIndex = lines.findIndex(
    (line) => line.trim().toLowerCase().startsWith("factors of admission")
  );

  if (factorsHeaderIndex === -1) return;

  // Parse the header to determine column order
  const headerColumns = lines[factorsHeaderIndex].split("\t");
  const columnRatings: (FactorRating | null)[] = headerColumns.map((col) => {
    const normalized = col.trim().toLowerCase();
    return COLUMN_TO_RATING[normalized] ?? null;
  });

  // Parse each factor row
  for (let i = factorsHeaderIndex + 1; i < lines.length && i < factorsHeaderIndex + 25; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Stop if we hit a different section
    if (
      line.toLowerCase().startsWith("transfer") ||
      line.toLowerCase().startsWith("tuition") ||
      line.toLowerCase().startsWith("student body")
    ) {
      break;
    }

    const columns = line.split("\t");
    if (columns.length < 2) continue;

    const factorLabel = columns[0].trim().toLowerCase();
    const fieldName = FACTOR_LABEL_TO_FIELD[factorLabel];
    if (!fieldName) continue;

    // Find which column has "X" or a non-empty value
    for (let colIdx = 1; colIdx < columns.length; colIdx++) {
      const cellValue = columns[colIdx].trim().toUpperCase();
      if (cellValue === "X" || cellValue === "✓" || cellValue === "✗") {
        const rating = columnRatings[colIdx];
        if (rating) {
          (data as unknown as Record<string, unknown>)[fieldName] = rating;
        }
        break;
      }
    }
  }
}

/**
 * Parse any financial aid section if present.
 * commondatasets.fyi may not include this for all schools.
 */
function parseFinancialAid(text: string, data: ParsedCdsData): void {
  const lowerText = text.toLowerCase();

  // Look for "percent of need met" or "average need met"
  const percentNeedMetMatch = text.match(
    /(?:percent(?:age)?\s*(?:of\s*)?need\s*met|average\s*percent\s*(?:of\s*)?need\s*met)[:\s]*([0-9.]+)%?/i
  );
  if (percentNeedMetMatch) {
    data.percentNeedMet = parseFloat(percentNeedMetMatch[1]);
  }

  // Average financial aid package
  const avgAidMatch = text.match(
    /(?:average\s*)?(?:financial\s*)?aid\s*(?:package|award)[:\s]*\$?([0-9,]+)/i
  );
  if (avgAidMatch) {
    data.avgFinancialAidPackage = parseNumber(avgAidMatch[1]);
  }

  // Merit aid percentage
  const meritPctMatch = text.match(
    /([0-9.]+)%\s*(?:of\s*)?(?:students?\s*)?(?:receiv(?:ing|ed)\s*)?merit/i
  );
  if (meritPctMatch) {
    data.percentReceivingMeritAid = parseFloat(meritPctMatch[1]);
  }

  // Average merit aid amount
  const meritAmtMatch = text.match(
    /(?:average\s*)?merit\s*(?:aid|scholarship)\s*(?:amount)?[:\s]*\$?([0-9,]+)/i
  );
  if (meritAmtMatch) {
    data.avgMeritAidAmount = parseNumber(meritAmtMatch[1]);
  }
}

/**
 * Parse the full rendered text content of a commondatasets.fyi page.
 */
function parseRenderedText(text: string): ParsedCdsData {
  const data: ParsedCdsData = {
    edApplicants: null,
    edAdmitted: null,
    eaApplicants: null,
    eaAdmitted: null,
    waitlistOffered: null,
    waitlistAccepted: null,
    waitlistAdmitted: null,
    factorGpa: null,
    factorClassRank: null,
    factorTestScores: null,
    factorEssay: null,
    factorRecommendations: null,
    factorExtracurriculars: null,
    factorTalentAbility: null,
    factorCharacter: null,
    factorFirstGen: null,
    factorAlumniRelation: null,
    factorGeographic: null,
    factorStateResidency: null,
    factorVolunteer: null,
    factorWorkExperience: null,
    factorDemonstratedInterest: null,
    gpaPercent400: null,
    gpaPercent375to399: null,
    gpaPercent350to374: null,
    gpaPercent325to349: null,
    gpaPercent300to324: null,
    gpaPercentBelow300: null,
    percentNeedMet: null,
    avgFinancialAidPackage: null,
    percentReceivingMeritAid: null,
    avgMeritAidAmount: null,
  };

  parseApplicantPools(text, data);
  parseGpaBreakdown(text, data);
  parseAdmissionFactors(text, data);
  parseFinancialAid(text, data);

  return data;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const connectionString = DATABASE_URL!;
  const client = postgres(connectionString);
  const db = drizzle(client);

  console.log("Starting Common Data Set (CDS) ingestion (Puppeteer mode)...");
  console.log(`Source: commondatasets.fyi`);
  console.log(`Schools to process: ${CDS_SCHOOLS.length}`);
  console.log();

  // Launch a single browser instance for all schools
  console.log("Launching headless browser...");
  const browser = await puppeteer.launch({ headless: true });

  let totalUpdated = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  try {
    for (const schoolConfig of CDS_SCHOOLS) {
      process.stdout.write(`Processing ${schoolConfig.slug}... `);

      try {
        // Find school in our DB — exact match first, then prefix match
        let matchingSchools = await db
          .select({ id: schools.id, name: schools.name })
          .from(schools)
          .where(eq(schools.name, schoolConfig.dbSearchName))
          .limit(1);

        if (matchingSchools.length === 0) {
          matchingSchools = await db
            .select({ id: schools.id, name: schools.name })
            .from(schools)
            .where(ilike(schools.name, `${schoolConfig.dbSearchName}%`))
            .limit(1);
        }

        if (matchingSchools.length === 0) {
          console.log(`SKIPPED (not in DB: "${schoolConfig.dbSearchName}")`);
          totalSkipped++;
          continue;
        }

        const targetSchool = matchingSchools[0];

        // Fetch rendered page text via Puppeteer
        const renderedText = await fetchRenderedPageText(browser, schoolConfig.slug);
        const cdsData = parseRenderedText(renderedText);

        // Count non-null fields for reporting
        const fieldValues = Object.values(cdsData);
        const nonNullCount = fieldValues.filter((v) => v !== null).length;

        // Update school with CDS data
        await db
          .update(schools)
          .set({
            edApplicants: cdsData.edApplicants,
            edAdmitted: cdsData.edAdmitted,
            eaApplicants: cdsData.eaApplicants,
            eaAdmitted: cdsData.eaAdmitted,
            waitlistOffered: cdsData.waitlistOffered,
            waitlistAccepted: cdsData.waitlistAccepted,
            waitlistAdmitted: cdsData.waitlistAdmitted,
            factorGpa: cdsData.factorGpa,
            factorClassRank: cdsData.factorClassRank,
            factorTestScores: cdsData.factorTestScores,
            factorEssay: cdsData.factorEssay,
            factorRecommendations: cdsData.factorRecommendations,
            factorExtracurriculars: cdsData.factorExtracurriculars,
            factorTalentAbility: cdsData.factorTalentAbility,
            factorCharacter: cdsData.factorCharacter,
            factorFirstGen: cdsData.factorFirstGen,
            factorAlumniRelation: cdsData.factorAlumniRelation,
            factorGeographic: cdsData.factorGeographic,
            factorStateResidency: cdsData.factorStateResidency,
            factorVolunteer: cdsData.factorVolunteer,
            factorWorkExperience: cdsData.factorWorkExperience,
            factorDemonstratedInterest: cdsData.factorDemonstratedInterest,
            gpaPercent400: cdsData.gpaPercent400?.toString() ?? null,
            gpaPercent375to399: cdsData.gpaPercent375to399?.toString() ?? null,
            gpaPercent350to374: cdsData.gpaPercent350to374?.toString() ?? null,
            gpaPercent325to349: cdsData.gpaPercent325to349?.toString() ?? null,
            gpaPercent300to324: cdsData.gpaPercent300to324?.toString() ?? null,
            gpaPercentBelow300: cdsData.gpaPercentBelow300?.toString() ?? null,
            percentNeedMet: cdsData.percentNeedMet?.toString() ?? null,
            avgFinancialAidPackage: cdsData.avgFinancialAidPackage,
            percentReceivingMeritAid: cdsData.percentReceivingMeritAid?.toString() ?? null,
            avgMeritAidAmount: cdsData.avgMeritAidAmount,
            cdsDataYear: "2023-2024",
            cdsSourceUrl: `https://www.commondatasets.fyi/${schoolConfig.slug}`,
            updatedAt: new Date(),
          })
          .where(eq(schools.id, targetSchool.id));

        console.log(`OK (${nonNullCount}/${fieldValues.length} fields) → ${targetSchool.name}`);
        totalUpdated++;
      } catch (error) {
        console.log(`ERROR: ${error instanceof Error ? error.message : error}`);
        totalErrors++;
      }

      await new Promise((resolve) => setTimeout(resolve, REQUEST_DELAY_MS));
    }
  } finally {
    await browser.close();
    console.log("\nBrowser closed.");
  }

  console.log("\n--- CDS Ingestion Complete ---");
  console.log(`Updated: ${totalUpdated} schools`);
  console.log(`Skipped: ${totalSkipped} (not in DB — run ingest:scorecard first)`);
  console.log(`Errors: ${totalErrors}`);

  if (totalSkipped > 0) {
    console.log("\nNote: Skipped schools need to be in the DB first.");
    console.log("Run `npm run ingest:scorecard` to populate schools from College Scorecard.");
  }

  await client.end();
  process.exit(0);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
