import axios from 'axios'

export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

const TOKEN_KEY = 'erp.token'

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { Accept: 'application/json' },
  timeout: 30000,
})

api.interceptors.request.use((config) => {
  const token = tokenStore.get()

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

let onUnauthorized = null

export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const url = error.config?.url || ''

    if (status === 401 && !url.includes('/auth/login')) {
      tokenStore.clear()
      if (typeof onUnauthorized === 'function') onUnauthorized()
    }

    return Promise.reject(normalizeError(error))
  }
)

/**
 * Turn any axios error into `{ message, errors, status }`.
 */
export function normalizeError(error) {
  const data = error?.response?.data
  const status = error?.response?.status ?? 0

  const normalized = new Error(
    data?.message || error?.message || 'Something went wrong. Please try again.',
  )
  normalized.status = status
  normalized.errors = data?.errors || null
  normalized.details = data || null

  return normalized
}

/** First validation message for a field, if any. */
export function fieldError(error, field) {
  const errors = error?.errors

  if (!errors) return undefined
  if (errors[field]?.[0]) return errors[field][0]
  if (typeof errors === 'string') return errors

  return undefined
}

export const get = (url, params, config) => api.get(url, { params, ...config })
export const post = (url, data, config) => api.post(url, data, config)
export const put = (url, data, config) => api.put(url, data, config)
export const patch = (url, data, config) => api.patch(url, data, config)
export const del = (url, config) => api.delete(url, config)