import { getRoundLabel } from "@/lib/constants/decision-dates";

interface TimelineEntry {
  applicationRound: string;
  expectedDate: Date | null;
  actualDate: Date | null;
  isConfirmed: boolean;
  notes: string | null;
}

interface DecisionTimelineProps {
  schoolName: string;
  entries: TimelineEntry[];
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getTimelineStatus(entry: TimelineEntry): "past" | "upcoming" | "today" {
  const displayDate = entry.actualDate ?? entry.expectedDate;
  if (!displayDate) return "upcoming";

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const entryDay = new Date(displayDate.getFullYear(), displayDate.getMonth(), displayDate.getDate());

  if (entryDay.getTime() === today.getTime()) return "today";
  if (entryDay < today) return "past";
  return "upcoming";
}

function daysUntil(date: Date): number {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export default function DecisionTimeline({ schoolName, entries }: DecisionTimelineProps) {
  if (entries.length === 0) return null;

  return (
    <div className="rounded-2xl border border-white/5 bg-slate-900/50 p-6">
      <h2 className="font-semibold text-white">Decision Timeline</h2>
      <p className="mt-1 text-xs text-slate-500">
        When {schoolName} releases admissions decisions
      </p>

      <div className="mt-5 space-y-0">
        {entries.map((entry, index) => {
          const status = getTimelineStatus(entry);
          const displayDate = entry.actualDate ?? entry.expectedDate;
          const isLast = index === entries.length - 1;
          const remaining = displayDate && status === "upcoming" ? daysUntil(displayDate) : null;

          return (
            <div key={`${entry.applicationRound}-${index}`} className="relative flex gap-4">
              {/* Vertical line connector */}
              {!isLast && (
                <div className="absolute left-[11px] top-6 h-full w-px bg-slate-800" />
              )}

              {/* Status dot */}
              <div className="relative z-10 mt-1.5 shrink-0">
                {status === "today" ? (
                  <div className="h-[22px] w-[22px] rounded-full border-2 border-violet-500 bg-violet-500/20 p-1">
                    <div className="h-full w-full animate-pulse rounded-full bg-violet-400" />
                  </div>
                ) : status === "past" ? (
                  <div className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-emerald-500/20">
                    <svg className="h-3 w-3 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </div>
                ) : (
                  <div className="h-[22px] w-[22px] rounded-full border-2 border-slate-700 bg-slate-800" />
                )}
              </div>

              {/* Content */}
              <div className={`pb-6 ${isLast ? "pb-0" : ""}`}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-sm font-medium ${
                    status === "today" ? "text-violet-300" :
                    status === "past" ? "text-slate-400" :
                    "text-white"
                  }`}>
                    {getRoundLabel(entry.applicationRound)}
                  </span>
                  {status === "today" && (
                    <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-xs font-medium text-violet-300">
                      Today
                    </span>
                  )}
                  {!entry.isConfirmed && displayDate && (
                    <span className="text-xs text-slate-600">estimated</span>
                  )}
                </div>

                <div className="mt-0.5 flex flex-wrap items-center gap-2">
                  {displayDate ? (
                    <span className={`text-sm ${
                      status === "past" ? "text-slate-500" : "text-slate-300"
                    }`}>
                      {formatDate(displayDate)}
                    </span>
                  ) : (
                    <span className="text-sm text-slate-600">Date TBD</span>
                  )}

                  {remaining !== null && remaining > 0 && (
                    <span className="text-xs text-slate-500">
                      ({remaining} day{remaining !== 1 ? "s" : ""} away)
                    </span>
                  )}
                </div>

                {entry.notes && (
                  <p className="mt-0.5 text-xs text-slate-600">{entry.notes}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
