import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { MoreVertical, Pencil, Plus, Power, RefreshCw, Trash2, Users as UsersIcon } from 'lucide-react'
import { del, get, post, put } from '../../lib/api'
import { cleanParams, cn } from '../../lib/utils'
import { formatDateTime } from '../../lib/format'
import { usePermission } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { PageHeader } from '../../components/ui/DataDisplay'
import { Card } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Alert from '../../components/ui/Alert'
import Dropdown from '../../components/ui/Dropdown'
import Pagination from '../../components/ui/Pagination'
import Badge from '../../components/ui/Badge'
import { Checkbox, FormGrid, Input, Select } from '../../components/ui/Form'
import { SearchInput, Toolbar, ToolbarSpacer } from '../../components/ui/FilterBar'
import { EmptyState, ErrorState, TableSkeleton } from '../../components/ui/Feedback'

const EMPTY_FORM = {
  name: '',
  email: '',
  password: '',
  role_id: '',
  phone: '',
  is_active: true,
}

export default function Users() {
  const queryClient = useQueryClient()
  const toast = useToast()
  const can = usePermission()

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({ role_id: '', is_active: '' })
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [deleteError, setDeleteError] = useState(null)

  const params = useMemo(
    () => cleanParams({ page, search, ...filters, per_page: 15 }),
    [page, search, filters],
  )

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['users', params],
    queryFn: () => get('users', params).then((response) => response.data),
  })

  const { data: rolesData } = useQuery({
    queryKey: ['roles', 'all'],
    queryFn: () => get('roles', { per_page: 100 }).then((response) => response.data.data),
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['users'] })
    queryClient.invalidateQueries({ queryKey: ['dashboard'] })
  }

  const saveMutation = useMutation({
    mutationFn: (payload) => (editing ? put(`users/${editing.id}`, payload) : post('users', payload)),
    onSuccess: () => {
      invalidate()
      closeModal()
      toast.success(editing ? 'User updated.' : 'User created.')
    },
    onError: (err) => {
      setErrors(err?.errors || {})
      setFormError(err?.message)
    },
  })

  const toggleMutation = useMutation({
    mutationFn: (user) => put(`users/${user.id}`, { is_active: !user.is_active }),
    onSuccess: () => {
      invalidate()
      toast.success('User status updated.')
    },
    onError: (err) => toast.error(err?.message || 'Unable to update the user.'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => del(`users/${id}`),
    onSuccess: () => {
      invalidate()
      closeDelete()
      toast.success('User deleted.')
    },
    onError: (err) => {
      const message = err?.message || 'Unable to delete the user.'
      toast.error(message)
      setDeleteError(message)
    },
  })

  const resetForm = () => {
    setErrors({})
    setFormError(null)
  }

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    resetForm()
    setModalOpen(true)
  }

  const openEdit = (user) => {
    setEditing(user)
    setForm({
      name: user.name ?? '',
      email: user.email ?? '',
      password: '',
      role_id: user.role_id ?? user.role?.id ?? '',
      phone: user.phone ?? '',
      is_active: Boolean(user.is_active),
    })
    resetForm()
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditing(null)
    setForm(EMPTY_FORM)
    resetForm()
  }

  const closeDelete = () => {
    setDeleting(null)
    setDeleteError(null)
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    resetForm()

    const payload = {
      name: form.name,
      email: form.email,
      role_id: form.role_id,
      phone: form.phone || null,
      is_active: Boolean(form.is_active),
    }

    if (form.password) payload.password = form.password
    saveMutation.mutate(payload)
  }

  const users = data?.data ?? []
  const meta = data?.meta
  const links = data?.links
  const roleOptions = (rolesData ?? []).map((role) => ({ value: role.id, label: role.name }))

  const bind = (field) => (event) => setForm((state) => ({ ...state, [field]: event.target.value }))

  return (
    <div className="space-y-5">
      <PageHeader
        title="Users"
        subtitle={`${meta?.total ?? 0} user accounts with access to the ERP`}
        actions={
          <>
            <Button variant="secondary" onClick={() => refetch()} loading={isFetching}>
              <RefreshCw className="h-4 w-4" /> Refresh
            </Button>
            {can('users.manage') && <Button onClick={openCreate}><Plus className="h-4 w-4" /> New user</Button>}
          </>
        }
      />

      <Card>
        <Toolbar>
          <SearchInput
            value={search} placeholder="Search name or email…" className="w-full sm:w-72"
            onChange={(value) => {
              setSearch(value)
              setPage(1)
            }}
          />
          <ToolbarSpacer />
          <Select
            className="w-48" placeholder="All roles" value={filters.role_id} options={roleOptions}
            onChange={(event) => {
              setFilters((state) => ({ ...state, role_id: event.target.value }))
              setPage(1)
            }}
          />
          <Select
            className="w-36" placeholder="Any status" value={filters.is_active}
            options={[{ value: 1, label: 'Active' }, { value: 0, label: 'Inactive' }]}
            onChange={(event) => {
              setFilters((state) => ({ ...state, is_active: event.target.value }))
              setPage(1)
            }}
          />
        </Toolbar>

        {isLoading ? (
          <TableSkeleton rows={8} columns={6} />
        ) : isError ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : users.length === 0 ? (
          <EmptyState
            icon={UsersIcon} title="No users found"
            description="Adjust your filters or create the first user account."
            action={can('users.manage') ? <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4" /> New user</Button> : null}
          />
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Phone</th>
                  <th>Last login</th>
                  <th>Status</th><th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <p className="font-medium text-slate-800">{user.name}</p>
                      <p className="text-xs text-slate-400">{user.email}</p>
                    </td>
                    <td>
                      {user.role ? <Badge tone="brand">{user.role.name}</Badge> : <span className="text-xs text-slate-400">—</span>}
                    </td>
                    <td className="whitespace-nowrap tabular text-slate-500">{user.phone || '—'}</td>
                    <td className="whitespace-nowrap text-slate-500">{formatDateTime(user.last_login_at)}</td>
                    <td>
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
                          user.is_active ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-slate-100 text-slate-500 ring-slate-200',
                        )}
                      >
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <Dropdown
                        align="right"
                        trigger={
                          <button type="button" className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        }
                        items={[
                          { label: 'Edit', icon: Pencil, disabled: !can('users.manage'), onSelect: () => openEdit(user) },
                          {
                            label: user.is_active ? 'Deactivate' : 'Activate', icon: Power,
                            disabled: !can('users.manage') || toggleMutation.isPending,
                            onSelect: () => toggleMutation.mutate(user),
                          },
                          {
                            label: 'Delete', icon: Trash2, tone: 'danger', disabled: !can('users.manage'),
                            onSelect: () => {
                              setDeleteError(null)
                              setDeleting(user)
                            },
                          },
                        ]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination meta={meta} links={links} onPageChange={setPage} className="border-t border-slate-200" />
      </Card>

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? `Edit ${editing.name}` : 'New user'}
        subtitle={editing ? editing.email : 'Create a user account and assign a role'}
        footer={
          <>
            <Button variant="secondary" onClick={closeModal} disabled={saveMutation.isPending}>Cancel</Button>
            <Button onClick={handleSubmit} loading={saveMutation.isPending}>
              {editing ? 'Save changes' : 'Create user'}
            </Button>
          </>
        }
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          {formError && <Alert tone="error">{formError}</Alert>}

          <FormGrid>
            <Input label="Full name" required value={form.name} error={errors.name?.[0]} onChange={bind('name')} />
            <Input label="Email" type="email" required value={form.email} error={errors.email?.[0]} onChange={bind('email')} />
          </FormGrid>

          <FormGrid>
            <Input
              label="Password" type="password" required={!editing} value={form.password} error={errors.password?.[0]}
              hint={editing ? 'Leave blank to keep the current password' : 'min 8 characters'} onChange={bind('password')}
            />
            <Select
              label="Role" required placeholder="Select a role" options={roleOptions}
              value={form.role_id} error={errors.role_id?.[0]} onChange={bind('role_id')}
            />
          </FormGrid>

          <Input label="Phone" value={form.phone} error={errors.phone?.[0]} onChange={bind('phone')} />

          <div className="flex flex-wrap gap-6 border-t border-slate-100 pt-3">
            <Checkbox
              label="Account is active" checked={form.is_active}
              onChange={(event) => setForm((state) => ({ ...state, is_active: event.target.checked }))}
            />
          </div>

          <button type="submit" className="hidden" aria-hidden="true" />
        </form>
      </Modal>

      <Modal
        open={Boolean(deleting)} onClose={closeDelete} title="Delete user" size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={closeDelete}>Cancel</Button>
            <Button variant="danger" loading={deleteMutation.isPending} onClick={() => deleteMutation.mutate(deleting.id)}>
              Delete
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          {deleteError && <Alert tone="error">{deleteError}</Alert>}
          <p className="text-sm text-slate-600">
            Are you sure you want to delete <span className="font-semibold">{deleting?.name}</span>? The account
            loses all access immediately. Deactivate the user instead if you only need to block sign-in.
          </p>
        </div>
      </Modal>
    </div>
  )
}