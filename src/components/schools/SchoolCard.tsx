import Link from "next/link";

interface SchoolCardProps {
  slug: string | null;
  id: string;
  name: string;
  city: string;
  state: string;
  acceptanceRate: string | null;
  satAverage: number | null;
  sat25thPercentile: number | null;
  sat75thPercentile: number | null;
  actMedian: number | null;
  undergradEnrollment: number | null;
}

export default function SchoolCard({
  slug,
  id,
  name,
  city,
  state,
  acceptanceRate,
  satAverage,
  sat25thPercentile,
  sat75thPercentile,
  actMedian,
  undergradEnrollment,
}: SchoolCardProps) {
  return (
    <Link
      href={`/schools/${slug ?? id}`}
      className="group rounded-2xl border border-white/5 bg-slate-900/50 p-6 transition-all hover:border-white/10 hover:bg-slate-900/80"
    >
      <h3 className="font-semibold text-white group-hover:text-violet-300 transition-colors">
        {name}
      </h3>
      <p className="mt-1 text-sm text-slate-500">
        {city}, {state}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {acceptanceRate && (
          <div>
            <p className="text-xs text-slate-500">Accept Rate</p>
            <p className="text-lg font-semibold text-emerald-400">{acceptanceRate}%</p>
          </div>
        )}
        {satAverage && (
          <div>
            <p className="text-xs text-slate-500">SAT Avg</p>
            <p className="font-semibold text-white">{satAverage}</p>
          </div>
        )}
        {!satAverage && sat25thPercentile && sat75thPercentile && (
          <div>
            <p className="text-xs text-slate-500">SAT Range</p>
            <p className="font-semibold text-white">{sat25thPercentile}-{sat75thPercentile}</p>
          </div>
        )}
        {actMedian && (
          <div>
            <p className="text-xs text-slate-500">ACT Median</p>
            <p className="font-semibold text-white">{actMedian}</p>
          </div>
        )}
        {undergradEnrollment && (
          <div>
            <p className="text-xs text-slate-500">Enrollment</p>
            <p className="font-semibold text-white">{undergradEnrollment.toLocaleString()}</p>
          </div>
        )}
      </div>

      <p className="mt-4 text-xs font-medium text-violet-400 opacity-0 transition-opacity group-hover:opacity-100">
        View details &rarr;
      </p>
    </Link>
  );
}
