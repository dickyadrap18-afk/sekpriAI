/**
 * Escape special characters for PostgREST ilike/like filters.
 * Prevents SQL injection via %, _, and backslash in user input.
 * Ref: audit-report.md SEC-04
 */
export function escapePostgrestLike(input: string): string {
  return input
    .replace(/\\/g, "\\\\") // escape backslash first
    .replace(/%/g, "\\%")   // escape percent
    .replace(/_/g, "\\_");  // escape underscore
}
