/**
 * Build-time query to compute which state + range combinations have enough
 * schools (>= 3) to warrant a dedicated SEO page.
 *
 * Uses a single cross-join approach to avoid N*M individual queries.
 */

import { sql, and, gte, lte, between, eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { getDb } from "@/lib/db";
import { schools } from "@/lib/db/schema";
import { US_STATES } from "@/lib/constants/us-states";
import { SAT_RANGES, ACCEPTANCE_RATE_RANGES } from "@/lib/constants/score-ranges";

const MINIMUM_SCHOOLS_PER_PAGE = 3;

export interface SeoCombination {
  stateSlug: string;
  stateAbbreviation: string;
  rangeSlug: string;
  schoolCount: number;
}

/**
 * Returns all state + SAT range combinations that have >= 3 matching schools.
 */
async function fetchStateSatCombinations(): Promise<SeoCombination[]> {
  const db = getDb();
  const validCombinations: SeoCombination[] = [];

  // For each SAT range, find which states have >= 3 schools
  for (const satRange of SAT_RANGES) {
    const stateCountResults = await db
      .select({
        state: schools.state,
        schoolCount: sql<number>`count(*)::int`,
      })
      .from(schools)
      .where(
        and(
          lte(schools.sat25thPercentile, satRange.max),
          gte(schools.sat75thPercentile, satRange.min)
        )
      )
      .groupBy(schools.state)
      .having(sql`count(*) >= ${MINIMUM_SCHOOLS_PER_PAGE}`);

    for (const row of stateCountResults) {
      const usState = US_STATES.find((s) => s.abbreviation === row.state);
      if (usState) {
        validCombinations.push({
          stateSlug: usState.slug,
          stateAbbreviation: row.state,
          rangeSlug: satRange.slug,
          schoolCount: row.schoolCount,
        });
      }
    }
  }

  return validCombinations;
}

export const getStateSatCombinations = () =>
  unstable_cache(
    fetchStateSatCombinations,
    ["seo-state-sat-combinations"],
    { revalidate: 86400, tags: ["seo-combinations"] } // 24h revalidate
  )();

/**
 * Returns all state + acceptance rate range combinations that have >= 3 matching schools.
 */
async function fetchStateAcceptanceRateCombinations(): Promise<SeoCombination[]> {
  const db = getDb();
  const validCombinations: SeoCombination[] = [];

  for (const arRange of ACCEPTANCE_RATE_RANGES) {
    const stateCountResults = await db
      .select({
        state: schools.state,
        schoolCount: sql<number>`count(*)::int`,
      })
      .from(schools)
      .where(
        between(schools.acceptanceRate, arRange.min.toString(), arRange.max.toString())
      )
      .groupBy(schools.state)
      .having(sql`count(*) >= ${MINIMUM_SCHOOLS_PER_PAGE}`);

    for (const row of stateCountResults) {
      const usState = US_STATES.find((s) => s.abbreviation === row.state);
      if (usState) {
        validCombinations.push({
          stateSlug: usState.slug,
          stateAbbreviation: row.state,
          rangeSlug: arRange.slug,
          schoolCount: row.schoolCount,
        });
      }
    }
  }

  return validCombinations;
}

export const getStateAcceptanceRateCombinations = () =>
  unstable_cache(
    fetchStateAcceptanceRateCombinations,
    ["seo-state-acceptance-rate-combinations"],
    { revalidate: 86400, tags: ["seo-combinations"] }
  )();
