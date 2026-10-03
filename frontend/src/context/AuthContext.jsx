import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { get, post, put, tokenStore, setUnauthorizedHandler } from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [permissions, setPermissions] = useState([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const queryClient = useQueryClient()

  const applySession = useCallback((payload) => {
    setUser(payload.user ?? null)
    setPermissions(payload.permissions ?? payload.user?.role?.permissions ?? [])
    setIsAdmin(Boolean(payload.is_admin))
  }, [])

  const logoutLocally = useCallback(() => {
    tokenStore.clear()
    setUser(null)
    setPermissions([])
    setIsAdmin(false)
    queryClient.clear()
  }, [queryClient])

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null)
      setPermissions([])
    })
  }, [])

  useEffect(() => {
    let cancelled = false

    const bootstrap = async () => {
      if (!tokenStore.get()) {
        setLoading(false)
        return
      }

      try {
        const { data } = await get('auth/me')
        if (!cancelled) applySession(data)
      } catch {
        if (!cancelled) logoutLocally()
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    bootstrap()

    return () => {
      cancelled = true
    }
  }, [applySession, logoutLocally])

  const login = useCallback(
    async (email, password) => {
      const { data } = await post('auth/login', { email, password, device_name: 'erp-web' })
      tokenStore.set(data.token)
      applySession({ user: data.user, permissions: data.user?.role?.permissions ?? [], is_admin: data.user?.role?.slug === 'admin' })
      await queryClient.invalidateQueries()
      return data.user
    },
    [applySession, queryClient],
  )

  const logout = useCallback(async () => {
    try {
      await post('auth/logout')
    } catch {
      // token already invalid - clear locally regardless
    }
    logoutLocally()
  }, [logoutLocally])

  const updateProfile = useCallback(
    async (payload) => {
      const { data } = await put('auth/profile', payload)
      setUser(data.data)
      return data.data
    },
    [],
  )

  const changePassword = useCallback(async (payload) => {
    const { data } = await put('auth/password', payload)
    return data
  }, [])

  const hasPermission = useCallback(
    (...required) => {
      if (!required.length) return true
      if (isAdmin) return true
      if (permissions.includes('*')) return true

      return required.some((permission) => {
        if (permissions.includes(permission)) return true
        const [module] = permission.split('.')
        return permissions.includes(`${module}.*`)
      })
    },
    [permissions, isAdmin],
  )

  const hasAnyPermission = useCallback(
    (...required) => hasPermission(...required),
    [hasPermission],
  )

  const value = useMemo(
    () => ({
      user,
      permissions,
      isAdmin,
      loading,
      isAuthenticated: Boolean(user),
      login,
      logout,
      updateProfile,
      changePassword,
      hasPermission,
      hasAnyPermission,
      canAny: hasAnyPermission,
      refreshUser: async () => {
        const { data } = await get('auth/me')
        applySession(data)
      },
    }),
    [user, permissions, isAdmin, loading, login, logout, updateProfile, changePassword, hasPermission, hasAnyPermission, applySession],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider')
  }

  return context
}

/** Convenience hook: `const can = usePermission()` → can('products.create') */
export function usePermission() {
  const { hasPermission, permissions, isAdmin } = useAuth()

  return useMemo(
    () => (permission) => {
      if (!permission) return true
      if (isAdmin || permissions.includes('*')) return true
      if (permissions.includes(permission)) return true
      const [module] = permission.split('.')
      return permissions.includes(`${module}.*`)
    },
    [hasPermission, permissions, isAdmin],
  )
}