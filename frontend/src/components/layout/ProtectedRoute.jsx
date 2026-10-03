import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Spinner } from '../ui/Feedback'

/**
 * Gate for authenticated routes. Optionally requires a permission.
 */
export default function ProtectedRoute({ children, permission }) {
  const { isAuthenticated, loading, hasPermission } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <Spinner className="h-7 w-7" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  if (permission && !hasPermission(permission)) {
    return (
      <div className="card mx-auto mt-10 max-w-md p-8 text-center">
        <h2 className="text-lg font-bold text-slate-900">Access denied</h2>
        <p className="mt-2 text-sm text-slate-500">
          Your role does not include the <span className="font-mono text-xs">{permission}</span> permission.
        </p>
      </div>
    )
  }

  return children
}