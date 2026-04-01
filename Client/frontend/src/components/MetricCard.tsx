interface MetricCardProps {
  label: string
  value: string
  hint: string
}

export function MetricCard({ label, value, hint }: MetricCardProps) {
  return (
    <article className="rounded-[1.75rem] border border-slate-200/80 bg-white p-5 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.55)]">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
        {label}
      </p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
        {value}
      </p>
      <p className="mt-2 text-sm text-slate-500">{hint}</p>
    </article>
  )
}
