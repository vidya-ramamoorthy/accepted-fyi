import { DECISION_COLORS, ROUND_LABELS } from "@/lib/constants/submission-labels";

export interface CardStatItem {
  label: string;
  value: string;
}

interface CardStatInput {
  gpaUnweighted: string | null;
  satScore: number | null;
  actScore: number | null;
  stateOfResidence: string | null;
}

/**
 * Builds the stat items to display on a decision card.
 * Only includes non-null fields.
 */
export function buildCardStatItems(input: CardStatInput): CardStatItem[] {
  const items: CardStatItem[] = [];

  if (input.gpaUnweighted !== null) {
    items.push({ label: "GPA", value: input.gpaUnweighted });
  }
  if (input.satScore !== null) {
    items.push({ label: "SAT", value: String(input.satScore) });
  }
  if (input.actScore !== null) {
    items.push({ label: "ACT", value: String(input.actScore) });
  }
  if (input.stateOfResidence !== null) {
    items.push({ label: "State", value: input.stateOfResidence });
  }

  return items;
}

/**
 * Returns the color palette for a given admission decision.
 * Falls back to "accepted" colors for unknown decisions.
 */
export function getDecisionCardColors(decision: string) {
  return DECISION_COLORS[decision] ?? DECISION_COLORS.accepted;
}

/**
 * Returns the short label for an application round.
 * Falls back to the raw value for unknown rounds.
 */
export function getCardRoundLabel(applicationRound: string): string {
  return ROUND_LABELS[applicationRound] ?? applicationRound;
}
