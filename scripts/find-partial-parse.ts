/**
 * Find posts with partial-parse bug signature: all entries are waitlisted
 * with 3+ entries. This indicates the regex parser only captured the
 * "Waitlist:" section and dropped "Accept:" / "Reject:" sections.
 */
import * as fs from "fs";
import postgres from "postgres";

const envFile = fs.readFileSync(".env.production", "utf8");
for (const line of envFile.split("\n")) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) process.env[match[1].trim()] = match[2].trim();
}

const sql = postgres(process.env.DATABASE_URL!);

async function main() {
const rows = await sql`
  SELECT source_post_id,
    admission_cycle,
    count(*)::int as total,
    count(case when decision = 'waitlisted' then 1 end)::int as waitlisted,
    count(case when decision = 'accepted' then 1 end)::int as accepted,
    count(case when decision = 'rejected' then 1 end)::int as rejected,
    count(case when decision = 'deferred' then 1 end)::int as deferred
  FROM admission_submissions
  WHERE source_post_id IS NOT NULL
    AND data_source = 'reddit'
  GROUP BY source_post_id, admission_cycle
  HAVING count(*) >= 3
    AND count(case when decision = 'waitlisted' then 1 end) = count(*)
  ORDER BY admission_cycle DESC, count(*) DESC
`;

console.log("Posts where ALL entries are waitlisted (3+ entries):");
console.log("Cycle         | PostID   | Total");
console.log("-".repeat(50));
const byCycle: Record<string, number> = {};
const postsByCycle: Record<string, string[]> = {};
for (const r of rows) {
  byCycle[r.admission_cycle] = (byCycle[r.admission_cycle] || 0) + 1;
  if (!postsByCycle[r.admission_cycle]) postsByCycle[r.admission_cycle] = [];
  postsByCycle[r.admission_cycle].push(r.source_post_id);
  console.log(`${r.admission_cycle} | ${r.source_post_id} | ${r.total}`);
}
console.log("\nBy cycle:");
for (const [cycle, count] of Object.entries(byCycle)) {
  console.log(`  ${cycle}: ${count} suspicious posts`);
}
console.log(`\nTotal: ${rows.length} posts across all cycles`);

await sql.end();
}
main().catch(console.error);
