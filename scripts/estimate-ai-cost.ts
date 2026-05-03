/**
 * Quick script to estimate AI parser cost by analyzing remaining unparsed posts.
 */
import * as fs from "fs";
import postgres from "postgres";

const envFile = fs.readFileSync(".env.production", "utf8");
for (const line of envFile.split("\n")) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) process.env[match[1].trim()] = match[2].trim();
}

const pgSql = postgres(process.env.DATABASE_URL!);

async function main() {
  // Get existing post IDs from DB
  const existing = await pgSql`SELECT DISTINCT source_post_id FROM admission_submissions WHERE source_post_id IS NOT NULL`;
  const existingIds = new Set(existing.map((r) => r.source_post_id));
  console.log("Posts already in DB:", existingIds.size);

  // Fetch all posts from Arctic Shift
  const allPosts: Array<{ id: string; selftext: string; title: string; created_utc: number }> = [];
  let currentAfter = Math.floor(new Date("2018-01-01").getTime() / 1000);

  while (true) {
    const url = `https://arctic-shift.photon-reddit.com/api/posts/search?subreddit=collegeresults&after=${currentAfter}&limit=100&sort=asc&sort_type=created_utc`;
    const res = await fetch(url);
    const data = await res.json();
    const posts = data.data ?? [];
    if (posts.length === 0) break;
    allPosts.push(...posts);
    currentAfter = posts[posts.length - 1].created_utc;
    if (allPosts.length % 2000 === 0) process.stderr.write(`${allPosts.length}...`);
    await new Promise((r) => setTimeout(r, 100));
  }
  console.log("Total posts fetched:", allPosts.length);

  // Filter to new posts only
  const newPosts = allPosts.filter((p) => !existingIds.has(p.id));
  console.log("Posts not yet in DB:", newPosts.length);

  // Categorize
  let deleted = 0;
  let tooShort = 0;
  let hasKeywords = 0;
  let noKeywords = 0;
  const decisionKeywords = /\b(accepted|rejected|waitlisted|deferred|admitted|denied|admission result|committed|got into|got in)\b/i;

  for (const p of newPosts) {
    const text = p.selftext ?? "";
    if (!text || text === "[deleted]" || text === "[removed]") {
      deleted++;
      continue;
    }
    if (text.length < 100) {
      tooShort++;
      continue;
    }
    if (decisionKeywords.test(text)) {
      hasKeywords++;
    } else {
      noKeywords++;
    }
  }

  console.log("\n--- Breakdown of remaining posts ---");
  console.log("Deleted/removed:", deleted);
  console.log("Too short (<100 chars):", tooShort);
  console.log("Has decision keywords (worth AI parsing):", hasKeywords);
  console.log("No decision keywords (discussion/meta):", noKeywords);
  console.log("\n--- Cost estimates ---");
  console.log(`Real-time Haiku ($0.01/post): $${(hasKeywords * 0.01).toFixed(2)}`);
  console.log(`Batch Haiku ($0.005/post): $${(hasKeywords * 0.005).toFixed(2)}`);
  console.log(`Pre-filtered real-time ($0.01/post, keywords only): $${(hasKeywords * 0.01).toFixed(2)}`);

  await pgSql.end();
}

main().catch(console.error);
