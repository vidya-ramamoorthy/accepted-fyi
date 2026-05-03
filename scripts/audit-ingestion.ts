/**
 * Audit script for Reddit ingestion data quality.
 *
 * Checks for:
 * 1. Posts with suspiciously high waitlist rates (>50% = likely prediction posts)
 * 2. Posts where ALL decisions are the same (100% waitlisted/rejected = predictions)
 * 3. Known bad title patterns (chance-me, prediction posts) via Arctic Shift
 * 4. Deleted/removed source posts (can't verify content)
 * 5. Cycle mismatches (post date vs assigned cycle)
 * 6. Duplicate entries (same school+decision in one post)
 *
 * Uses Arctic Shift API for title verification (no rate limiting, unlike Reddit API).
 *
 * Usage:
 *   npx tsx scripts/audit-ingestion.ts                    # audit all cycles
 *   npx tsx scripts/audit-ingestion.ts --cycle 2024-2025  # audit specific cycle
 *   npx tsx scripts/audit-ingestion.ts --fix              # delete flagged entries
 *   npx tsx scripts/audit-ingestion.ts --dry-run          # show what --fix would delete
 */
import * as fs from "fs";
import postgres from "postgres";

// Load env
const envFile = fs.readFileSync(".env.production", "utf8");
for (const line of envFile.split("\n")) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) process.env[match[1].trim()] = match[2].trim();
}

const sql = postgres(process.env.DATABASE_URL!);

// NOTE: Many "chance me" titled posts on r/collegeresults actually contain REAL results
// that the student updated later. Only flag titles that are PURELY prediction-seeking
// with no results content. The audit uses these for flagging, NOT auto-deletion.
const BAD_TITLE_PATTERNS = [
  /^chance\s*me\b/i,                    // starts with "chance me"
  /\bchance\s*me[!?.]*$/i,              // ends with "chance me"
  /what\s*are\s*my\s*chances\??$/i,     // "what are my chances?" as the main question
  /\bpredict\s*(my\s*)?(results|chances)/i, // "predict my results"
  /\bguess\s*(my\s*)?(results|chances)/i,   // "guess my results"
  /\breverse\s*chance/i,                // "reverse chance me"
  /\bwill\s*i\s*get\s*in\b/i,          // "will i get in"
  /\bwhere\s*will\s*i\s*get\s*in\b/i,  // "where will i get in"
  /\bdo\s*i\s*have\s*a\s*(shot|chance)\s*at\b/i, // "do I have a chance at..."
];

interface FlaggedPost {
  sourcePostId: string;
  reason: string;
  entryCount: number;
  details: string;
  title?: string;
}

interface PostInfo {
  title: string;
  deleted: boolean;
  createdUtc: number;
  selftext: string;
}

// ─── Check 1: High waitlist rates ───────────────────────────────────────────

async function checkSuspiciousWaitlistRates(cycleFilter?: string): Promise<FlaggedPost[]> {
  const flagged: FlaggedPost[] = [];

  const rows = await sql`
    SELECT source_post_id,
      count(*)::int as total,
      count(case when decision = 'waitlisted' then 1 end)::int as waitlisted,
      count(case when decision = 'accepted' then 1 end)::int as accepted,
      count(case when decision = 'rejected' then 1 end)::int as rejected,
      count(case when decision = 'deferred' then 1 end)::int as deferred
    FROM admission_submissions
    WHERE source_post_id IS NOT NULL
      ${cycleFilter ? sql`AND admission_cycle = ${cycleFilter}` : sql``}
    GROUP BY source_post_id
    HAVING count(*) >= 5
      AND count(case when decision = 'waitlisted' then 1 end)::float / count(*)::float > 0.5
    ORDER BY count(*) DESC
  `;

  for (const row of rows) {
    flagged.push({
      sourcePostId: row.source_post_id,
      reason: "HIGH_WAITLIST_RATE",
      entryCount: row.total,
      details: `${row.waitlisted}/${row.total} waitlisted (${row.accepted} acc, ${row.rejected} rej, ${row.deferred} def)`,
    });
  }

  return flagged;
}

// ─── Check 2: All decisions identical (100% one type = likely fake) ──────────

