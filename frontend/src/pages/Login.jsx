import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { LockKeyhole, Mail, Package, ShieldCheck, Warehouse } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Button from '../components/ui/Button'
import { Input } from '../components/ui/Form'
import Alert from '../components/ui/Alert'
import { Spinner } from '../components/ui/Feedback'

const DEMO_ACCOUNTS = [
  { role: 'Administrator', email: 'admin@erp.test' },
  { role: 'General manager', email: 'manager@erp.test' },
  { role: 'Sales', email: 'sales@erp.test' },
  { role: 'Warehouse', email: 'warehouse@erp.test' },
  { role: 'Accountant', email: 'accountant@erp.test' },
]

export default function Login() {
  const { login, isAuthenticated, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: 'admin@erp.test', password: 'password' })
  const [error, setError] = useState(null)

  const mutation = useMutation({
    mutationFn: () => login(form.email, form.password),
    onSuccess: () => {
      navigate(location.state?.from || '/', { replace: true })
    },
    onError: (err) => {
      const fieldMessage = err?.errors?.email?.[0]
      setError(fieldMessage || err?.message || 'Unable to sign in.')
    },
  })

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <Spinner className="h-7 w-7" />
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    setError(null)
    mutation.mutate()
  }

  return (
    <div className="flex min-h-screen">
      <div className="relative hidden flex-1 flex-col justify-between overflow-hidden bg-slate-900 p-12 lg:flex">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-700/40 via-slate-900 to-slate-900" />
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-sm font-bold text-white">
              ERP
            </div>
            <div>
              <p className="text-lg font-bold text-white">ERP System</p>
              <p className="text-sm text-slate-400">Operations, inventory and finance</p>
            </div>
          </div>
        </div>

        <div className="relative max-w-md">
          <h1 className="text-3xl font-bold leading-tight text-white">
            Run your whole business from one workspace.
          </h1>
          <p className="mt-3 text-slate-300">
            Sales orders, purchasing, stock control, invoicing and reporting - fully integrated and
            permission aware.
          </p>

          <ul className="mt-8 space-y-3 text-sm text-slate-300">
            {[
              { icon: Package, text: 'Product catalogue with multi-warehouse stock' },
              { icon: Warehouse, text: 'Purchase orders, goods receipts and live costing' },
              { icon: ShieldCheck, text: 'Role based access for every team' },
            ].map((item) => (
              <li key={item.text} className="flex items-center gap-3">
                <item.icon className="h-5 w-5 text-brand-400" />
                {item.text}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-slate-500">© {new Date().getFullYear()} ERP System. All rights reserved.</p>
      </div>

      <div className="flex w-full items-center justify-center bg-slate-100 px-4 py-10 lg:w-[480px] lg:px-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-sm font-bold text-white">
                ERP
              </div>
              <p className="text-lg font-bold text-slate-900">ERP System</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Sign in</h2>
          <p className="mt-1 text-sm text-slate-500">Use your work email and password.</p>

          <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
            {error && <Alert tone="error">{error}</Alert>}

            <Input
              label="Email"
              type="email"
              autoComplete="username"
              required
              value={form.email}
              onChange={(event) => setForm((state) => ({ ...state, email: event.target.value }))}
              placeholder="you@company.com"
            />

            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              required
              value={form.password}
              onChange={(event) => setForm((state) => ({ ...state, password: event.target.value }))}
              placeholder="••••••••"
            />

            <Button type="submit" size="lg" className="w-full" loading={mutation.isPending}>
              {!mutation.isPending && <LockKeyhole className="h-4 w-4" />}
              Sign in
            </Button>
          </form>

          <div className="mt-8 rounded-xl border border-slate-200 bg-white p-4">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <Mail className="h-3.5 w-3.5" /> Demo accounts
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Password for all accounts: <span className="font-mono font-semibold">password</span>
            </p>
            <div className="mt-3 grid grid-cols-1 gap-1.5">
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => setForm({ email: account.email, password: 'password' })}
                  className="flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs transition hover:bg-slate-50"
                >
                  <span className="font-medium text-slate-700">{account.role}</span>
                  <span className="truncate font-mono text-[11px] text-slate-500">{account.email}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}