import { Search, X } from 'lucide-react'
import { cn } from '../../lib/utils'

/**
 * Toolbar search input with a clear button. Debounce handled by the caller.
 */
export function SearchInput({ value, onChange, placeholder = 'Search…', className }) {
  return (
    <div className={cn('relative', className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="input pl-9 pr-8"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-700"
          aria-label="Clear search"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}

export function Toolbar({ children, className }) {
  return (
    <div className={cn('flex flex-wrap items-center gap-2 border-b border-slate-200 px-4 py-3', className)}>
      {children}
    </div>
  )
}

export function ToolbarSpacer() {
  return <div className="flex-1" />
}

/**
 * Responsive filter bar: a search input plus selects/buttons.
 */
export function FilterBar({ search, onSearchChange, placeholder, children, className }) {
  return (
    <div className={cn('flex flex-col gap-3 border-b border-slate-200 px-4 py-3 lg:flex-row lg:items-center', className)}>
      {search !== undefined && (
        <SearchInput value={search} onChange={onSearchChange} placeholder={placeholder} className="lg:w-72" />
      )}
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  )
}

export function ActiveFilterChips({ filters = [], onRemove, onClear }) {
  if (!filters.length) return null

  return (
    <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200 bg-slate-50/60 px-4 py-2">
      {filters.map((filter) => (
        <button
          key={filter.key}
          type="button"
          onClick={() => onRemove?.(filter.key)}
          className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-700 ring-1 ring-inset ring-slate-200 transition hover:bg-slate-100"
        >
          {filter.label}
          <X className="h-3 w-3 text-slate-400" />
        </button>
      ))}
      {filters.length > 1 && (
        <button type="button" onClick={onClear} className="text-xs font-semibold text-brand-600 hover:text-brand-700">
          Clear all
        </button>
      )}
    </div>
  )
}