async function checkUniformDecisions(cycleFilter?: string): Promise<FlaggedPost[]> {
  const flagged: FlaggedPost[] = [];

  const rows = await sql`
    SELECT source_post_id,
      count(*)::int as total,
      count(distinct decision)::int as distinct_decisions,
      min(decision) as only_decision
    FROM admission_submissions
    WHERE source_post_id IS NOT NULL
      ${cycleFilter ? sql`AND admission_cycle = ${cycleFilter}` : sql``}
    GROUP BY source_post_id
    HAVING count(*) >= 5
      AND count(distinct decision) = 1
      AND min(decision) IN ('waitlisted', 'deferred')
    ORDER BY count(*) DESC
  `;

  for (const row of rows) {
    flagged.push({
      sourcePostId: row.source_post_id,
      reason: "ALL_SAME_DECISION",
      entryCount: row.total,
      details: `All ${row.total} entries are "${row.only_decision}" — likely a prediction post`,
    });
  }

  return flagged;
}

// ─── Check 3: Duplicate entries ──────────────────────────────────────────────

async function checkDuplicatePatterns(cycleFilter?: string): Promise<FlaggedPost[]> {
  const flagged: FlaggedPost[] = [];

  const rows = await sql`
    SELECT a1.source_post_id, count(*)::int as dup_count
    FROM admission_submissions a1
    JOIN admission_submissions a2
      ON a1.source_post_id = a2.source_post_id
      AND a1.school_id = a2.school_id
      AND a1.decision = a2.decision
      AND a1.id != a2.id
    WHERE a1.source_post_id IS NOT NULL
      ${cycleFilter ? sql`AND a1.admission_cycle = ${cycleFilter}` : sql``}
    GROUP BY a1.source_post_id
    HAVING count(*) >= 3
    ORDER BY dup_count DESC
    LIMIT 20
  `;

  for (const row of rows) {
    flagged.push({
      sourcePostId: row.source_post_id,
      reason: "DUPLICATE_ENTRIES",
      entryCount: row.dup_count,
      details: `${row.dup_count} duplicate school+decision pairs within same post`,
    });
  }

  return flagged;
}

// ─── Check 4: Posts with decisions for unreleased rounds ─────────────────────

async function checkUnreleasedDecisions(cycleFilter?: string): Promise<FlaggedPost[]> {
  const flagged: FlaggedPost[] = [];

  // Only check current cycle — look for RD decisions posted before March 15
  // (most RD decisions come out mid-March to early April)
  const rows = await sql`
    SELECT source_post_id,
      count(*)::int as total,
      count(case when decision = 'waitlisted' then 1 end)::int as waitlisted,
      min(created_at)::text as earliest_entry
    FROM admission_submissions
    WHERE source_post_id IS NOT NULL
      AND admission_cycle = '2025-2026'
      AND application_round = 'regular'
      AND created_at < '2025-03-01'
      ${cycleFilter ? sql`AND admission_cycle = ${cycleFilter}` : sql``}
    GROUP BY source_post_id
    HAVING count(*) >= 3
    ORDER BY count(*) DESC
  `;

  for (const row of rows) {
    flagged.push({
      sourcePostId: row.source_post_id,
      reason: "EARLY_RD_DECISIONS",
      entryCount: row.total,
      details: `${row.total} RD decisions entered before March 2025 (earliest: ${row.earliest_entry})`,
    });
  }

  return flagged;
}

// ─── Arctic Shift title verification (fast, no rate limiting) ────────────────

