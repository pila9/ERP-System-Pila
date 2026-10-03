import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { MoreVertical, Pencil, Plus, RefreshCw, ShieldCheck, Trash2 } from 'lucide-react'
import { del, get, post, put } from '../../lib/api'
import { cleanParams, cn } from '../../lib/utils'
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
import { Checkbox, FormGrid, Input, Textarea } from '../../components/ui/Form'
import { SearchInput, Toolbar } from '../../components/ui/FilterBar'
import { EmptyState, ErrorState, TableSkeleton } from '../../components/ui/Feedback'

const EMPTY_FORM = { name: '', slug: '', description: '' }

const permissionName = (permission) =>
  typeof permission === 'string' ? permission : permission?.name ?? permission?.permission ?? ''

const permissionLabel = (permission) =>
  (typeof permission === 'object' && permission !== null && (permission.label ?? permission.title)) ||
  permissionName(permission).split('.').pop()?.replace(/_/g, ' ') || ''

export default function Roles() {
  const queryClient = useQueryClient()
  const toast = useToast()
  const can = usePermission()

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [selected, setSelected] = useState([])
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const params = useMemo(() => cleanParams({ page, search, per_page: 15 }), [page, search])

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['roles', params],
    queryFn: () => get('roles', params).then((response) => response.data),
  })

  const { data: catalogue } = useQuery({
    queryKey: ['roles', 'permissions'],
    queryFn: () => get('roles/permissions').then((response) => response.data),
  })

  const modules = catalogue?.modules ?? {}
  const grouped = catalogue?.grouped ?? {}
  const allPermissions = (catalogue?.all ?? []).map(permissionName).filter(Boolean)
  const moduleKeys = Object.keys(grouped)

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['roles'] })
    queryClient.invalidateQueries({ queryKey: ['users'] })
  }

  const saveMutation = useMutation({
    mutationFn: (payload) => (editing ? put(`roles/${editing.id}`, payload) : post('roles', payload)),
    onSuccess: () => {
      invalidate()
      closeModal()
      toast.success(editing ? 'Role updated.' : 'Role created.')
    },
    onError: (err) => {
      setErrors(err?.errors || {})
      setFormError(err?.message)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => del(`roles/${id}`),
    onSuccess: () => {
      invalidate()
      setDeleting(null)
      toast.success('Role deleted.')
    },
    onError: (err) => {
      toast.error(err?.message || 'Unable to delete the role.')
      setDeleting(null)
    },
  })

  const resetForm = () => {
    setErrors({})
    setFormError(null)
  }

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setSelected([])
    resetForm()
    setModalOpen(true)
  }

  const openEdit = (role) => {
    setEditing(role)
    setForm({ name: role.name ?? '', slug: role.slug ?? '', description: role.description ?? '' })
    setSelected((role.permissions ?? []).map(permissionName).filter(Boolean))
    resetForm()
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditing(null)
    setForm(EMPTY_FORM)
    setSelected([])
    resetForm()
  }

  const togglePermission = (name) => {
    setSelected((current) =>
      current.includes(name) ? current.filter((item) => item !== name) : [...current, name])
  }

  const toggleModule = (module) => {
    const names = (grouped[module] ?? []).map(permissionName).filter(Boolean)
    const everySelected = names.length > 0 && names.every((name) => selected.includes(name))

    setSelected((current) => (everySelected
      ? current.filter((name) => !names.includes(name))
      : Array.from(new Set([...current, ...names]))))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    resetForm()

    saveMutation.mutate({
      name: form.name,
      slug: form.slug,
      description: form.description || null,
      permissions: selected,
    })
  }

  const roles = data?.data ?? []
  const meta = data?.meta
  const links = data?.links
  const matrixLocked = Boolean(editing?.is_system)

  return (
    <div className="space-y-5">
      <PageHeader
        title="Roles"
        subtitle={`${meta?.total ?? 0} roles · permissions control access across the ERP`}
        actions={
          <>
            <Button variant="secondary" onClick={() => refetch()} loading={isFetching}>
              <RefreshCw className="h-4 w-4" /> Refresh
            </Button>
            {can('roles.manage') && <Button onClick={openCreate}><Plus className="h-4 w-4" /> New role</Button>}
          </>
        }
      />

      <Card>
        <Toolbar>
          <SearchInput
            value={search} placeholder="Search name or slug…" className="w-full sm:w-72"
            onChange={(value) => { setSearch(value); setPage(1) }}
          />
        </Toolbar>
        {isLoading ? (
          <TableSkeleton rows={6} columns={5} />
        ) : isError ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : roles.length === 0 ? (
          <EmptyState
            icon={ShieldCheck} title="No roles found" description="Adjust the search or create a custom role."
            action={can('roles.manage') ? <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4" /> New role</Button> : null}
          />
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Role</th>
                  <th>Slug</th>
                  <th>Description</th>
                  <th className="text-right">Permissions</th>
                  <th className="text-right">Users</th><th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {roles.map((role) => (
                  <tr key={role.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-800">{role.name}</p>
                        {role.is_system && <Badge tone="brand">System</Badge>}
                      </div>
                    </td>
                    <td className="whitespace-nowrap font-mono text-xs text-slate-500">{role.slug}</td>
                    <td className="max-w-sm text-slate-500">{role.description || '—'}</td>
                    <td className="text-right tabular font-medium">{role.permissions?.length ?? 0}</td>
                    <td className="text-right tabular">{role.users_count ?? 0}</td>
                    <td>
                      <Dropdown
                        align="right"
                        trigger={
                          <button type="button" className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        }
                        items={[
                          { label: 'Edit', icon: Pencil, disabled: !can('roles.manage'), onSelect: () => openEdit(role) },
                          {
                            label: 'Delete', icon: Trash2, tone: 'danger',
                            disabled: !can('roles.manage') || role.is_system || (role.users_count ?? 0) > 0,
                            onSelect: () => setDeleting(role),
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
        title={editing ? `Edit ${editing.name}` : 'New role'}
        subtitle={editing ? editing.slug : 'Create a role and pick its permissions'}
        size="xl"
        footer={
          <>
            <span className="mr-auto text-xs font-medium text-slate-500">
              {selected.length} of {allPermissions.length} selected
            </span>
            <Button variant="secondary" onClick={closeModal} disabled={saveMutation.isPending}>Cancel</Button>
            <Button onClick={handleSubmit} loading={saveMutation.isPending}>
              {editing ? 'Save changes' : 'Create role'}
            </Button>
          </>
        }
      >
        <form className="space-y-5" onSubmit={handleSubmit}>
          {formError && <Alert tone="error">{formError}</Alert>}

          <FormGrid>
            <Input
              label="Role name" required value={form.name} error={errors.name?.[0]}
              onChange={(event) => setForm((state) => ({ ...state, name: event.target.value }))} />
            <Input
              label="Slug" required value={form.slug} error={errors.slug?.[0]}
              hint="Lowercase letters, numbers and dashes, e.g. sales_manager"
              onChange={(event) => setForm((state) => ({ ...state, slug: event.target.value }))} />
          </FormGrid>

          <Textarea
            label="Description" value={form.description} error={errors.description?.[0]}
            onChange={(event) => setForm((state) => ({ ...state, description: event.target.value }))}
          />

          <div className="space-y-3 border-t border-slate-100 pt-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-800">Permissions</p>
                <p className="text-xs text-slate-500">{selected.length} of {allPermissions.length} selected</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="xs" disabled={matrixLocked} onClick={() => setSelected(allPermissions)}>Select all</Button>
                <Button variant="secondary" size="xs" disabled={matrixLocked} onClick={() => setSelected([])}>Clear</Button>
              </div>
            </div>

            {matrixLocked && (
              <Alert tone="info">This is a system role. The API rejects permission changes with a 422 error, so the matrix is read-only.</Alert>
            )}

            <fieldset className="space-y-3" disabled={matrixLocked}>
              {moduleKeys.length === 0 ? (
                <EmptyState icon={ShieldCheck} title="No permissions available" description="The permission catalogue is empty." />
              ) : (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {moduleKeys.map((module) => {
                    const names = (grouped[module] ?? []).map(permissionName).filter(Boolean)
                    const everySelected = names.length > 0 && names.every((name) => selected.includes(name))

                    return (
                      <div key={module} className="rounded-lg border border-slate-200 bg-white p-3">
                        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                          <p className="truncate text-xs font-bold uppercase tracking-wide text-slate-700">
                            {modules[module] ?? module}
                          </p>
                          <button
                            type="button" onClick={() => toggleModule(module)}
                            className="text-[11px] font-semibold text-brand-600 transition hover:text-brand-700"
                          >
                            {everySelected ? 'Clear' : 'Select all'}
                          </button>
                        </div>
                        <div className="mt-2 space-y-1.5">
                          {names.map((name) => (
                            <Checkbox
                              key={name} label={permissionLabel(name)} checked={selected.includes(name)}
                              onChange={() => togglePermission(name)}
                            />
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </fieldset>
          </div>

          <div className={cn('text-xs', selected.length === 0 ? 'text-amber-600' : 'text-slate-400')}>
            {selected.length === 0 ? 'A role without permissions cannot access anything.'
              : `Granting: ${selected.slice(0, 6).join(', ')}${selected.length > 6 ? '…' : ''}`}
          </div>

          <button type="submit" className="hidden" aria-hidden="true" />
        </form>
      </Modal>

      <Modal
        open={Boolean(deleting)} onClose={() => setDeleting(null)} title="Delete role" size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleting(null)}>Cancel</Button>
            <Button variant="danger" loading={deleteMutation.isPending} onClick={() => deleteMutation.mutate(deleting.id)}>Delete</Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          Are you sure you want to delete <span className="font-semibold">{deleting?.name}</span>? Users assigned to
          this role lose all access. Roles that still have users cannot be deleted.
        </p>
      </Modal>
    </div>
  )
}