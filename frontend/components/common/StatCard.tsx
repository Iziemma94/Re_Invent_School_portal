interface StatCardProps {
  title: string;
  value: string | number;
  accentClass?: string;
}

export default function StatCard({
  title,
  value,
  accentClass = "bg-blue-600",
}: StatCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className={`mb-4 h-2 w-16 rounded-full ${accentClass}`} />
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <h3 className="mt-2 text-3xl font-bold text-slate-900">{value}</h3>
    </div>
  );
}