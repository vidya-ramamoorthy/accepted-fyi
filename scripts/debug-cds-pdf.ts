/**
 * Debug helper — dumps the C2 region of a CDS PDF so we can tune the parser.
 *
 * Usage:
 *   npx tsx scripts/debug-cds-pdf.ts <url>
 */

import { PDFParse } from "pdf-parse";

const url = process.argv[2];
if (!url) {
  console.error("Usage: tsx scripts/debug-cds-pdf.ts <pdf-url>");
  process.exit(1);
}

async function main() {
  console.log(`Fetching ${url}...`);
  const response = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; cds-debug/1.0)" },
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  console.log(`  ${(buffer.length / 1024).toFixed(0)} KB`);

  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  const result = await parser.getText();
  await parser.destroy();

  const text = result.text;
  console.log(`  total text length: ${text.length} chars`);
  console.log("---");

  // Find C2-ish anchors
  const c2Idx = text.search(/C2[\.\s]/);
  console.log(`  first 'C2' index: ${c2Idx}`);

  if (c2Idx >= 0) {
    console.log("\n=== C2 WINDOW (1500 chars) ===");
    console.log(text.slice(c2Idx, c2Idx + 1500));
  }

  // Also search for waitlist keywords directly
  const waitlistMatches = [...text.matchAll(/wait[-\s]?list/gi)].slice(0, 5);
  console.log(`\n=== WAITLIST OCCURRENCES (first 5) ===`);
  for (const m of waitlistMatches) {
    const start = Math.max(0, (m.index ?? 0) - 80);
    const end = Math.min(text.length, (m.index ?? 0) + 200);
    console.log(`@${m.index}: ${text.slice(start, end).replace(/\n/g, " ↵ ")}`);
    console.log("---");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
