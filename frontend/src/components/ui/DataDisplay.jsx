import { cn } from '../../lib/utils'

export function StatCard({ label, value, hint, icon: Icon, tone = 'brand', trend, className }) {
  const tones = {
    brand: 'bg-brand-50 text-brand-600',
    green: 'bg-emerald-50 text-emerald-600',
    red: 'bg-rose-50 text-rose-600',
    amber: 'bg-amber-50 text-amber-600',
    violet: 'bg-violet-50 text-violet-600',
    slate: 'bg-slate-100 text-slate-600',
  }

  return (
    <div className={cn('card p-5', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold tabular text-slate-900">{value}</p>
          {hint && <p className="mt-1 truncate text-xs text-slate-500">{hint}</p>}
        </div>
        {Icon && (
          <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', tones[tone] ?? tones.brand)}>
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
        )}
      </div>

      {trend !== undefined && trend !== null && (
        <p
          className={cn(
            'mt-3 text-xs font-semibold',
            trend > 0 ? 'text-emerald-600' : trend < 0 ? 'text-rose-600' : 'text-slate-500',
          )}
        >
          {trend > 0 ? '▲' : trend < 0 ? '▼' : '—'} {Math.abs(trend).toFixed(1)}% vs previous period
        </p>
      )}
    </div>
  )
}

export function PageHeader({ title, subtitle, actions, className }) {
  return (
    <div className={cn('flex flex-wrap items-end justify-between gap-3', className)}>
      <div className="min-w-0">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function ProgressBar({ value, max = 100, tone = 'brand', className }) {
  const percent = Math.min(100, Math.max(0, (Number(value) / (Number(max) || 1)) * 100))

  const tones = {
    brand: 'bg-brand-500',
    green: 'bg-emerald-500',
    amber: 'bg-amber-500',
    red: 'bg-rose-500',
  }

  return (
    <div className={cn('h-1.5 w-full overflow-hidden rounded-full bg-slate-200', className)}>
      <div className={cn('h-full rounded-full transition-all', tones[tone] ?? tones.brand)} style={{ width: `${percent}%` }} />
    </div>
  )
}

export function DataList({ items = [], className }) {
  return (
    <dl className={cn('divide-y divide-slate-100', className)}>
      {items.map((item) => (
        <div key={item.label} className="flex items-center justify-between gap-4 py-2">
          <dt className="text-sm text-slate-500">{item.label}</dt>
          <dd className={cn('text-sm font-semibold text-slate-900', item.className)}>{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}