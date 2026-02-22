export default function SchoolsLoading() {
  return (
    <div className="min-h-screen bg-slate-950">
      <div className="mx-auto max-w-7xl px-6 pb-16 pt-28">
        <div className="h-9 w-32 animate-pulse rounded bg-slate-800" />
        <div className="mt-2 h-4 w-80 animate-pulse rounded bg-slate-800" />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, index) => (
            <div key={index} className="rounded-2xl border border-white/5 bg-slate-900/50 p-6">
              <div className="h-5 w-48 animate-pulse rounded bg-slate-800" />
              <div className="mt-2 h-4 w-32 animate-pulse rounded bg-slate-800" />
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <div className="h-3 w-16 animate-pulse rounded bg-slate-800" />
                  <div className="mt-1 h-6 w-10 animate-pulse rounded bg-slate-800" />
                </div>
                <div>
                  <div className="h-3 w-16 animate-pulse rounded bg-slate-800" />
                  <div className="mt-1 h-6 w-10 animate-pulse rounded bg-slate-800" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
