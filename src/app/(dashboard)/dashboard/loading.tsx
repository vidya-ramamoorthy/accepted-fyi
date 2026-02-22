export default function DashboardLoading() {
  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-48 animate-pulse rounded bg-slate-800" />
          <div className="mt-2 h-4 w-36 animate-pulse rounded bg-slate-800" />
        </div>
        <div className="h-10 w-28 animate-pulse rounded-full bg-slate-800" />
      </div>

      <div className="mt-6 space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="rounded-xl border border-white/5 bg-slate-900/50 p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="h-5 w-48 animate-pulse rounded bg-slate-800" />
                <div className="mt-2 h-4 w-32 animate-pulse rounded bg-slate-800" />
              </div>
              <div className="h-7 w-20 animate-pulse rounded-full bg-slate-800" />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {Array.from({ length: 4 }).map((_, statIndex) => (
                <div key={statIndex}>
                  <div className="h-3 w-12 animate-pulse rounded bg-slate-800" />
                  <div className="mt-1 h-5 w-16 animate-pulse rounded bg-slate-800" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
