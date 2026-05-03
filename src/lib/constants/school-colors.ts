/**
 * Brand colors for top ~100 US colleges/universities.
 * Used for accent gradients on decision cards.
 *
 * Colors sourced from official brand guidelines / primary school colors.
 * Only the primary brand color is stored — used for gradient accent bars
 * and subtle background tints on shareable cards.
 */

/** Map of school name (lowercase) → primary brand hex color */
export const SCHOOL_BRAND_COLORS: Record<string, string> = {
  // Ivy League
  "harvard university": "#A51C30",
  "yale university": "#00356B",
  "princeton university": "#E77500",
  "columbia university": "#B9D9EB",
  "university of pennsylvania": "#011F5B",
  "brown university": "#4E3629",
  "dartmouth college": "#00693E",
  "cornell university": "#B31B1B",

  // Top Privates
  "stanford university": "#8C1515",
  "massachusetts institute of technology": "#A31F34",
  "california institute of technology": "#FF6C0C",
  "duke university": "#003087",
  "northwestern university": "#4E2A84",
  "university of chicago": "#800000",
  "johns hopkins university": "#002D72",
  "rice university": "#00205B",
  "vanderbilt university": "#CFAE70",
  "washington university in st. louis": "#A51417",
  "emory university": "#012169",
  "georgetown university": "#041E42",
  "carnegie mellon university": "#C41230",
  "university of notre dame": "#0C2340",
  "tufts university": "#3E8EDE",
  "wake forest university": "#9E7E38",
  "new york university": "#57068C",
  "university of southern california": "#990000",
  "boston university": "#CC0000",
  "boston college": "#8B2131",
  "brandeis university": "#003478",
  "case western reserve university": "#0A304E",
  "lehigh university": "#502D0E",
  "northeastern university": "#D41B2C",
  "tulane university": "#006747",
  "villanova university": "#003366",
  "rensselaer polytechnic institute": "#D6001C",
  "worcester polytechnic institute": "#AC2B37",
  "george washington university": "#033C5A",
  "american university": "#C4122F",
  "university of rochester": "#FFD100",
  "santa clara university": "#862633",

  // Top Public Universities (UCs)
  "university of california, berkeley": "#003262",
  "university of california, los angeles": "#2774AE",
  "university of california, san diego": "#182B49",
  "university of california, davis": "#022851",
  "university of california, irvine": "#0064A4",
  "university of california, santa barbara": "#003660",
  "university of california, santa cruz": "#003C6C",
  "university of california, riverside": "#003DA5",
  "university of california, merced": "#002856",

  // Top Public Universities (non-UC)
  "university of michigan": "#00274C",
  "university of virginia": "#232D4B",
  "university of north carolina at chapel hill": "#4B9CD3",
  "georgia institute of technology": "#B3A369",
  "university of texas at austin": "#BF5700",
  "university of florida": "#0021A5",
  "university of wisconsin-madison": "#C5050C",
  "ohio state university": "#BB0000",
  "pennsylvania state university": "#041E42",
  "university of illinois urbana-champaign": "#E84A27",
  "university of washington": "#4B2E83",
  "university of maryland": "#E21833",
  "purdue university": "#CEB888",
  "texas a&m university": "#500000",
  "university of georgia": "#BA0C2F",
  "virginia tech": "#861F41",
  "rutgers university": "#CC0033",
  "university of minnesota": "#7A0019",
  "indiana university bloomington": "#990000",
  "university of colorado boulder": "#CFB87C",
  "university of pittsburgh": "#003594",
  "michigan state university": "#18453B",
  "iowa state university": "#C8102E",
  "university of iowa": "#FFCD00",
  "clemson university": "#F56600",
  "university of connecticut": "#000E2F",
  "university of massachusetts amherst": "#881C1C",
  "stony brook university": "#990000",
  "university at buffalo": "#005BBB",

  // Top LACs
  "williams college": "#500082",
  "amherst college": "#3F1F69",
  "pomona college": "#0057B8",
  "swarthmore college": "#822433",
  "wellesley college": "#002776",
  "bowdoin college": "#000000",
  "middlebury college": "#003F87",
  "claremont mckenna college": "#8B2131",
  "carleton college": "#004990",
  "davidson college": "#CC0000",
  "colby college": "#002878",
  "hamilton college": "#002F86",
  "haverford college": "#9E1B32",
  "grinnell college": "#DA291C",
  "barnard college": "#002FA7",
  "colgate university": "#821019",
  "bates college": "#8C1D40",
  "oberlin college": "#A6192E",
  "colorado college": "#000000",
  "smith college": "#002855",
  "vassar college": "#861F41",

  // Other notables
  "georgia state university": "#0039A6",
  "arizona state university": "#8C1D40",
  "university of oregon": "#154733",
  "florida state university": "#782F40",
  "university of miami": "#F47321",
};

/**
 * Curated palette of 12 visually distinct colors for hash fallback.
 * These are all dark/medium saturated hues that work well on dark backgrounds
 * (slate-900/950) and with white text overlays.
 */
const FALLBACK_PALETTE = [
  "#1E40AF", // blue-800
  "#9333EA", // purple-600
  "#0E7490", // cyan-700
  "#B45309", // amber-700
  "#BE123C", // rose-700
  "#15803D", // green-700
  "#4338CA", // indigo-700
  "#C2410C", // orange-700
  "#0F766E", // teal-700
  "#A21CAF", // fuchsia-700
  "#1D4ED8", // blue-700
  "#7E22CE", // purple-700
] as const;

/**
 * Simple deterministic string hash (djb2 algorithm).
 * Returns a non-negative integer.
 */
function djb2Hash(input: string): number {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 33) ^ input.charCodeAt(i);
  }
  return hash >>> 0; // Convert to unsigned 32-bit
}

/**
 * Returns the brand color for a school.
 * Looks up from the hardcoded map first, then falls back to a deterministic
 * hash-based color from a curated palette.
 */
export function getSchoolBrandColor(schoolName: string): string {
  const normalized = schoolName.toLowerCase().trim();
  const mappedColor = SCHOOL_BRAND_COLORS[normalized];
  if (mappedColor) return mappedColor;

  const index = djb2Hash(normalized) % FALLBACK_PALETTE.length;
  return FALLBACK_PALETTE[index];
}
