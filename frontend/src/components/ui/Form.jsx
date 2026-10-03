import { forwardRef, useId } from 'react'
import { cn } from '../../lib/utils'

const baseField =
  'block w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-800 shadow-sm transition ' +
  'placeholder:text-slate-400 focus:outline-none focus:ring-2 disabled:bg-slate-50 disabled:text-slate-500'

const toneFor = (error) =>
  error
    ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-100'
    : 'border-slate-300 focus:border-brand-500 focus:ring-brand-100'

export function Field({ label, error, hint, required, className, children, htmlFor }) {
  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label className="label" htmlFor={htmlFor}>
          {label}
          {required && <span className="ml-0.5 text-rose-500">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="mt-1 text-xs font-medium text-rose-600">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  )
}

export const Input = forwardRef(function Input({ label, error, hint, className, required, id, ...props }, ref) {
  const generatedId = useId()
  const inputId = id || generatedId

  return (
    <Field label={label} error={error} hint={hint} required={required} htmlFor={inputId} className={className}>
      <input
        ref={ref}
        id={inputId}
        aria-invalid={error ? 'true' : undefined}
        className={cn(baseField, toneFor(error), props.type === 'checkbox' ? 'h-4 w-4 p-0' : '')}
        {...props}
      />
    </Field>
  )
})

export const Textarea = forwardRef(function Textarea(
  { label, error, hint, className, required, rows = 3, id, ...props },
  ref,
) {
  const generatedId = useId()
  const inputId = id || generatedId

  return (
    <Field label={label} error={error} hint={hint} required={required} htmlFor={inputId} className={className}>
      <textarea
        ref={ref}
        id={inputId}
        rows={rows}
        aria-invalid={error ? 'true' : undefined}
        className={cn(baseField, toneFor(error), 'resize-y')}
        {...props}
      />
    </Field>
  )
})

export const Select = forwardRef(function Select(
  { label, error, hint, className, required, options = [], placeholder, id, children, ...props },
  ref,
) {
  const generatedId = useId()
  const inputId = id || generatedId

  return (
    <Field label={label} error={error} hint={hint} required={required} htmlFor={inputId} className={className}>
      <select
        ref={ref}
        id={inputId}
        aria-invalid={error ? 'true' : undefined}
        className={cn(baseField, toneFor(error), 'pr-8')}
        {...props}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
        {children}
      </select>
    </Field>
  )
})

export function Checkbox({ label, className, ...props }) {
  return (
    <label className={cn('flex cursor-pointer items-center gap-2 text-sm text-slate-700', className)}>
      <input
        type="checkbox"
        className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
        {...props}
      />
      <span>{label}</span>
    </label>
  )
}

export function FormGrid({ columns = 2, className, children }) {
  const gridClass =
    columns === 1
      ? 'grid grid-cols-1 gap-4'
      : columns === 3
        ? 'grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3'
        : columns === 4
          ? 'grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4'
          : 'grid grid-cols-1 gap-4 md:grid-cols-2'

  return <div className={cn(gridClass, className)}>{children}</div>
}