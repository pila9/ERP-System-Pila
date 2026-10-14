import { Link } from 'react-router-dom'
import Button from '../components/ui/Button'
import { Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-100 px-6 text-center">
      <p className="text-6xl font-black text-brand-600">404</p>
      <h1 className="text-xl font-bold text-slate-900">Page not found</h1>
      <p className="max-w-md text-sm text-slate-500">
        The page you are looking for does not exist or you may not have permission to view it.
      </p>
      <Link to="/">
        <Button>
          <Home className="h-4 w-4" /> Back to dashboard
        </Button>
      </Link>
    </div>
  )
}