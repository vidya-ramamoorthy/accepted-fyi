const DECISION_STYLES: Record<string, { background: string; text: string; label: string }> = {
  accepted: { background: "bg-green-50", text: "text-green-700", label: "Accepted" },
  rejected: { background: "bg-red-50", text: "text-red-700", label: "Rejected" },
  waitlisted: { background: "bg-yellow-50", text: "text-yellow-700", label: "Waitlisted" },
  deferred: { background: "bg-blue-50", text: "text-blue-700", label: "Deferred" },
};

const VERIFICATION_LABELS: Record<string, { label: string; color: string }> = {
  bronze: { label: "Self-Reported", color: "text-amber-600" },
  silver: { label: ".edu Verified", color: "text-gray-500" },
  gold: { label: "Doc Verified", color: "text-yellow-500" },
};

const ROUND_LABELS: Record<string, string> = {
  early_decision: "ED",
  early_action: "EA",
  regular: "RD",
  rolling: "Rolling",
};

const HIGH_SCHOOL_LABELS: Record<string, string> = {
  public: "Public HS",
  private: "Private HS",
  charter: "Charter",
  magnet: "Magnet",
  homeschool: "Homeschool",
  international: "International",
};

const SCHOLARSHIP_LABELS: Record<string, string> = {
  none: "No Scholarship",
  merit: "Merit Scholarship",
  need_based: "Need-Based Aid",
  both: "Merit & Need Aid",
};

const WAITLIST_LABELS: Record<string, string> = {
  accepted_off_waitlist: "Accepted off WL",
  rejected_off_waitlist: "Rejected off WL",
  withdrew: "Withdrew from WL",
};

interface SubmissionCardProps {
  schoolName: string;
  schoolState: string;
  decision: string;
  applicationRound: string;
  admissionCycle: string;
  gpaUnweighted: string | null;
  gpaWeighted: string | null;
  satScore: number | null;
  actScore: number | null;
  intendedMajor: string | null;
  stateOfResidence: string;
  verificationTier: string;
  extracurriculars: string[];
  createdAt: Date | string;
  highSchoolType: string | null;
  firstGeneration: boolean | null;
  legacyStatus: boolean | null;
  financialAidApplied: boolean | null;
  geographicClassification: string | null;
  apCoursesCount: number | null;
  scholarshipOffered: string | null;
  willAttend: string | null;
  waitlistOutcome: string | null;
}

export default function SubmissionCard({
  schoolName,
  schoolState,
  decision,
  applicationRound,
  admissionCycle,
  gpaUnweighted,
  gpaWeighted,
  satScore,
  actScore,
  intendedMajor,
  stateOfResidence,
  verificationTier,
  extracurriculars,
  highSchoolType,
  firstGeneration,
  legacyStatus,
  geographicClassification,
  apCoursesCount,
  scholarshipOffered,
  willAttend,
  waitlistOutcome,
}: SubmissionCardProps) {
  const decisionStyle = DECISION_STYLES[decision] ?? DECISION_STYLES.accepted;
  const verification = VERIFICATION_LABELS[verificationTier] ?? VERIFICATION_LABELS.bronze;

  const contextTags: string[] = [];
  if (highSchoolType && HIGH_SCHOOL_LABELS[highSchoolType]) {
    contextTags.push(HIGH_SCHOOL_LABELS[highSchoolType]);
  }
  if (geographicClassification) {
    contextTags.push(geographicClassification.charAt(0).toUpperCase() + geographicClassification.slice(1));
  }
  if (firstGeneration) contextTags.push("First-Gen");
  if (legacyStatus) contextTags.push("Legacy");
  if (apCoursesCount !== null && apCoursesCount > 0) {
    contextTags.push(`${apCoursesCount} APs`);
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">{schoolName}</h3>
          <p className="text-sm text-gray-500">
            {schoolState} &middot; {admissionCycle} &middot; {ROUND_LABELS[applicationRound] ?? applicationRound}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${decisionStyle.background} ${decisionStyle.text}`}
          >
            {decisionStyle.label}
          </span>
          {waitlistOutcome && WAITLIST_LABELS[waitlistOutcome] && (
            <span className="inline-flex rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-medium text-purple-700">
              {WAITLIST_LABELS[waitlistOutcome]}
            </span>
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {gpaUnweighted && (
          <StatItem label="GPA (UW)" value={gpaUnweighted} />
        )}
        {gpaWeighted && (
          <StatItem label="GPA (W)" value={gpaWeighted} />
        )}
        {satScore && (
          <StatItem label="SAT" value={satScore.toString()} />
        )}
        {actScore && (
          <StatItem label="ACT" value={actScore.toString()} />
        )}
      </div>

      {intendedMajor && (
        <p className="mt-3 text-sm text-gray-600">
          <span className="font-medium">Major:</span> {intendedMajor}
        </p>
      )}

      {contextTags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {contextTags.map((tag) => (
            <span
              key={tag}
              className="inline-flex rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {scholarshipOffered && scholarshipOffered !== "none" && SCHOLARSHIP_LABELS[scholarshipOffered] && (
        <p className="mt-2 text-xs font-medium text-emerald-600">
          {SCHOLARSHIP_LABELS[scholarshipOffered]}
        </p>
      )}

      {willAttend && (
        <p className="mt-1 text-xs text-gray-500">
          Attending: {willAttend === "yes" ? "Yes" : willAttend === "no" ? "No" : "Undecided"}
        </p>
      )}

      {extracurriculars.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {extracurriculars.slice(0, 5).map((ec) => (
            <span
              key={ec}
              className="inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600"
            >
              {ec}
            </span>
          ))}
          {extracurriculars.length > 5 && (
            <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-500">
              +{extracurriculars.length - 5} more
            </span>
          )}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
        <span className={verification.color}>{verification.label}</span>
        <span>From {stateOfResidence}</span>
      </div>
    </div>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-semibold text-gray-900">{value}</p>
    </div>
  );
}
