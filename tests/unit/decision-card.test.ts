import { describe, it, expect } from "vitest";
import {
  buildCardStatItems,
  getDecisionCardColors,
  getCardRoundLabel,
  parseHiddenFields,
  filterCardStatItems,
} from "@/lib/cards/card-utils";
import type { CardStatItem, HideableField } from "@/lib/cards/card-utils";

// ─── buildCardStatItems ──────────────────────────────────────────────────────

describe("buildCardStatItems", () => {
  it("includes all present stats", () => {
    const items = buildCardStatItems({
      gpaUnweighted: "3.92",
      satScore: 1520,
      actScore: 34,
      stateOfResidence: "CA",
    });

    expect(items).toEqual([
      { label: "GPA", value: "3.92" },
      { label: "SAT", value: "1520" },
      { label: "ACT", value: "34" },
      { label: "State", value: "CA" },
    ]);
  });

  it("omits null GPA", () => {
    const items = buildCardStatItems({
      gpaUnweighted: null,
      satScore: 1400,
      actScore: null,
      stateOfResidence: "NY",
    });

    expect(items).toEqual([
      { label: "SAT", value: "1400" },
      { label: "State", value: "NY" },
    ]);
  });

  it("omits null SAT and ACT", () => {
    const items = buildCardStatItems({
      gpaUnweighted: "3.50",
      satScore: null,
      actScore: null,
      stateOfResidence: "TX",
    });

    expect(items).toEqual([
      { label: "GPA", value: "3.50" },
      { label: "State", value: "TX" },
    ]);
  });

  it("returns empty array when all fields are null", () => {
    const items = buildCardStatItems({
      gpaUnweighted: null,
      satScore: null,
      actScore: null,
      stateOfResidence: null,
    });

    expect(items).toEqual([]);
  });

  it("omits null state", () => {
    const items = buildCardStatItems({
      gpaUnweighted: "4.00",
      satScore: 1600,
      actScore: 36,
      stateOfResidence: null,
    });

    expect(items).toEqual([
      { label: "GPA", value: "4.00" },
      { label: "SAT", value: "1600" },
      { label: "ACT", value: "36" },
    ]);
  });
});

// ─── getDecisionCardColors ───────────────────────────────────────────────────

describe("getDecisionCardColors", () => {
  it("returns correct colors for accepted", () => {
    const colors = getDecisionCardColors("accepted");
    expect(colors.accent).toBe("#22c55e");
    expect(colors.badge).toBe("#166534");
    expect(colors.badgeText).toBe("#bbf7d0");
    expect(colors.label).toBe("Accepted");
  });

  it("returns correct colors for rejected", () => {
    const colors = getDecisionCardColors("rejected");
    expect(colors.accent).toBe("#ef4444");
    expect(colors.label).toBe("Rejected");
  });

  it("returns correct colors for waitlisted", () => {
    const colors = getDecisionCardColors("waitlisted");
    expect(colors.accent).toBe("#f59e0b");
    expect(colors.label).toBe("Waitlisted");
  });

  it("returns correct colors for deferred", () => {
    const colors = getDecisionCardColors("deferred");
    expect(colors.accent).toBe("#3b82f6");
    expect(colors.label).toBe("Deferred");
  });

  it("falls back to accepted colors for unknown decision", () => {
    const colors = getDecisionCardColors("unknown_decision");
    expect(colors).toEqual(getDecisionCardColors("accepted"));
  });
});

// ─── getCardRoundLabel ───────────────────────────────────────────────────────

describe("getCardRoundLabel", () => {
  it("maps early_decision to ED", () => {
    expect(getCardRoundLabel("early_decision")).toBe("ED");
  });

  it("maps early_action to EA", () => {
    expect(getCardRoundLabel("early_action")).toBe("EA");
  });

  it("maps regular to RD", () => {
    expect(getCardRoundLabel("regular")).toBe("RD");
  });

  it("maps rolling to Rolling", () => {
    expect(getCardRoundLabel("rolling")).toBe("Rolling");
  });

  it("returns raw value for unknown rounds", () => {
    expect(getCardRoundLabel("some_custom_round")).toBe("some_custom_round");
  });
});

// ─── parseHiddenFields ───────────────────────────────────────────────────────

describe("parseHiddenFields", () => {
  it("returns empty set for null input", () => {
    const result = parseHiddenFields(null);
    expect(result.size).toBe(0);
  });

  it("returns empty set for empty string", () => {
    const result = parseHiddenFields("");
    expect(result.size).toBe(0);
  });

  it("parses a single valid field", () => {
    const result = parseHiddenFields("sat");
    expect(result.has("sat")).toBe(true);
    expect(result.size).toBe(1);
  });

  it("parses multiple valid fields", () => {
    const result = parseHiddenFields("sat,act,gpa");
    expect(result.has("sat")).toBe(true);
    expect(result.has("act")).toBe(true);
    expect(result.has("gpa")).toBe(true);
    expect(result.size).toBe(3);
  });

  it("ignores invalid field names", () => {
    const result = parseHiddenFields("sat,invalid,act");
    expect(result.has("sat")).toBe(true);
    expect(result.has("act")).toBe(true);
    expect(result.size).toBe(2);
  });

  it("handles whitespace around field names", () => {
    const result = parseHiddenFields(" sat , act ");
    expect(result.has("sat")).toBe(true);
    expect(result.has("act")).toBe(true);
  });

  it("is case-insensitive", () => {
    const result = parseHiddenFields("SAT,Act,GPA");
    expect(result.has("sat")).toBe(true);
    expect(result.has("act")).toBe(true);
    expect(result.has("gpa")).toBe(true);
  });

  it("parses state field", () => {
    const result = parseHiddenFields("state");
    expect(result.has("state")).toBe(true);
  });

  it("deduplicates repeated fields", () => {
    const result = parseHiddenFields("sat,sat,sat");
    expect(result.size).toBe(1);
  });
});

// ─── filterCardStatItems ────────────────────────────────────────────────────

describe("filterCardStatItems", () => {
  const allItems: CardStatItem[] = [
    { label: "GPA", value: "3.92" },
    { label: "SAT", value: "1520" },
    { label: "ACT", value: "34" },
    { label: "State", value: "CA" },
  ];

  it("returns all items when no fields are hidden", () => {
    const result = filterCardStatItems(allItems, new Set());
    expect(result).toEqual(allItems);
  });

  it("hides SAT when sat is in hidden set", () => {
    const hidden = new Set<HideableField>(["sat"]);
    const result = filterCardStatItems(allItems, hidden);
    expect(result).toEqual([
      { label: "GPA", value: "3.92" },
      { label: "ACT", value: "34" },
      { label: "State", value: "CA" },
    ]);
  });

  it("hides multiple fields", () => {
    const hidden = new Set<HideableField>(["sat", "act"]);
    const result = filterCardStatItems(allItems, hidden);
    expect(result).toEqual([
      { label: "GPA", value: "3.92" },
      { label: "State", value: "CA" },
    ]);
  });

  it("hides all fields", () => {
    const hidden = new Set<HideableField>(["gpa", "sat", "act", "state"]);
    const result = filterCardStatItems(allItems, hidden);
    expect(result).toEqual([]);
  });

  it("handles empty items array", () => {
    const hidden = new Set<HideableField>(["sat"]);
    const result = filterCardStatItems([], hidden);
    expect(result).toEqual([]);
  });
});
