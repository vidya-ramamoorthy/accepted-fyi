/**
 * Direct-source CDS Waitlist Scraper
 *
 * Fills gaps left by the aggregator-based ingest-cds.ts by scraping each
 * school's own Common Data Set PDF directly from their institutional research
 * (IR) page. Focus: Section C2 (waitlist) only, since that's the live need.
 *
 * Usage:
 *   npx tsx scripts/ingest-ivy-cds.ts
 *
 * Prerequisites:
 *   - DATABASE_URL set in .env.local
 *   - Schools already exist in DB
 *   - pdf-parse installed (npm install --save-dev pdf-parse @types/pdf-parse)
 */

import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import { PDFParse } from "pdf-parse";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import { schools } from "../src/lib/db/schema";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("Missing DATABASE_URL in environment.");
  process.exit(1);
}

// ─── School CDS sources ─────────────────────────────────────────────────────
//
// Only schools NOT covered by ingest-cds.ts (or where C2 data was missing
// after the last aggregator run). Direct PDF URLs preferred for stability.

interface IvyCdsSource {
  dbName: string; // exact schools.name in our DB
  shortName: string; // for logging
  pdfUrl: string; // direct PDF URL
  cycleLabel: string; // "2023-2024" — for logs only, not stored
}

const SOURCES: IvyCdsSource[] = [
  {
    dbName: "University of Michigan-Ann Arbor",
    shortName: "Michigan",
    pdfUrl: "https://obp.umich.edu/wp-content/uploads/pubdata/cds/CDS_2024-25_UMAA.pdf",
    cycleLabel: "2024-2025",
  },
  {
    dbName: "Northwestern University",
    shortName: "Northwestern",
    pdfUrl: "https://www.enrollment.northwestern.edu/data/2024-2025.pdf",
    cycleLabel: "2024-2025",
  },
  {
    dbName: "University of Chicago",
    shortName: "UChicago",
    pdfUrl:
      "https://data.uchicago.edu/files/2025/08/CDS_2024-2025_to_publish.pdf",
    cycleLabel: "2024-2025",
  },
  {
    dbName: "University of Virginia-Main Campus",
    shortName: "UVA",
    pdfUrl:
      "https://ira.virginia.edu/sites/g/files/jsddwu1106/files/2025-03/CDS_2024-2025_508.pdf",
    cycleLabel: "2024-2025",
  },
  {
    dbName: "University of California-Los Angeles",
    shortName: "UCLA",
    pdfUrl: "https://apb.ucla.edu/file/d1ab04b3-ee89-4cf2-9124-8dc0471b5e5a",
    cycleLabel: "2025-2026",
  },
  // Berkeley publishes CDS as Google Sheets, not PDF.
  // Skipped here; needs a separate Sheets-based ingestor.
];

// ─── Section C2 parser ──────────────────────────────────────────────────────
//
// CDS Section C2 is formatted consistently across schools:
//
//   C2. If your institution has a waiting list, please answer the
//       questions below. Numbers should reflect waiting-list activity
//       as of the date of the final admission decision, not the
//       initial waiting-list offer.
//   Number of qualified applicants offered a place on the waiting list:  XXXX
//   Number accepting a place on the waiting list:                        XXXX
//   Number of waiting-list students admitted:                            XXXX
//
// In PDF-extracted plain text, layout breaks often split the label
// and the number with whitespace or newlines. Regexes below are
// tolerant to both arrangements.

interface WaitlistData {
  waitlistOffered: number | null;
  waitlistAccepted: number | null;
  waitlistAdmitted: number | null;
}

function parseNumber(raw: string | undefined): number | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[,\s]/g, "");
  if (!cleaned || cleaned === "NA" || cleaned === "N/A" || cleaned === "-")
    return null;
  const n = parseInt(cleaned, 10);
  return Number.isFinite(n) ? n : null;
}

