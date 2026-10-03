import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { CheckCircle2, AlertTriangle, X } from 'lucide-react'
import { cn } from '../lib/utils'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const push = useCallback(
    (message, tone = 'success', title) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
      setToasts((current) => [...current, { id, message, tone, title }])
      setTimeout(() => dismiss(id), tone === 'error' ? 7000 : 4000)
      return id
    },
    [dismiss],
  )

  const value = useMemo(
    () => ({
      toast: push,
      success: (message, title) => push(message, 'success', title),
      error: (message, title) => push(message, 'error', title),
      info: (message, title) => push(message, 'info', title),
      dismiss,
    }),
    [push, dismiss],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)

  if (!context) throw new Error('useToast must be used inside a ToastProvider')

  return context
}

const TONES = {
  success: { wrapper: 'border-emerald-200 bg-white', icon: CheckCircle2, iconClass: 'text-emerald-500' },
  error: { wrapper: 'border-rose-200 bg-white', icon: AlertTriangle, iconClass: 'text-rose-500' },
  info: { wrapper: 'border-sky-200 bg-white', icon: AlertTriangle, iconClass: 'text-sky-500' },
}

function ToastViewport({ toasts, onDismiss }) {
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-full max-w-sm flex-col gap-2">
      {toasts.map((toast) => {
        const config = TONES[toast.tone] ?? TONES.info
        const Icon = config.icon

        return (
          <div
            key={toast.id}
            className={cn(
              'pointer-events-auto flex items-start gap-3 rounded-lg border px-4 py-3 shadow-pop animate-slide-up',
              config.wrapper,
            )}
          >
            <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', config.iconClass)} aria-hidden="true" />
            <div className="min-w-0 flex-1">
              {toast.title && <p className="text-sm font-semibold text-slate-900">{toast.title}</p>}
              <p className={cn('text-sm text-slate-600', toast.title && 'mt-0.5')}>{toast.message}</p>
            </div>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              aria-label="Dismiss notification"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )
      })}
    </div>
  )
}