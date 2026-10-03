import { cn } from '../../lib/utils'

export function Card({ className, children, ...props }) {
  return (
    <div className={cn('card', className)} {...props}>
      {children}
    </div>
  )
}

export function CardHeader({ title, subtitle, actions, className }) {
  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4', className)}>
      <div className="min-w-0">
        {title && <h3 className="truncate text-sm font-semibold text-slate-900">{title}</h3>}
        {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  )
}

export function CardBody({ className, children }) {
  return <div className={cn('px-5 py-4', className)}>{children}</div>
}

export function CardFooter({ className, children }) {
  return <div className={cn('border-t border-slate-200 bg-slate-50/60 px-5 py-3', className)}>{children}</div>
}