export interface ScoreRange {
  slug: string;
  label: string;
  min: number;
  max: number;
}

export const SAT_RANGES: ScoreRange[] = [
  { slug: "1500-1600", label: "1500-1600", min: 1500, max: 1600 },
  { slug: "1400-1500", label: "1400-1500", min: 1400, max: 1500 },
  { slug: "1300-1400", label: "1300-1400", min: 1300, max: 1400 },
  { slug: "1200-1300", label: "1200-1300", min: 1200, max: 1300 },
  { slug: "1100-1200", label: "1100-1200", min: 1100, max: 1200 },
  { slug: "1000-1100", label: "1000-1100", min: 1000, max: 1100 },
  { slug: "900-1000", label: "900-1000", min: 900, max: 1000 },
  { slug: "below-900", label: "Below 900", min: 400, max: 900 },
];

export const ACT_RANGES: ScoreRange[] = [
  { slug: "34-36", label: "34-36", min: 34, max: 36 },
  { slug: "30-33", label: "30-33", min: 30, max: 33 },
  { slug: "26-29", label: "26-29", min: 26, max: 29 },
  { slug: "22-25", label: "22-25", min: 22, max: 25 },
  { slug: "18-21", label: "18-21", min: 18, max: 21 },
  { slug: "below-18", label: "Below 18", min: 1, max: 18 },
];

export interface AcceptanceRateRange {
  slug: string;
  label: string;
  min: number;
  max: number;
}

export const ACCEPTANCE_RATE_RANGES: AcceptanceRateRange[] = [
  { slug: "under-10", label: "Under 10%", min: 0, max: 10 },
  { slug: "10-20", label: "10-20%", min: 10, max: 20 },
  { slug: "20-30", label: "20-30%", min: 20, max: 30 },
  { slug: "30-50", label: "30-50%", min: 30, max: 50 },
  { slug: "50-70", label: "50-70%", min: 50, max: 70 },
  { slug: "over-70", label: "Over 70%", min: 70, max: 100 },
];

export const SAT_RANGE_BY_SLUG = new Map(SAT_RANGES.map((r) => [r.slug, r]));
export const ACT_RANGE_BY_SLUG = new Map(ACT_RANGES.map((r) => [r.slug, r]));
export const ACCEPTANCE_RATE_BY_SLUG = new Map(ACCEPTANCE_RATE_RANGES.map((r) => [r.slug, r]));
