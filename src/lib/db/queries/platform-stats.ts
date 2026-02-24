import { sql } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { getDb } from "@/lib/db";

export interface PlatformStats {
  totalUsers: number;
  usersWithSubmissions: number;
  usersLast7Days: number;
  userSubmissions: number;
  redditSubmissions: number;
  submissionsLast7Days: number;
}

async function fetchPlatformStats(): Promise<PlatformStats> {
  const db = getDb();

  const [userStats, submissionStats] = await Promise.all([
    db.execute(sql`
      SELECT
        count(*)::int AS "totalUsers",
        count(CASE WHEN has_submitted THEN 1 END)::int AS "usersWithSubmissions",
        count(CASE WHEN created_at >= now() - interval '7 days' THEN 1 END)::int AS "usersLast7Days"
      FROM user_profiles
    `),
    db.execute(sql`
      SELECT
        count(CASE WHEN data_source = 'user' THEN 1 END)::int AS "userSubmissions",
        count(CASE WHEN data_source = 'reddit' THEN 1 END)::int AS "redditSubmissions",
        count(CASE WHEN created_at >= now() - interval '7 days' AND data_source = 'user' THEN 1 END)::int AS "submissionsLast7Days"
      FROM admission_submissions
    `),
  ]);

  const users = userStats[0] as Record<string, number>;
  const submissions = submissionStats[0] as Record<string, number>;

  return {
    totalUsers: users.totalUsers ?? 0,
    usersWithSubmissions: users.usersWithSubmissions ?? 0,
    usersLast7Days: users.usersLast7Days ?? 0,
    userSubmissions: submissions.userSubmissions ?? 0,
    redditSubmissions: submissions.redditSubmissions ?? 0,
    submissionsLast7Days: submissions.submissionsLast7Days ?? 0,
  };
}

export const getPlatformStats = () =>
  unstable_cache(fetchPlatformStats, ["platform-stats"], {
    revalidate: 300,
    tags: ["platform-stats"],
  })();
