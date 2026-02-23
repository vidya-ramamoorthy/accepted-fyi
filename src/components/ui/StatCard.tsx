interface StatCardProps {
  label: string;
  value: string;
  valueColor?: string;
}

export default function StatCard({
  label,
  value,
  valueColor = "text-white",
}: StatCardProps) {
  return (
    <div className="rounded-2xl border border-white/5 bg-slate-900/50 p-5">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${valueColor}`}>{value}</p>
    </div>
  );
}
