/**
 * Backfill slugs for all existing schools.
 *
 * Usage: npx tsx scripts/backfill-slugs.ts
 *
 * Collision resolution: if two schools produce the same slug,
 * the duplicate gets "-{state-lowercase}" appended.
 */
import "dotenv/config";
import { config } from "dotenv";
config({ path: ".env.local" });

import { getDb } from "../src/lib/db";
import { schools } from "../src/lib/db/schema";
import { slugify } from "../src/lib/utils/slugify";
import { eq } from "drizzle-orm";

async function backfillSlugs() {
  const db = getDb();

  const allSchools = await db
    .select({ id: schools.id, name: schools.name, state: schools.state })
    .from(schools);

  console.log(`Found ${allSchools.length} schools to process.`);

  const slugToSchoolId = new Map<string, string>();
  let updatedCount = 0;
  let collisionCount = 0;

  for (const school of allSchools) {
    let candidateSlug = slugify(school.name);

    if (slugToSchoolId.has(candidateSlug)) {
      candidateSlug = `${candidateSlug}-${school.state.toLowerCase()}`;
      collisionCount++;
    }

    // In the rare case the state-appended slug also collides, add a numeric suffix
    if (slugToSchoolId.has(candidateSlug)) {
      let counter = 2;
      while (slugToSchoolId.has(`${candidateSlug}-${counter}`)) {
        counter++;
      }
      candidateSlug = `${candidateSlug}-${counter}`;
    }

    slugToSchoolId.set(candidateSlug, school.id);

    await db
      .update(schools)
      .set({ slug: candidateSlug })
      .where(eq(schools.id, school.id));

    updatedCount++;
  }

  console.log(`Backfill complete: ${updatedCount} schools updated, ${collisionCount} collisions resolved.`);
}

backfillSlugs()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Backfill failed:", error);
    process.exit(1);
  });
