import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react'
import { cn } from '../../lib/utils'

const TONES = {
  info: { wrapper: 'bg-sky-50 text-sky-800 ring-sky-200', icon: Info, iconClass: 'text-sky-500' },
  success: { wrapper: 'bg-emerald-50 text-emerald-800 ring-emerald-200', icon: CheckCircle2, iconClass: 'text-emerald-500' },
  warning: { wrapper: 'bg-amber-50 text-amber-800 ring-amber-200', icon: AlertTriangle, iconClass: 'text-amber-500' },
  error: { wrapper: 'bg-rose-50 text-rose-800 ring-rose-200', icon: XCircle, iconClass: 'text-rose-500' },
}

export default function Alert({ tone = 'info', title, children, className, onDismiss }) {
  const config = TONES[tone] ?? TONES.info
  const Icon = config.icon

  return (
    <div className={cn('flex items-start gap-3 rounded-lg px-4 py-3 text-sm ring-1', config.wrapper, className)}>
      <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', config.iconClass)} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cn(title && 'mt-0.5')}>{children}</div>}
      </div>
      {onDismiss && (
        <button type="button" onClick={onDismiss} className="text-xs font-semibold opacity-70 hover:opacity-100">
          Dismiss
        </button>
      )}
    </div>
  )
}