async function fetchPostInfoFromArcticShift(
  postIds: string[]
): Promise<Map<string, PostInfo>> {
  const results = new Map<string, PostInfo>();
  const batchSize = 100; // Arctic Shift supports larger batches

  for (let i = 0; i < postIds.length; i += batchSize) {
    const batch = postIds.slice(i, i + batchSize);
    const idsParam = batch.join(",");

    try {
      const response = await fetch(
        `https://arctic-shift.photon-reddit.com/api/posts/ids?ids=${idsParam}`
      );

      if (!response.ok) {
        console.error(`  Arctic Shift batch ${i / batchSize + 1} failed: ${response.status}`);
        for (const postId of batch) {
          results.set(postId, { title: "[fetch failed]", deleted: true, createdUtc: 0, selftext: "" });
        }
        continue;
      }

      const data = (await response.json()) as any;
      const posts = data.data ?? [];

      // Index returned posts by ID
      const postMap = new Map<string, any>();
      for (const post of posts) {
        postMap.set(post.id, post);
      }

      for (const postId of batch) {
        const post = postMap.get(postId);
        if (!post) {
          results.set(postId, { title: "[not found]", deleted: true, createdUtc: 0, selftext: "" });
          continue;
        }

        const selftext = post.selftext || "";
        const isDeleted =
          selftext === "[deleted]" ||
          selftext === "[removed]" ||
          selftext === "";

        results.set(postId, {
          title: post.title || "[no title]",
          deleted: isDeleted,
          createdUtc: post.created_utc || 0,
          selftext,
        });
      }
    } catch (error) {
      console.error(`  Arctic Shift batch error:`, error);
      for (const postId of batch) {
        results.set(postId, { title: "[error]", deleted: true, createdUtc: 0, selftext: "" });
      }
    }

    // Gentle rate limit for Arctic Shift
    if (i + batchSize < postIds.length) {
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }

  return results;
}

function isBadTitle(title: string): boolean {
  return BAD_TITLE_PATTERNS.some((pattern) => pattern.test(title));
}

function expectedCycleFromDate(createdUtc: number): string {
  const date = new Date(createdUtc * 1000);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;

  // Posts from Aug-Dec belong to the current cycle year
  // Posts from Jan-Jul belong to the previous cycle year
  if (month >= 8) {
    return `${year}-${year + 1}`;
  } else {
    return `${year - 1}-${year}`;
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const cycleFilter = args.includes("--cycle")
    ? args[args.indexOf("--cycle") + 1]
    : undefined;
  const shouldFix = args.includes("--fix");
  const isDryRun = args.includes("--dry-run");

  console.log(`\n${"=".repeat(60)}`);
  console.log(`  INGESTION DATA QUALITY AUDIT`);
  console.log(`  Cycle: ${cycleFilter || "ALL"}`);
  console.log(`  Mode: ${shouldFix ? "FIX (will delete)" : isDryRun ? "DRY RUN" : "REPORT ONLY"}`);
  console.log(`${"=".repeat(60)}\n`);

  // Get baseline counts
  const [totalCount] = await sql`
    SELECT count(*)::int as total FROM admission_submissions
    WHERE source_post_id IS NOT NULL
      ${cycleFilter ? sql`AND admission_cycle = ${cycleFilter}` : sql``}
  `;
  console.log(`Total entries in scope: ${totalCount.total}\n`);

  console.log("Running DB checks...\n");

  const allFlagged: FlaggedPost[] = [];

  // Check 1: High waitlist rates
  const waitlistFlags = await checkSuspiciousWaitlistRates(cycleFilter);
  console.log(`  [CHECK 1] High waitlist rate (>50%, 5+ entries): ${waitlistFlags.length} posts`);
  allFlagged.push(...waitlistFlags);

  // Check 2: All decisions identical
  const uniformFlags = await checkUniformDecisions(cycleFilter);
  console.log(`  [CHECK 2] All-same-decision (5+ entries): ${uniformFlags.length} posts`);
  allFlagged.push(...uniformFlags);

  // Check 3: Duplicate entries
  const dupFlags = await checkDuplicatePatterns(cycleFilter);
  console.log(`  [CHECK 3] Duplicate entries: ${dupFlags.length} posts`);
  allFlagged.push(...dupFlags);

  // Check 4: Early RD decisions (only for current cycle)
  const earlyRdFlags = await checkUnreleasedDecisions(cycleFilter);
  console.log(`  [CHECK 4] Early RD decisions (before March): ${earlyRdFlags.length} posts`);
  allFlagged.push(...earlyRdFlags);

  // Deduplicate flagged posts
  const uniquePostIds = [...new Set(allFlagged.map((f) => f.sourcePostId))];
  console.log(`\nUnique flagged posts from DB checks: ${uniquePostIds.length}`);

  if (uniquePostIds.length === 0) {
    console.log("\nNo issues found. Data looks clean.");
    await sql.end();
    return;
  }

  // Fetch post info from Arctic Shift (fast batch API, no rate limiting)
  console.log(`\nFetching post titles from Arctic Shift (${uniquePostIds.length} posts in batches of 100)...`);
  const postInfo = await fetchPostInfoFromArcticShift(uniquePostIds);
  console.log(`  Fetched info for ${postInfo.size} posts.`);

  // Also check ALL posts in scope for bad titles (chance-me etc.)
  // This catches posts that passed DB checks but have bad titles
  console.log(`\nChecking ALL post titles for bad patterns...`);
  const allPostIds = await sql`
    SELECT DISTINCT source_post_id
    FROM admission_submissions
    WHERE source_post_id IS NOT NULL
      ${cycleFilter ? sql`AND admission_cycle = ${cycleFilter}` : sql``}
  `;
  const allSourceIds = allPostIds.map((r) => r.source_post_id as string);

  // Fetch ALL titles (Arctic Shift handles large batches fine)
  const allPostInfo = await fetchPostInfoFromArcticShift(allSourceIds);
  console.log(`  Fetched info for ${allPostInfo.size} total posts.`);

  // Find bad-title posts not already flagged
  const badTitlePostIds: string[] = [];
  for (const [postId, info] of allPostInfo) {
    if (isBadTitle(info.title) && !uniquePostIds.includes(postId)) {
      badTitlePostIds.push(postId);

      // Get entry count for this post
      const [countRow] = await sql`
        SELECT count(*)::int as total FROM admission_submissions
        WHERE source_post_id = ${postId}
          ${cycleFilter ? sql`AND admission_cycle = ${cycleFilter}` : sql``}
      `;

      allFlagged.push({
        sourcePostId: postId,
        reason: "BAD_TITLE",
        entryCount: countRow.total,
        details: `Title matches chance-me/prediction pattern`,
        title: info.title,
      });
    }
  }
  if (badTitlePostIds.length > 0) {
    console.log(`  [CHECK 5] Bad title patterns (not already flagged): ${badTitlePostIds.length} posts`);
  }

  // Re-deduplicate
  const allUniquePostIds = [...new Set(allFlagged.map((f) => f.sourcePostId))];

  // Enrich flagged posts with title info
  interface EnrichedFlag extends FlaggedPost {
    title: string;
    deleted: boolean;
    titleIsBad: boolean;
    cycleMismatch: boolean;
    severity: "DELETE" | "LIKELY_BAD" | "REVIEW";
  }

  const enrichedFlags: EnrichedFlag[] = [];

  for (const postId of allUniquePostIds) {
    const info = allPostInfo.get(postId) || postInfo.get(postId);
    const flags = allFlagged.filter((f) => f.sourcePostId === postId);
    const reasons = [...new Set(flags.map((f) => f.reason))];
    const totalEntries = Math.max(...flags.map((f) => f.entryCount));

    const titleIsBad = info ? isBadTitle(info.title) : false;

    // Check cycle mismatch
    let cycleMismatch = false;
    if (info && info.createdUtc > 0) {
      const expectedCycle = expectedCycleFromDate(info.createdUtc);
      // Get the cycle this post's entries are assigned to
      const [cycleRow] = await sql`
        SELECT DISTINCT admission_cycle
        FROM admission_submissions
        WHERE source_post_id = ${postId}
        LIMIT 1
      `;
      if (cycleRow && cycleRow.admission_cycle !== expectedCycle) {
        cycleMismatch = true;
      }
    }

    // Determine severity
    const flagCount = reasons.length;
    const hasWaitlistFlag = reasons.includes("HIGH_WAITLIST_RATE") || reasons.includes("ALL_SAME_DECISION");
    const hasEarlyRdFlag = reasons.includes("EARLY_RD_DECISIONS");

    let severity: EnrichedFlag["severity"];
    if ((titleIsBad && hasWaitlistFlag) || (info?.deleted && titleIsBad)) {
      severity = "DELETE";
    } else if (titleIsBad || hasWaitlistFlag || hasEarlyRdFlag || (info?.deleted && flagCount >= 2)) {
      severity = "LIKELY_BAD";
    } else {
      severity = "REVIEW";
    }

    enrichedFlags.push({
      sourcePostId: postId,
      reason: reasons.join(" + "),
      entryCount: totalEntries,
      details: flags.map((f) => f.details).join("; "),
      title: info?.title || "[unknown]",
      deleted: info?.deleted || false,
      titleIsBad,
      cycleMismatch,
      severity,
    });
  }

  // Sort by severity
  const severityOrder = { DELETE: 0, LIKELY_BAD: 1, REVIEW: 2 };
  enrichedFlags.sort((a, b) => {
    const orderDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (orderDiff !== 0) return orderDiff;
    return b.entryCount - a.entryCount;
  });

  // Print results grouped by severity
  console.log(`\n${"=".repeat(100)}`);
  console.log("FLAGGED POSTS");
  console.log("=".repeat(100));

  let totalFlaggedEntries = 0;
  const deleteList: string[] = [];
  const likelyBadList: string[] = [];

  for (const severity of ["DELETE", "LIKELY_BAD", "REVIEW"] as const) {
    const group = enrichedFlags.filter((f) => f.severity === severity);
    if (group.length === 0) continue;

    const groupEntries = group.reduce((sum, f) => sum + f.entryCount, 0);
    console.log(`\n--- ${severity} (${group.length} posts, ${groupEntries} entries) ---`);

    for (const flag of group) {
      console.log(`\n  [${flag.severity}] Post: ${flag.sourcePostId} (${flag.entryCount} entries)`);
      console.log(`    Title: ${flag.title}`);
      console.log(`    Flags: ${flag.reason}`);
      console.log(`    Details: ${flag.details}`);
      if (flag.deleted || flag.cycleMismatch) {
        console.log(`    Deleted: ${flag.deleted} | Cycle mismatch: ${flag.cycleMismatch}`);
      }

      totalFlaggedEntries += flag.entryCount;

      if (severity === "DELETE") deleteList.push(flag.sourcePostId);
      if (severity === "LIKELY_BAD") likelyBadList.push(flag.sourcePostId);
    }
  }

  // Summary
  console.log(`\n${"=".repeat(100)}`);
  console.log("SUMMARY");
  console.log(`  Total entries in scope: ${totalCount.total}`);
  console.log(`  Total flagged posts: ${enrichedFlags.length}`);
  console.log(`  Total flagged entries: ${totalFlaggedEntries}`);
  console.log(`  DELETE (auto-removable): ${deleteList.length} posts`);
  console.log(`  LIKELY_BAD (manual review): ${likelyBadList.length} posts`);
  console.log(`  REVIEW (informational): ${enrichedFlags.length - deleteList.length - likelyBadList.length} posts`);
  console.log("=".repeat(100));

  // Fix mode
  if ((shouldFix || isDryRun) && deleteList.length > 0) {
    if (isDryRun) {
      const wouldDelete = await sql`
        SELECT count(*)::int as total FROM admission_submissions
        WHERE source_post_id IN ${sql(deleteList)}
      `;
      console.log(`\n[DRY RUN] Would delete ${wouldDelete[0].total} entries from ${deleteList.length} posts.`);
      console.log(`Post IDs: ${deleteList.join(", ")}`);
    } else {
      console.log(`\nDeleting entries from ${deleteList.length} DELETE-severity posts...`);
      const deleted = await sql`
        DELETE FROM admission_submissions
        WHERE source_post_id IN ${sql(deleteList)}
        RETURNING id
      `;
      console.log(`Deleted ${deleted.length} entries.`);
    }
  } else if (deleteList.length > 0) {
    console.log(`\nRun with --fix to delete ${deleteList.length} DELETE-severity posts.`);
    console.log(`Run with --dry-run to preview what would be deleted.`);
  }

  if (likelyBadList.length > 0) {
    console.log(`\nLIKELY_BAD posts need manual review. Post IDs:`);
    console.log(`  ${likelyBadList.join(", ")}`);
  }

  await sql.end();
}

main().catch(console.error);
