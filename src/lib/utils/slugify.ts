/**
 * Converts a school name into a URL-friendly slug.
 *
 * Examples:
 *   "Harvard University" -> "harvard-university"
 *   "University of California-Berkeley" -> "university-of-california-berkeley"
 *   "MIT" -> "mit"
 *   "St. John's University" -> "st-johns-university"
 */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/['']/g, "") // remove apostrophes (St. John's -> St. Johns)
    .replace(/&/g, "and") // ampersand -> "and"
    .replace(/[^a-z0-9\s-]/g, "") // strip non-alphanumeric except spaces/hyphens
    .replace(/[\s-]+/g, "-") // collapse whitespace and hyphens into single hyphen
    .replace(/^-+|-+$/g, ""); // trim leading/trailing hyphens
}
