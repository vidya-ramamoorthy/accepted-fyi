/**
 * Title & description generators for school detail pages, tuned for CTR.
 *
 * Goals (per Apr 2026 GSC analysis):
 *  - Lead with "[School] Acceptance Rate [year]" — the exact query shape
 *  - Put the actual percentage in the title when we have it (concrete answer
 *    beats Wikipedia's generic snippet)
 *  - Keep the title short enough that " | accepted.fyi" still fits in the ~60
 *    char SERP window for typical school names
 *  - Keep the description under Google's ~160 char limit and front-load the
 *    acceptance rate + real-student-count differentiator
 */

const DESCRIPTION_MAX_LENGTH = 160;

type AcceptanceRateInput = string | number | null | undefined;

export function formatAcceptanceRate(rate: AcceptanceRateInput): string | null {
  if (rate === null || rate === undefined) return null;
  const numeric = typeof rate === "number" ? rate : parseFloat(rate);
  if (!Number.isFinite(numeric)) return null;
  // Keep one decimal, strip trailing zeros: 4.00 → "4", 25.80 → "25.8"
  const oneDecimal = numeric.toFixed(1);
  return oneDecimal.replace(/\.0$/, "");
}

interface TitleInput {
  schoolName: string;
  acceptanceRate: AcceptanceRateInput;
  cycleYear: number;
}

export function buildSchoolPageTitle({
  schoolName,
  acceptanceRate,
  cycleYear,
}: TitleInput): string {
  const formattedRate = formatAcceptanceRate(acceptanceRate);
  if (formattedRate !== null) {
    return `${schoolName} Acceptance Rate ${cycleYear}: ${formattedRate}% — Real Admit Data`;
  }
  return `${schoolName} Acceptance Rate ${cycleYear} — Real Admit Data`;
}

interface DescriptionInput {
  schoolName: string;
  acceptanceRate: AcceptanceRateInput;
  submissionCount: number;
  city: string | null;
  state: string | null;
  cycleYear: number;
}

export function buildSchoolPageDescription({
  schoolName,
  acceptanceRate,
  submissionCount,
  cycleYear,
}: DescriptionInput): string {
  const formattedRate = formatAcceptanceRate(acceptanceRate);
  const ratePart = formattedRate !== null
    ? `${schoolName}'s ${formattedRate}% acceptance rate`
    : `${schoolName}'s acceptance rate`;
  const countPart = submissionCount > 0
    ? `See ${submissionCount} real admits — GPA, SAT, ACT, essays & ECs.`
    : `See real admits — GPA, SAT, ACT, essays & extracurriculars.`;
  const cyclePart = `${cycleYear} admissions cycle.`;
  const description = `${ratePart}. ${countPart} ${cyclePart}`;
  // Belt-and-suspenders: if a future edit overshoots, trim on a word boundary
  if (description.length <= DESCRIPTION_MAX_LENGTH) return description;
  return description.slice(0, DESCRIPTION_MAX_LENGTH).replace(/\s+\S*$/, "");
}
