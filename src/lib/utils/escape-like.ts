/**
 * Escapes special characters in a LIKE/ILIKE pattern to prevent
 * LIKE injection attacks. The characters %, _, and \ have special
 * meaning in SQL LIKE patterns and must be escaped when used as literals.
 */
export function escapeLikePattern(input: string): string {
  return input.replace(/[%_\\]/g, "\\$&");
}
