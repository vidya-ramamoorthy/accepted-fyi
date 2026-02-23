import { describe, it, expect } from "vitest";
import {
  buildCardStatItems,
  getDecisionCardColors,
  getCardRoundLabel,
} from "@/lib/cards/card-utils";

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
