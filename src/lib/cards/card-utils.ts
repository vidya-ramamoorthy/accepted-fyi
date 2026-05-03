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

/** Valid field keys that can be hidden on a decision card */
export type HideableField = "gpa" | "sat" | "act" | "state";

const VALID_HIDEABLE_FIELDS = new Set<HideableField>(["gpa", "sat", "act", "state"]);

const FIELD_LABEL_MAP: Record<HideableField, string> = {
  gpa: "GPA",
  sat: "SAT",
  act: "ACT",
  state: "State",
};

/**
 * Parses the `hide` query parameter into a set of hidden field keys.
 * Input is a comma-separated string like "sat,act".
 * Invalid field names are silently ignored.
 */
export function parseHiddenFields(hideParam: string | null): Set<HideableField> {
  if (!hideParam) return new Set();

  const fields = hideParam.split(",").map((field) => field.trim().toLowerCase());
  const validFields = new Set<HideableField>();

  for (const field of fields) {
    if (VALID_HIDEABLE_FIELDS.has(field as HideableField)) {
      validFields.add(field as HideableField);
    }
  }

  return validFields;
}

/**
 * Filters card stat items by removing any whose label matches a hidden field.
 * Used to respect per-field toggles when rendering the card image.
 */
export function filterCardStatItems(
  items: CardStatItem[],
  hiddenFields: Set<HideableField>
): CardStatItem[] {
  if (hiddenFields.size === 0) return items;

  const hiddenLabels = new Set<string>();
  for (const field of hiddenFields) {
    hiddenLabels.add(FIELD_LABEL_MAP[field]);
  }

  return items.filter((item) => !hiddenLabels.has(item.label));
}
