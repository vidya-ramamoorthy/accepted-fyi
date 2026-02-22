export default function SchoolDetailLoading() {
  return (
    <div className="min-h-screen bg-slate-950">
      <div className="mx-auto max-w-7xl px-6 pb-16 pt-28">
        <div className="h-4 w-24 animate-pulse rounded bg-slate-800" />
        <div className="mt-6">
          <div className="h-10 w-64 animate-pulse rounded bg-slate-800" />
          <div className="mt-2 h-4 w-48 animate-pulse rounded bg-slate-800" />
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="rounded-2xl border border-white/5 bg-slate-900/50 p-5">
              <div className="h-3 w-20 animate-pulse rounded bg-slate-800" />
              <div className="mt-2 h-8 w-16 animate-pulse rounded bg-slate-800" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
