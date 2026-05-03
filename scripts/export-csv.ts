/**
 * Export CSVs for sharing Reddit ingestion data (e.g. with mods).
 *
 * Generates two files in assets/:
 *   - tab1-dashboard-final.csv (one row per school, aggregated)
 *   - tab2-raw-data-final.csv  (one row per decision)
 *
 * Filters to a single admission cycle (default: 2025-2026, Class of 2030).
 *
 * Usage:
 *   npx tsx scripts/export-csv.ts                    # 2025-2026 cycle
 *   npx tsx scripts/export-csv.ts --cycle 2024-2025  # override cycle
 */
import * as fs from "fs";
import postgres from "postgres";

const envFile = fs.readFileSync(".env.production", "utf8");
for (const line of envFile.split("\n")) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) process.env[match[1].trim()] = match[2].trim();
}

const sql = postgres(process.env.DATABASE_URL!);

const args = process.argv.slice(2);
const cycleIdx = args.indexOf("--cycle");
const CYCLE = cycleIdx >= 0 ? args[cycleIdx + 1] : "2025-2026";

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function row(values: unknown[]): string {
  return values.map(csvEscape).join(",");
}

async function main() {
  console.log(`Exporting CSVs for cycle ${CYCLE}...\n`);

  // ─── Tab 1: dashboard (per-school aggregates) ────────────────────────────
  const dashboardRows = await sql`
    SELECT
      s.name as school,
      count(*)::int as total_outcomes,
      count(case when a.decision = 'accepted' then 1 end)::int as accepted,
      count(case when a.decision = 'rejected' then 1 end)::int as rejected,
      count(case when a.decision = 'waitlisted' then 1 end)::int as waitlisted,
      count(case when a.decision = 'deferred' then 1 end)::int as deferred,
      round(
        100.0 * count(case when a.decision = 'accepted' then 1 end)::numeric
        / nullif(count(*), 0),
        1
      ) as reported_accept_pct,
      round(avg(case when a.decision = 'accepted' then a.gpa_unweighted::numeric end), 2) as avg_acc_gpa,
      round(avg(case when a.decision = 'accepted' then a.sat_score end))::int as avg_acc_sat,
      round(avg(case when a.decision = 'rejected' then a.gpa_unweighted::numeric end), 2) as avg_rej_gpa,
      round(avg(case when a.decision = 'rejected' then a.sat_score end))::int as avg_rej_sat,
      s.acceptance_rate as official_accept_rate,
      s.sat_25th_percentile as official_sat_25th,
      s.sat_75th_percentile as official_sat_75th
    FROM admission_submissions a
    JOIN schools s ON s.id = a.school_id
    WHERE a.admission_cycle = ${CYCLE}
      AND a.data_source = 'reddit'
    GROUP BY s.id, s.name, s.acceptance_rate, s.sat_25th_percentile, s.sat_75th_percentile
    HAVING count(*) >= 1
    ORDER BY count(*) DESC, s.name ASC
  `;

  const tab1Header = row([
    "school", "total_outcomes", "accepted", "rejected", "waitlisted", "deferred",
    "reported_accept_pct", "avg_acc_gpa", "avg_acc_sat", "avg_rej_gpa", "avg_rej_sat",
    "official_accept_rate", "official_sat_25th", "official_sat_75th",
  ]);
  const tab1Lines = [tab1Header];
  for (const r of dashboardRows) {
    tab1Lines.push(row([
      r.school, r.total_outcomes, r.accepted, r.rejected, r.waitlisted, r.deferred,
      r.reported_accept_pct, r.avg_acc_gpa, r.avg_acc_sat, r.avg_rej_gpa, r.avg_rej_sat,
      r.official_accept_rate, r.official_sat_25th, r.official_sat_75th,
    ]));
  }
  fs.writeFileSync("assets/tab1-dashboard-final.csv", tab1Lines.join("\n") + "\n");
  console.log(`  tab1-dashboard-final.csv: ${dashboardRows.length} schools`);

  // ─── Tab 2: raw data (per-decision rows) ─────────────────────────────────
  const rawRows = await sql`
    SELECT
      s.name as school,
      a.decision,
      a.application_round as round,
      a.gpa_unweighted as gpa_uw,
      a.gpa_weighted as gpa_w,
      a.sat_score as sat,
      a.act_score as act,
      a.intended_major as major,
      a.state_of_residence as state,
      a.first_generation as first_gen,
      a.ap_courses_count as ap_count,
      a.data_source as source
    FROM admission_submissions a
    JOIN schools s ON s.id = a.school_id
    WHERE a.admission_cycle = ${CYCLE}
      AND a.data_source = 'reddit'
    ORDER BY s.name ASC, a.decision ASC
  `;

  const tab2Header = row([
    "school", "decision", "round", "gpa_uw", "gpa_w", "sat", "act",
    "major", "state", "first_gen", "ap_count", "source",
  ]);
  const tab2Lines = [tab2Header];
  for (const r of rawRows) {
    tab2Lines.push(row([
      r.school, r.decision, r.round, r.gpa_uw, r.gpa_w, r.sat, r.act,
      r.major, r.state, r.first_gen, r.ap_count, r.source,
    ]));
  }
  fs.writeFileSync("assets/tab2-raw-data-final.csv", tab2Lines.join("\n") + "\n");
  console.log(`  tab2-raw-data-final.csv: ${rawRows.length} decisions`);

  // ─── Totals summary ──────────────────────────────────────────────────────
  const [totals] = await sql`
    SELECT
      count(*)::int as total,
      count(case when decision = 'accepted' then 1 end)::int as accepted,
      count(case when decision = 'rejected' then 1 end)::int as rejected,
      count(case when decision = 'waitlisted' then 1 end)::int as waitlisted,
      count(case when decision = 'deferred' then 1 end)::int as deferred,
      count(distinct source_post_id)::int as unique_posts
    FROM admission_submissions
    WHERE admission_cycle = ${CYCLE}
      AND data_source = 'reddit'
  `;

  console.log(`\n=== ${CYCLE} TOTALS ===`);
  console.log(`  Total decisions:  ${totals.total}`);
  console.log(`  Accepted:         ${totals.accepted}`);
  console.log(`  Rejected:         ${totals.rejected}`);
  console.log(`  Waitlisted:       ${totals.waitlisted}`);
  console.log(`  Deferred:         ${totals.deferred}`);
  console.log(`  Unique posts:     ${totals.unique_posts}`);
  console.log(`  Schools covered:  ${dashboardRows.length}`);

  await sql.end();
}

main().catch(console.error);
