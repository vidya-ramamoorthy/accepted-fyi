import type { MetadataRoute } from "next";
import { getDb } from "@/lib/db";
import { schools } from "@/lib/db/schema";
import { US_STATES } from "@/lib/constants/us-states";
import { SAT_RANGES, ACT_RANGES, ACCEPTANCE_RATE_RANGES } from "@/lib/constants/score-ranges";
import {
  getStateSatCombinations,
  getStateAcceptanceRateCombinations,
} from "@/lib/db/queries/seo-combinations";

const BASE_URL = "https://accepted.fyi";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let schoolUrls: MetadataRoute.Sitemap = [];
  let stateSatUrls: MetadataRoute.Sitemap = [];
  let stateAcceptanceRateUrls: MetadataRoute.Sitemap = [];

  try {
    const db = getDb();
    const allSchools = await db
      .select({ slug: schools.slug, id: schools.id, updatedAt: schools.updatedAt })
      .from(schools);

    schoolUrls = allSchools.map((school) => ({
      url: `${BASE_URL}/schools/${school.slug ?? school.id}`,
      lastModified: school.updatedAt ?? new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

    // Multi-dimension SEO pages
    const [stateSatCombinations, stateArCombinations] = await Promise.all([
      getStateSatCombinations(),
      getStateAcceptanceRateCombinations(),
    ]);

    stateSatUrls = stateSatCombinations.map((combo) => ({
      url: `${BASE_URL}/colleges/state/${combo.stateSlug}/sat/${combo.rangeSlug}`,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));

    stateAcceptanceRateUrls = stateArCombinations.map((combo) => ({
      url: `${BASE_URL}/colleges/state/${combo.stateSlug}/acceptance-rate/${combo.rangeSlug}`,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));
  } catch {
    // If DB is unavailable, return static routes only
  }

  const stateUrls: MetadataRoute.Sitemap = US_STATES.map((state) => ({
    url: `${BASE_URL}/colleges/state/${state.slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const satUrls: MetadataRoute.Sitemap = SAT_RANGES.map((range) => ({
    url: `${BASE_URL}/colleges/sat/${range.slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  const actUrls: MetadataRoute.Sitemap = ACT_RANGES.map((range) => ({
    url: `${BASE_URL}/colleges/act/${range.slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  const acceptanceRateUrls: MetadataRoute.Sitemap = ACCEPTANCE_RATE_RANGES.map((range) => ({
    url: `${BASE_URL}/colleges/acceptance-rate/${range.slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/schools`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/colleges`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    ...stateUrls,
    ...satUrls,
    ...actUrls,
    ...acceptanceRateUrls,
    ...stateSatUrls,
    ...stateAcceptanceRateUrls,
    ...schoolUrls,
  ];
}
