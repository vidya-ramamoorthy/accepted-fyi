export default function SubmitLoading() {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="h-8 w-72 animate-pulse rounded bg-slate-800" />
      <div className="mt-2 h-4 w-96 animate-pulse rounded bg-slate-800" />
      <div className="mt-8 space-y-6">
        <div className="rounded-xl border border-white/5 bg-slate-900/50 p-6">
          <div className="h-5 w-40 animate-pulse rounded bg-slate-800" />
          <div className="mt-4 h-10 w-full animate-pulse rounded bg-slate-800" />
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="h-10 animate-pulse rounded bg-slate-800" />
            <div className="h-10 animate-pulse rounded bg-slate-800" />
          </div>
        </div>
        <div className="rounded-xl border border-white/5 bg-slate-900/50 p-6">
          <div className="h-5 w-32 animate-pulse rounded bg-slate-800" />
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="h-10 animate-pulse rounded bg-slate-800" />
            <div className="h-10 animate-pulse rounded bg-slate-800" />
          </div>
        </div>
      </div>
    </div>
  );
}
