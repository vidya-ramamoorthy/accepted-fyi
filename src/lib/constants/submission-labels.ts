export const DECISION_STYLES: Record<string, { background: string; text: string; label: string }> = {
  accepted: { background: "bg-green-50", text: "text-green-700", label: "Accepted" },
  rejected: { background: "bg-red-50", text: "text-red-700", label: "Rejected" },
  waitlisted: { background: "bg-yellow-50", text: "text-yellow-700", label: "Waitlisted" },
  deferred: { background: "bg-blue-50", text: "text-blue-700", label: "Deferred" },
};

export const DECISION_COLORS: Record<string, { accent: string; badge: string; badgeText: string; label: string }> = {
  accepted: { accent: "#22c55e", badge: "#166534", badgeText: "#bbf7d0", label: "Accepted" },
  rejected: { accent: "#ef4444", badge: "#991b1b", badgeText: "#fecaca", label: "Rejected" },
  waitlisted: { accent: "#f59e0b", badge: "#92400e", badgeText: "#fef3c7", label: "Waitlisted" },
  deferred: { accent: "#3b82f6", badge: "#1e3a5f", badgeText: "#bfdbfe", label: "Deferred" },
};

export const VERIFICATION_LABELS: Record<string, { label: string; color: string }> = {
  bronze: { label: "Self-Reported", color: "text-amber-600" },
  silver: { label: ".edu Verified", color: "text-gray-500" },
  gold: { label: "Doc Verified", color: "text-yellow-500" },
};

export const ROUND_LABELS: Record<string, string> = {
  early_decision: "ED",
  early_action: "EA",
  regular: "RD",
  rolling: "Rolling",
};

export const SCHOLARSHIP_LABELS: Record<string, string> = {
  none: "No Scholarship",
  merit: "Merit Scholarship",
  need_based: "Need-Based Aid",
  both: "Merit & Need Aid",
};

export const WAITLIST_LABELS: Record<string, string> = {
  accepted_off_waitlist: "Accepted off WL",
  rejected_off_waitlist: "Rejected off WL",
  withdrew: "Withdrew from WL",
};

export const DATA_SOURCE_LABELS: Record<string, { label: string; color: string; description: string }> = {
  user: { label: "User Submitted", color: "text-violet-600", description: "Submitted directly by the applicant" },
  reddit: { label: "Reddit", color: "text-orange-500", description: "Parsed from r/collegeresults — unverified" },
  college_confidential: { label: "College Confidential", color: "text-blue-500", description: "Parsed from College Confidential forums — unverified" },
  public_scraped: { label: "Public Data", color: "text-gray-500", description: "Scraped from public sources — unverified" },
};
