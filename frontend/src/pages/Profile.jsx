import { useEffect, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { KeyRound, Save, ShieldCheck, User as UserIcon } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { PageHeader, DataList } from '../components/ui/DataDisplay'
import { Card, CardBody, CardHeader } from '../components/ui/Card'
import { FormGrid, Input } from '../components/ui/Form'
import Button from '../components/ui/Button'
import Alert from '../components/ui/Alert'
import { badgeTone } from '../lib/status'

export default function Profile() {
  const { user, permissions, isAdmin, updateProfile, changePassword } = useAuth()
  const toast = useToast()

  const [profile, setProfile] = useState({ name: user?.name ?? '', email: user?.email ?? '', phone: user?.phone ?? '' })
  const [profileErrors, setProfileErrors] = useState({})
  const [passwords, setPasswords] = useState({ current_password: '', password: '', password_confirmation: '' })
  const [passwordErrors, setPasswordErrors] = useState({})
  const [formError, setFormError] = useState(null)

  useEffect(() => {
    setProfile({ name: user?.name ?? '', email: user?.email ?? '', phone: user?.phone ?? '' })
  }, [user])

  const profileMutation = useMutation({
    mutationFn: () => updateProfile(profile),
    onSuccess: () => {
      toast.success('Profile updated.')
      setProfileErrors({})
    },
    onError: (error) => {
      setProfileErrors(error?.errors || {})
      setFormError(error?.message)
    },
  })

  const passwordMutation = useMutation({
    mutationFn: () => changePassword(passwords),
    onSuccess: () => {
      toast.success('Password changed. Other sessions were signed out.')
      setPasswords({ current_password: '', password: '', password_confirmation: '' })
      setPasswordErrors({})
    },
    onError: (error) => {
      setPasswordErrors(error?.errors || {})
      setFormError(error?.message)
    },
  })

  return (
    <div className="space-y-6">
      <PageHeader title="My profile" subtitle="Manage your account details and password" />

      {formError && <Alert tone="error" onDismiss={() => setFormError(null)}>{formError}</Alert>}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Account details" subtitle="Your name, email and phone number" />
          <CardBody>
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault()
                setFormError(null)
                profileMutation.mutate()
              }}
            >
              <FormGrid>
                <Input
                  label="Full name"
                  required
                  value={profile.name}
                  error={profileErrors.name?.[0]}
                  onChange={(event) => setProfile((state) => ({ ...state, name: event.target.value }))}
                />
                <Input
                  label="Email"
                  type="email"
                  required
                  value={profile.email}
                  error={profileErrors.email?.[0]}
                  onChange={(event) => setProfile((state) => ({ ...state, email: event.target.value }))}
                />
                <Input
                  label="Phone"
                  value={profile.phone ?? ''}
                  error={profileErrors.phone?.[0]}
                  onChange={(event) => setProfile((state) => ({ ...state, phone: event.target.value }))}
                />
              </FormGrid>

              <div className="flex justify-end">
                <Button type="submit" loading={profileMutation.isPending}>
                  <Save className="h-4 w-4" /> Save changes
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Role" subtitle="Your access level in the ERP" />
            <CardBody>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  <UserIcon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{user?.role?.name ?? 'No role'}</p>
                  <p className="text-xs text-slate-500">{user?.email}</p>
                </div>
              </div>

              <div className="mt-4">
                <p className="label">Permissions ({permissions.length})</p>
                <div className="flex max-h-40 flex-wrap gap-1 overflow-y-auto">
                  {permissions.includes('*') ? (
                    <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700 ring-1 ring-inset ring-brand-200">
                      * (full access)
                    </span>
                  ) : (
                    permissions.map((permission) => (
                      <span
                        key={permission}
                        className={`rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${badgeTone('order_status', 'draft')}`}
                      >
                        {permission}
                      </span>
                    ))
                  )}
                </div>
              </div>

              {isAdmin && (
                <p className="mt-4 flex items-center gap-2 rounded-lg bg-brand-50 px-3 py-2 text-xs font-medium text-brand-700">
                  <ShieldCheck className="h-4 w-4" /> Administrator account
                </p>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Last sign in" />
            <CardBody>
              <DataList
                items={[
                  { label: 'Last login', value: user?.last_login_at ? new Date(user.last_login_at).toLocaleString() : 'This session' },
                  { label: 'Account created', value: user?.created_at ? new Date(user.created_at).toLocaleDateString() : '-' },
                ]}
              />
            </CardBody>
          </Card>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader title="Change password" subtitle="At least 8 characters" />
        <CardBody>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault()
              setFormError(null)
              passwordMutation.mutate()
            }}
          >
            <Input
              label="Current password"
              type="password"
              autoComplete="current-password"
              required
              value={passwords.current_password}
              error={passwordErrors.current_password?.[0]}
              onChange={(event) => setPasswords((state) => ({ ...state, current_password: event.target.value }))}
            />
            <FormGrid>
              <Input
                label="New password"
                type="password"
                autoComplete="new-password"
                required
                value={passwords.password}
                error={passwordErrors.password?.[0]}
                onChange={(event) => setPasswords((state) => ({ ...state, password: event.target.value }))}
              />
              <Input
                label="Confirm new password"
                type="password"
                autoComplete="new-password"
                required
                value={passwords.password_confirmation}
                error={passwordErrors.password_confirmation?.[0]}
                onChange={(event) => setPasswords((state) => ({ ...state, password_confirmation: event.target.value }))}
              />
            </FormGrid>

            <div className="flex justify-end">
              <Button type="submit" loading={passwordMutation.isPending}>
                <KeyRound className="h-4 w-4" /> Update password
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  )
}