import FlagButton from "./FlagButton";
import ExpandableExtracurriculars from "./ExpandableExtracurriculars";

const DECISION_STYLES: Record<string, { background: string; text: string; label: string }> = {
  accepted: { background: "bg-emerald-500/10", text: "text-emerald-400", label: "Accepted" },
  rejected: { background: "bg-red-500/10", text: "text-red-400", label: "Rejected" },
  waitlisted: { background: "bg-amber-500/10", text: "text-amber-400", label: "Waitlisted" },
  deferred: { background: "bg-blue-500/10", text: "text-blue-400", label: "Deferred" },
};

const VERIFICATION_LABELS: Record<string, { label: string; color: string }> = {
  bronze: { label: "Self-Reported", color: "text-amber-500" },
  silver: { label: ".edu Verified", color: "text-slate-400" },
  gold: { label: "Doc Verified", color: "text-yellow-400" },
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

const DATA_SOURCE_STYLES: Record<string, { label: string; color: string }> = {
  user: { label: "User Submitted", color: "text-violet-400" },
  reddit: { label: "Reddit", color: "text-orange-400" },
  college_confidential: { label: "College Confidential", color: "text-blue-400" },
  public_scraped: { label: "Public Data", color: "text-slate-500" },
};

interface SubmissionCardProps {
  id: string;
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
  stateOfResidence: string | null;
  verificationTier: string;
  dataSource?: string;
  extracurriculars: string[];
  createdAt: Date | string;
  highSchoolType: string | null;
  firstGeneration: boolean | null;
  legacyStatus: boolean | null;
  geographicClassification: string | null;
  apCoursesCount: number | null;
  ibCoursesCount: number | null;
  honorsCoursesCount: number | null;
  scholarshipOffered: string | null;
  willAttend: string | null;
  waitlistOutcome: string | null;
  showFlagButton?: boolean;
}

export default function SubmissionCard({
  id,
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
  dataSource = "user",
  extracurriculars,
  highSchoolType,
  firstGeneration,
  legacyStatus,
  geographicClassification,
  apCoursesCount,
  ibCoursesCount,
  honorsCoursesCount,
  scholarshipOffered,
  willAttend,
  waitlistOutcome,
  showFlagButton,
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
  if (ibCoursesCount !== null && ibCoursesCount > 0) {
    contextTags.push(`${ibCoursesCount} IBs`);
  }
  if (honorsCoursesCount !== null && honorsCoursesCount > 0) {
    contextTags.push(`${honorsCoursesCount} Honors`);
  }

  return (
    <div className="rounded-xl border border-white/5 bg-slate-900/50 p-6 transition-shadow hover:shadow-lg hover:shadow-violet-500/5">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">{schoolName}</h3>
          <p className="mt-1 text-sm text-slate-500">
            {schoolState} &middot; {admissionCycle} &middot; {ROUND_LABELS[applicationRound] ?? applicationRound}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span
            className={`inline-flex rounded-full px-4 py-1.5 text-sm font-medium ${decisionStyle.background} ${decisionStyle.text}`}
          >
            {decisionStyle.label}
          </span>
          {waitlistOutcome && WAITLIST_LABELS[waitlistOutcome] && (
            <span className="inline-flex rounded-full bg-purple-500/10 px-3 py-1 text-xs font-medium text-purple-400">
              {WAITLIST_LABELS[waitlistOutcome]}
            </span>
          )}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
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
        <p className="mt-4 text-sm text-slate-400">
          <span className="font-medium text-slate-300">Major:</span> {intendedMajor}
        </p>
      )}

      {contextTags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {contextTags.map((tag) => (
            <span
              key={tag}
              className="inline-flex rounded-full border border-violet-500/20 bg-violet-500/5 px-3 py-1 text-xs font-medium text-violet-300"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {scholarshipOffered && scholarshipOffered !== "none" && SCHOLARSHIP_LABELS[scholarshipOffered] && (
        <p className="mt-3 text-sm font-medium text-emerald-400">
          {SCHOLARSHIP_LABELS[scholarshipOffered]}
        </p>
      )}

      {willAttend && (
        <p className="mt-2 text-sm text-slate-500">
          Attending: {willAttend === "yes" ? "Yes" : willAttend === "no" ? "No" : "Undecided"}
        </p>
      )}

      {extracurriculars.length > 0 && (
        <ExpandableExtracurriculars extracurriculars={extracurriculars} />
      )}

      <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
        <div className="flex items-center gap-2">
          <span className={verification.color}>{verification.label}</span>
          {dataSource !== "user" && (
            <>
              <span>&middot;</span>
              <span className={DATA_SOURCE_STYLES[dataSource]?.color ?? "text-slate-500"}>
                via {DATA_SOURCE_STYLES[dataSource]?.label ?? dataSource}
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          {stateOfResidence && <span>From {stateOfResidence}</span>}
          {showFlagButton && (
            <FlagButton submissionId={id} />
          )}
        </div>
      </div>
    </div>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-base font-semibold text-white">{value}</p>
    </div>
  );
}