function extractWaitlist(text: string): WaitlistData {
  // Normalize whitespace to make regex matching robust to PDF line breaks
  const normalized = text
    .replace(/\r/g, "\n")
    .replace(/\u00A0/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n+/g, "\n");

  // Locate any C2 header. Schools vary the trailing text wildly:
  //   "C2. If your institution has a waiting list..."
  //   "C2. First-time, first-year wait-listed students"
  //   "C2 Waiting list"
  // Strategy: find a C2 anchor followed (within ~200 chars) by a wait/waiting reference.
  let windowStart = -1;
  const c2HeaderRegex = /C2[\.\s][^\n]{0,200}wait[-\s]?list/i;
  const c2HeaderMatch = normalized.match(c2HeaderRegex);
  if (c2HeaderMatch && c2HeaderMatch.index !== undefined) {
    windowStart = c2HeaderMatch.index;
  } else {
    // Fallback: take the first wait-list mention; risky but better than nothing.
    const fallback = normalized.search(/wait[-\s]?listed?\s+students?\s+admitted/i);
    if (fallback === -1) return empty();
    windowStart = Math.max(0, fallback - 800);
  }

  // C2 is short; the next section (C3) follows within ~2000-3000 chars.
  const c2Window = normalized.slice(windowStart, windowStart + 3000);

  // Tolerant matchers. Capture group accepts digits with optional commas, OR
  // common redaction tokens ("C or t", "N/A", "—") — these resolve to null
  // via parseNumber but at least confirm the field was attempted.
  const valueGroup = "([\\d,]+|C\\s+or\\s+t|N/A|NA|—|-)";

  const offeredMatch = c2Window.match(
    new RegExp(
      `offered\\s+a\\s+place\\s+on\\s+(?:the\\s+)?wait(?:ing|[\\s-])?list[^\\d\\nCN—-]*${valueGroup}`,
      "i"
    )
  );
  const acceptedMatch = c2Window.match(
    new RegExp(
      `accepting\\s+a\\s+place\\s+on\\s+(?:the\\s+)?wait(?:ing|[\\s-])?list[^\\d\\nCN—-]*${valueGroup}`,
      "i"
    )
  );
  const admittedMatch = c2Window.match(
    new RegExp(
      `wait(?:ing|[\\s-])?listed?\\s+students?\\s+admitted[^\\d\\nCN—-]*${valueGroup}`,
      "i"
    )
  );

  return {
    waitlistOffered: parseNumber(offeredMatch?.[1]),
    waitlistAccepted: parseNumber(acceptedMatch?.[1]),
    waitlistAdmitted: parseNumber(admittedMatch?.[1]),
  };
}

function empty(): WaitlistData {
  return {
    waitlistOffered: null,
    waitlistAccepted: null,
    waitlistAdmitted: null,
  };
}

// ─── Main ──────────────────────────────────────────────────────────────────

async function fetchPdf(url: string): Promise<Buffer> {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; accepted-fyi-cds-ingest/1.0; +https://accepted.fyi)",
    },
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} fetching ${url}`);
  }
  const array = await response.arrayBuffer();
  return Buffer.from(array);
}

async function processSource(source: IvyCdsSource): Promise<WaitlistData | null> {
  try {
    console.log(`\nFetching CDS for ${source.shortName}...`);
    const pdfBuffer = await fetchPdf(source.pdfUrl);
    console.log(`  downloaded ${(pdfBuffer.length / 1024).toFixed(0)} KB`);
    const parser = new PDFParse({ data: new Uint8Array(pdfBuffer) });
    const textResult = await parser.getText();
    await parser.destroy();
    const waitlist = extractWaitlist(textResult.text);
    console.log(
      `  C2 → offered: ${waitlist.waitlistOffered}, accepted: ${waitlist.waitlistAccepted}, admitted: ${waitlist.waitlistAdmitted}`
    );
    return waitlist;
  } catch (error) {
    console.error(
      `  ✗ ${source.shortName} failed: ${error instanceof Error ? error.message : String(error)}`
    );
    return null;
  }
}

async function main() {
  const client = postgres(DATABASE_URL!, { max: 2 });
  const db = drizzle(client);

  let updated = 0;
  let failed = 0;
  let skipped = 0;

  for (const source of SOURCES) {
    const result = await processSource(source);
    if (!result) {
      failed++;
      continue;
    }

    // Only update if we extracted at least one waitlist field
    if (
      result.waitlistOffered === null &&
      result.waitlistAccepted === null &&
      result.waitlistAdmitted === null
    ) {
      console.log(`  skipped ${source.shortName} — no waitlist fields parsed`);
      skipped++;
      continue;
    }

    try {
      const updateResult = await db
        .update(schools)
        .set({
          waitlistOffered: result.waitlistOffered,
          waitlistAccepted: result.waitlistAccepted,
          waitlistAdmitted: result.waitlistAdmitted,
        })
        .where(eq(schools.name, source.dbName))
        .returning({ id: schools.id, name: schools.name });

      if (updateResult.length === 0) {
        console.log(
          `  ⚠ no school matched "${source.dbName}" in DB — skipped update`
        );
        failed++;
      } else {
        console.log(`  ✓ updated ${updateResult[0].name}`);
        updated++;
      }
    } catch (error) {
      console.error(
        `  ✗ DB update failed for ${source.shortName}: ${error instanceof Error ? error.message : String(error)}`
      );
      failed++;
    }

    // Throttle between requests
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }

  console.log(`\n--- Direct-source Ivy CDS ingest complete ---`);
  console.log(`Updated: ${updated}`);
  console.log(`Skipped (no C2 parse): ${skipped}`);
  console.log(`Failed: ${failed}`);

  await client.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
