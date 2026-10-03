import { ChevronDown } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { cn } from '../../lib/utils'

/**
 * Lightweight dropdown menu. Items: [{ label, icon, onSelect, tone, disabled }]
 */
export default function Dropdown({ trigger, items = [], align = 'right', className }) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined

    const onClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) setOpen(false)
    }

    const onEscape = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', onClickOutside)
    document.addEventListener('keydown', onEscape)

    return () => {
      document.removeEventListener('mousedown', onClickOutside)
      document.removeEventListener('keydown', onEscape)
    }
  }, [open])

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div onClick={() => setOpen((value) => !value)}>{trigger}</div>

      {open && (
        <div
          className={cn(
            'absolute z-30 mt-1 min-w-[11rem] overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-pop animate-fade-in',
            align === 'right' ? 'right-0' : 'left-0',
          )}
        >
          {items.map((item, index) =>
            item.divider ? (
              <div key={`divider-${index}`} className="my-1 h-px bg-slate-100" />
            ) : (
              <button
                key={item.label}
                type="button"
                disabled={item.disabled}
                onClick={() => {
                  setOpen(false)
                  item.onSelect?.()
                }}
                className={cn(
                  'flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition',
                  item.disabled
                    ? 'cursor-not-allowed text-slate-400'
                    : item.tone === 'danger'
                      ? 'text-rose-600 hover:bg-rose-50'
                      : 'text-slate-700 hover:bg-slate-50',
                )}
              >
                {item.icon && <item.icon className="h-4 w-4" aria-hidden="true" />}
                <span className="flex-1 truncate">{item.label}</span>
              </button>
            ),
          )}
        </div>
      )}
    </div>
  )
}

export function DropdownTrigger({ children, className }) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50',
        className,
      )}
    >
      {children}
      <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
    </button>
  )
}