interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
}

export function StatCard({ title, value, subtitle }: StatCardProps) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-stone-500">{title}</p>
      <p className="mt-1 text-2xl font-bold text-stone-900">{value}</p>
      {subtitle && <p className="mt-1 text-xs text-stone-400">{subtitle}</p>}
    </div>
  );
}
