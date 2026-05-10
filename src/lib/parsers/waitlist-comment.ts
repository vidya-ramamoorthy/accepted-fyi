import type { WaitlistOutcome } from "@/types/database";

const ACCEPT_PATTERNS = [
  /\b(accepted|admitted|got\s+in|got\s+off|in\s+off)\b[^.!?\n]*?\b(off|from|the)\s+(?:the\s+)?(?:wl|waitlist|wait[\s-]?list)/i,
  /\b(off|out\s+of)\s+(?:the\s+)?(?:wl|waitlist|wait[\s-]?list)\b(?![^.!?\n]*\b(rejected|denied|withdr|pulled|removed)\b)/i,
  /\b(accepted|admitted)\s+(?:off|from)\s+(?:the\s+)?(?:wl|waitlist)\b/i,
];

const REJECT_PATTERNS = [
  /\b(rejected|denied|deny|rejection)\b[^.!?\n]*?\b(off|from|the)?\s*(?:the\s+)?(?:wl|waitlist|wait[\s-]?list)/i,
  /\b(?:wl|waitlist|wait[\s-]?list)\b[^.!?\n]*?\b(rejected|denied|deny|rejection)\b/i,
];

const WITHDRAW_PATTERNS = [
  /\b(withdrew|withdrawn|withdrawing|pulled\s+myself|removed\s+myself|took\s+myself)\b[^.!?\n]*?\b(?:from|off)\s*(?:the\s+)?(?:[\w'’]+)?\s*(?:wl|waitlist|wait[\s-]?list)/i,
  /\bwithdrew\b[^.!?\n]*?\b(?:wl|waitlist|wait[\s-]?list)/i,
];

const SCHOOL_HINT_PATTERN =
  /\b(?:at|from|of)\s+([A-Z][\w&'.-]*(?:[\s-][A-Z][\w&'.-]*){0,4})/;

const SCHOOL_DASH_PATTERN = /^\s*([A-Z][\w&'.\s-]{1,40}?)\s*[-–—:]\s/;

const SCHOOL_NAME_FIRST_PATTERN =
  /^\s*([A-Z][\w&'.\s-]{1,40}?)\s+(?:wl|waitlist|wait[\s-]?list|accepted|admitted|rejected|denied|withdrew|got\s+in|got\s+off)/i;

const STOPWORDS = new Set([
  "I",
  "Just",
  "Anyone",
  "Still",
  "Got",
  "Accepted",
  "Rejected",
  "Denied",
  "Withdrew",
  "Off",
  "Out",
  "The",
  "Today",
  "Yesterday",
  "Finally",
  "Yes",
  "No",
  "Yeah",
]);

function detectOutcome(text: string): WaitlistOutcome | null {
  if (WITHDRAW_PATTERNS.some((pattern) => pattern.test(text))) {
    return "withdrew";
  }
  if (REJECT_PATTERNS.some((pattern) => pattern.test(text))) {
    return "rejected_off_waitlist";
  }
  if (ACCEPT_PATTERNS.some((pattern) => pattern.test(text))) {
    return "accepted_off_waitlist";
  }
  return null;
}

function extractSchoolName(text: string): string | null {
  const dashMatch = text.match(SCHOOL_DASH_PATTERN);
  if (dashMatch) {
    const candidate = dashMatch[1].trim();
    if (!STOPWORDS.has(candidate.split(/\s+/)[0])) {
      return candidate;
    }
  }

  const nameFirstMatch = text.match(SCHOOL_NAME_FIRST_PATTERN);
  if (nameFirstMatch) {
    const candidate = nameFirstMatch[1].trim();
    if (!STOPWORDS.has(candidate.split(/\s+/)[0])) {
      return candidate;
    }
  }

  const hintMatch = text.match(SCHOOL_HINT_PATTERN);
  if (hintMatch) {
    return hintMatch[1].trim().replace(/[.,!?;:]+$/, "");
  }

  return null;
}

export interface ParsedWaitlistComment {
  schoolName: string;
  outcome: WaitlistOutcome;
}

export function parseWaitlistComment(rawText: string): ParsedWaitlistComment | null {
  const text = rawText?.trim();
  if (!text || text === "[deleted]" || text === "[removed]") {
    return null;
  }

  const outcome = detectOutcome(text);
  if (!outcome) return null;

  const schoolName = extractSchoolName(text);
  if (!schoolName || schoolName.length < 2) return null;

  return { schoolName, outcome };
}
