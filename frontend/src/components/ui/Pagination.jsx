import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '../../lib/utils'

/**
 * Thin wrapper over a Laravel paginator.
 * Expects: { data, links: { first, last, prev, next }, meta: { current_page, last_page, from, to, total } }
 */
export default function Pagination({ meta, links, onPageChange, className }) {
  if (!meta?.last_page || meta.last_page <= 1) return null

  const current = meta.current_page || 1
  const last = meta.last_page || 1

  const pages = []
  const start = Math.max(1, current - 2)
  const end = Math.min(last, current + 2)

  if (start > 1) pages.push(1)
  if (start > 2) pages.push('...')
  for (let page = start; page <= end; page += 1) pages.push(page)
  if (end < last - 1) pages.push('...')
  if (end < last) pages.push(last)

  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-3 px-4 py-3', className)}>
      <p className="text-xs text-slate-500">
        Showing <span className="font-semibold text-slate-700">{meta.from ?? 0}</span> to{' '}
        <span className="font-semibold text-slate-700">{meta.to ?? 0}</span> of{' '}
        <span className="font-semibold text-slate-700">{meta.total ?? 0}</span>
      </p>

      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={!links?.prev}
          onClick={() => onPageChange?.(current - 1)}
          className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-300 px-2.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Prev
        </button>

        {pages.map((page, index) =>
          page === '...' ? (
            <span key={`gap-${index}`} className="px-1.5 text-xs text-slate-400">
              …
            </span>
          ) : (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange?.(page)}
              className={cn(
                'h-8 min-w-8 rounded-lg px-2 text-xs font-semibold transition',
                page === current
                  ? 'bg-brand-600 text-white'
                  : 'border border-slate-300 text-slate-600 hover:bg-slate-50',
              )}
            >
              {page}
            </button>
          ),
        )}

        <button
          type="button"
          disabled={!links?.next}
          onClick={() => onPageChange?.(current + 1)}
          className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-300 px-2.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}