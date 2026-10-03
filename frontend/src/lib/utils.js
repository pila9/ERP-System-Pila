export function cn(...values) {
  return values.flat(Infinity).filter(Boolean).join(' ')
}

/** Axios params object without empty / undefined values. */
export function cleanParams(params = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== '' && value !== null && value !== undefined),
  )
}

/** Build a querystring from a params object, skipping blanks. */
export function toQuery(params = {}) {
  const search = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value === '' || value === null || value === undefined) return
    search.append(key, String(value))
  })

  const query = search.toString()

  return query ? `?${query}` : ''
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export function isoDay(offsetDays = 0) {
  const date = new Date()
  date.setDate(date.getDate() + offsetDays)
  return date.toISOString().slice(0, 10)
}

export function startOfMonthISO() {
  const date = new Date()
  date.setDate(1)
  return date.toISOString().slice(0, 10)
}

export function monthStartISO(monthsBack = 0) {
  const date = new Date()
  date.setMonth(date.getMonth() - monthsBack, 1)
  return date.toISOString().slice(0, 10)
}