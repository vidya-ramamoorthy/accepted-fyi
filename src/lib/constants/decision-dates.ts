/**
 * Known decision release dates for the 2025-2026 admissions cycle.
 *
 * Sources: Historical release patterns from r/ApplyingToCollege,
 * school admissions offices, and college counseling communities.
 *
 * Dates are approximate — schools sometimes shift by a few days.
 * `isConfirmed` is false for estimated dates, true for officially announced ones.
 */

export interface DecisionDateEntry {
  schoolName: string;
  round: "early_decision" | "early_action" | "regular" | "rolling";
  expectedDate: string; // ISO date string
  isConfirmed: boolean;
  notes?: string;
}

export const DECISION_DATES_2025_2026: DecisionDateEntry[] = [
  // Ivy League — Regular Decision (Ivy Day is typically late March)
  { schoolName: "Harvard University", round: "early_action", expectedDate: "2025-12-12", isConfirmed: false, notes: "Restrictive Early Action" },
  { schoolName: "Harvard University", round: "regular", expectedDate: "2026-03-27", isConfirmed: false },
  { schoolName: "Yale University", round: "early_action", expectedDate: "2025-12-13", isConfirmed: false, notes: "Restrictive Early Action" },
  { schoolName: "Yale University", round: "regular", expectedDate: "2026-03-27", isConfirmed: false },
  { schoolName: "Princeton University", round: "early_action", expectedDate: "2025-12-12", isConfirmed: false, notes: "Restrictive Early Action" },
  { schoolName: "Princeton University", round: "regular", expectedDate: "2026-03-27", isConfirmed: false },
  { schoolName: "Columbia University", round: "early_decision", expectedDate: "2025-12-13", isConfirmed: false },
  { schoolName: "Columbia University", round: "regular", expectedDate: "2026-03-27", isConfirmed: false },
  { schoolName: "University of Pennsylvania", round: "early_decision", expectedDate: "2025-12-13", isConfirmed: false },
  { schoolName: "University of Pennsylvania", round: "regular", expectedDate: "2026-03-27", isConfirmed: false },
  { schoolName: "Brown University", round: "early_decision", expectedDate: "2025-12-13", isConfirmed: false },
  { schoolName: "Brown University", round: "regular", expectedDate: "2026-03-27", isConfirmed: false },
  { schoolName: "Dartmouth College", round: "early_decision", expectedDate: "2025-12-12", isConfirmed: false },
  { schoolName: "Dartmouth College", round: "regular", expectedDate: "2026-03-27", isConfirmed: false },
  { schoolName: "Cornell University", round: "early_decision", expectedDate: "2025-12-12", isConfirmed: false },
  { schoolName: "Cornell University", round: "regular", expectedDate: "2026-03-27", isConfirmed: false },

  // Top Privates
  { schoolName: "Massachusetts Institute of Technology", round: "early_action", expectedDate: "2025-12-14", isConfirmed: false, notes: "Pi Day for RD" },
  { schoolName: "Massachusetts Institute of Technology", round: "regular", expectedDate: "2026-03-14", isConfirmed: false, notes: "Pi Day (3/14)" },
  { schoolName: "Stanford University", round: "early_action", expectedDate: "2025-12-13", isConfirmed: false, notes: "Restrictive Early Action" },
  { schoolName: "Stanford University", round: "regular", expectedDate: "2026-03-28", isConfirmed: false },
  { schoolName: "California Institute of Technology", round: "early_action", expectedDate: "2025-12-14", isConfirmed: false },
  { schoolName: "California Institute of Technology", round: "regular", expectedDate: "2026-03-08", isConfirmed: false },
  { schoolName: "Duke University", round: "early_decision", expectedDate: "2025-12-13", isConfirmed: false },
  { schoolName: "Duke University", round: "regular", expectedDate: "2026-03-27", isConfirmed: false },
  { schoolName: "Northwestern University", round: "early_decision", expectedDate: "2025-12-13", isConfirmed: false },
  { schoolName: "Northwestern University", round: "regular", expectedDate: "2026-03-20", isConfirmed: false },
  { schoolName: "University of Chicago", round: "early_action", expectedDate: "2025-12-19", isConfirmed: false },
  { schoolName: "University of Chicago", round: "early_decision", expectedDate: "2025-12-19", isConfirmed: false },
  { schoolName: "University of Chicago", round: "regular", expectedDate: "2026-03-20", isConfirmed: false },
  { schoolName: "Johns Hopkins University", round: "early_decision", expectedDate: "2025-12-13", isConfirmed: false },
  { schoolName: "Johns Hopkins University", round: "regular", expectedDate: "2026-03-20", isConfirmed: false },
  { schoolName: "Rice University", round: "early_decision", expectedDate: "2025-12-14", isConfirmed: false },
  { schoolName: "Rice University", round: "regular", expectedDate: "2026-03-20", isConfirmed: false },
  { schoolName: "Vanderbilt University", round: "early_decision", expectedDate: "2025-12-13", isConfirmed: false },
  { schoolName: "Vanderbilt University", round: "regular", expectedDate: "2026-03-20", isConfirmed: false },
  { schoolName: "Washington University in St Louis", round: "early_decision", expectedDate: "2025-12-13", isConfirmed: false },
  { schoolName: "Washington University in St Louis", round: "regular", expectedDate: "2026-03-20", isConfirmed: false },
  { schoolName: "Georgetown University", round: "early_action", expectedDate: "2025-12-14", isConfirmed: false },
  { schoolName: "Georgetown University", round: "regular", expectedDate: "2026-03-20", isConfirmed: false },
  { schoolName: "University of Notre Dame", round: "early_action", expectedDate: "2025-12-17", isConfirmed: false, notes: "Restrictive Early Action" },
  { schoolName: "University of Notre Dame", round: "regular", expectedDate: "2026-03-20", isConfirmed: false },
  { schoolName: "Emory University", round: "early_decision", expectedDate: "2025-12-15", isConfirmed: false },
  { schoolName: "Emory University", round: "regular", expectedDate: "2026-03-20", isConfirmed: false },
  { schoolName: "Carnegie Mellon University", round: "early_decision", expectedDate: "2025-12-14", isConfirmed: false },
  { schoolName: "Carnegie Mellon University", round: "regular", expectedDate: "2026-03-22", isConfirmed: false },

  // Top Public Universities
  { schoolName: "University of California-Berkeley", round: "regular", expectedDate: "2026-03-26", isConfirmed: false, notes: "UC system — no early round" },
  { schoolName: "University of California-Los Angeles", round: "regular", expectedDate: "2026-03-21", isConfirmed: false },
  { schoolName: "University of California-San Diego", round: "regular", expectedDate: "2026-03-15", isConfirmed: false },
  { schoolName: "University of California-Davis", round: "regular", expectedDate: "2026-03-10", isConfirmed: false },
  { schoolName: "University of California-Irvine", round: "regular", expectedDate: "2026-03-13", isConfirmed: false },
  { schoolName: "University of California-Santa Barbara", round: "regular", expectedDate: "2026-03-16", isConfirmed: false },
  { schoolName: "University of Michigan-Ann Arbor", round: "early_action", expectedDate: "2026-01-31", isConfirmed: false },
  { schoolName: "University of Michigan-Ann Arbor", round: "regular", expectedDate: "2026-03-28", isConfirmed: false },
  { schoolName: "University of Virginia-Main Campus", round: "early_action", expectedDate: "2026-01-31", isConfirmed: false },
  { schoolName: "University of Virginia-Main Campus", round: "regular", expectedDate: "2026-03-20", isConfirmed: false },
  { schoolName: "University of North Carolina at Chapel Hill", round: "early_action", expectedDate: "2026-01-31", isConfirmed: false },
  { schoolName: "University of North Carolina at Chapel Hill", round: "regular", expectedDate: "2026-03-20", isConfirmed: false },
  { schoolName: "Georgia Institute of Technology-Main Campus", round: "early_action", expectedDate: "2026-01-17", isConfirmed: false },
  { schoolName: "Georgia Institute of Technology-Main Campus", round: "regular", expectedDate: "2026-03-14", isConfirmed: false },
  { schoolName: "University of Texas at Austin", round: "regular", expectedDate: "2026-02-28", isConfirmed: false },
  { schoolName: "University of Illinois Urbana-Champaign", round: "early_action", expectedDate: "2026-01-31", isConfirmed: false },
  { schoolName: "University of Illinois Urbana-Champaign", round: "regular", expectedDate: "2026-03-01", isConfirmed: false },
  { schoolName: "University of Florida", round: "regular", expectedDate: "2026-02-14", isConfirmed: false },
  { schoolName: "University of Wisconsin-Madison", round: "early_action", expectedDate: "2026-01-31", isConfirmed: false },
  { schoolName: "University of Wisconsin-Madison", round: "regular", expectedDate: "2026-03-15", isConfirmed: false },
  { schoolName: "Purdue University-Main Campus", round: "early_action", expectedDate: "2026-01-15", isConfirmed: false },
  { schoolName: "Purdue University-Main Campus", round: "regular", expectedDate: "2026-03-01", isConfirmed: false },
];

const ROUND_LABELS: Record<string, string> = {
  early_decision: "Early Decision",
  early_action: "Early Action",
  regular: "Regular Decision",
  rolling: "Rolling",
};

export function getRoundLabel(round: string): string {
  return ROUND_LABELS[round] ?? round;
}
