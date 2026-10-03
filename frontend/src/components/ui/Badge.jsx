import { cn } from '../../lib/utils'
import { badgeTone, label as statusLabel } from '../../lib/status'

const TONES = {
  slate: 'bg-slate-100 text-slate-700 ring-slate-200',
  brand: 'bg-brand-50 text-brand-700 ring-brand-200',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  red: 'bg-rose-50 text-rose-700 ring-rose-200',
  amber: 'bg-amber-50 text-amber-700 ring-amber-200',
  blue: 'bg-sky-50 text-sky-700 ring-sky-200',
  violet: 'bg-violet-50 text-violet-700 ring-violet-200',
}

export default function Badge({ tone = 'slate', className, children }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
        TONES[tone] ?? TONES.slate,
        className,
      )}
    >
      {children}
    </span>
  )
}

/**
 * Coloured badge driven by the status maps in `lib/status.js`.
 * group: 'order_status' | 'invoice_status' | 'purchase_status' | 'movement_type' | ...
 */
export function StatusBadge({ group, value }) {
  return (
    <span
      className={cn(
        'inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
        badgeTone(group, value),
      )}
    >
      {statusLabel(group, value)}
    </span>
  )
}