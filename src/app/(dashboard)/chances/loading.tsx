export default function ChancesLoading() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse">
      <div className="h-8 w-64 rounded bg-slate-800" />
      <div className="mt-2 h-4 w-96 rounded bg-slate-800/50" />

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Form skeleton */}
        <div className="rounded-xl border border-white/5 bg-slate-900/50 p-6">
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i}>
                <div className="h-4 w-24 rounded bg-slate-800" />
                <div className="mt-2 h-10 rounded bg-slate-800/50" />
              </div>
            ))}
            <div className="h-10 rounded bg-slate-800" />
          </div>
        </div>

        {/* Results skeleton */}
        <div className="space-y-6 lg:col-span-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i}>
              <div className="h-6 w-32 rounded bg-slate-800" />
              <div className="mt-3 space-y-3">
                {Array.from({ length: 2 }).map((_, j) => (
                  <div key={j} className="h-24 rounded-lg bg-slate-900/50" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
