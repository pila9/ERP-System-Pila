import { format, parseISO, isValid } from 'date-fns'

export const CURRENCY = 'USD'

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: CURRENCY,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const compactFormatter = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

export function formatCurrency(value) {
  const number = Number(value)

  if (!Number.isFinite(number)) return currencyFormatter.format(0)

  return currencyFormatter.format(number)
}

export function formatNumber(value, decimals = 2) {
  const number = Number(value)

  if (!Number.isFinite(number)) return (0).toFixed(decimals)

  return number.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

export function formatCompact(value) {
  const number = Number(value)

  if (!Number.isFinite(number)) return '0'

  return compactFormatter.format(number)
}

export function formatPercent(value, decimals = 1) {
  const number = Number(value)

  if (!Number.isFinite(number)) return '0%'

  return `${number.toFixed(decimals)}%`
}

export function formatDate(value, pattern = 'dd MMM yyyy') {
  if (!value) return '-'

  const date = typeof value === 'string' ? parseISO(value) : new Date(value)

  return isValid(date) ? format(date, pattern) : '-'
}

export function formatDateTime(value) {
  if (!value) return '-'

  const date = typeof value === 'string' ? parseISO(value) : new Date(value)

  return isValid(date) ? format(date, 'dd MMM yyyy HH:mm') : '-'
}

export function formatDateShort(value) {
  return formatDate(value, 'dd MMM')
}

/** Human readable status label. */
export function titleCase(value) {
  if (!value) return '-'

  return String(value)
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

export function truncate(value, length = 60) {
  if (!value) return '-'

  const text = String(value)

  return text.length > length ? `${text.slice(0, length - 1)}…` : text
}

export function initialsOf(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}