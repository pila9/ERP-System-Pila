import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Building2, MoreVertical, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { del, get, post, put } from '../../lib/api'
import { cleanParams } from '../../lib/utils'
import { usePermission } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { PageHeader } from '../../components/ui/DataDisplay'
import { Card } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Alert from '../../components/ui/Alert'
import Badge from '../../components/ui/Badge'
import Dropdown from '../../components/ui/Dropdown'
import Pagination from '../../components/ui/Pagination'
import { Checkbox, Input, Textarea } from '../../components/ui/Form'
import { SearchInput, Toolbar, ToolbarSpacer } from '../../components/ui/FilterBar'
import { EmptyState, ErrorState, TableSkeleton } from '../../components/ui/Feedback'

const EMPTY_FORM = { name: '', abbreviation: '', description: '', is_active: true }

export default function Units() {
  const queryClient = useQueryClient()
  const toast = useToast()
  const can = usePermission()

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const params = useMemo(() => cleanParams({ page, search, per_page: 20 }), [page, search])

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['units', params],
    queryFn: () => get('units', params).then((response) => response.data),
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['units'] })
    queryClient.invalidateQueries({ queryKey: ['products'] })
  }

  const saveMutation = useMutation({
    mutationFn: (payload) => (editing ? put(`units/${editing.id}`, payload) : post('units', payload)),
    onSuccess: () => {
      invalidate()
      closeModal()
      toast.success(editing ? 'Unit updated.' : 'Unit created.')
    },
    onError: (err) => {
      setErrors(err?.errors || {})
      setFormError(err?.message)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => del(`units/${id}`),
    onSuccess: () => {
      invalidate()
      setDeleting(null)
      toast.success('Unit deleted.')
    },
    onError: (err) => {
      toast.error(err?.message || 'Unable to delete the unit.')
      setDeleting(null)
    },
  })

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setErrors({})
    setFormError(null)
    setModalOpen(true)
  }

  const openEdit = (unit) => {
    setEditing(unit)
    setForm({
      name: unit.name ?? '',
      abbreviation: unit.abbreviation ?? '',
      description: unit.description ?? '',
      is_active: Boolean(unit.is_active),
    })
    setErrors({})
    setFormError(null)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditing(null)
    setForm(EMPTY_FORM)
    setErrors({})
    setFormError(null)
  }

  const submit = (event) => {
    event?.preventDefault()
    setErrors({})
    setFormError(null)
    saveMutation.mutate({ ...form, is_active: Boolean(form.is_active) })
  }

  const units = data?.data ?? []

  return (
    <div className="space-y-5">
      <PageHeader
        title="Units of measure"
        subtitle={`${data?.meta?.total ?? 0} units`}
        actions={
          <>
            <Button variant="secondary" onClick={() => refetch()} loading={isFetching}>
              <RefreshCw className="h-4 w-4" /> Refresh
            </Button>
            {can('categories.manage') && (
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" /> New unit
              </Button>
            )}
          </>
        }
      />

      <Card>
        <Toolbar>
          <SearchInput
            value={search}
            onChange={(value) => {
              setSearch(value)
              setPage(1)
            }}
            placeholder="Search units…"
            className="w-full sm:w-72"
          />
          <ToolbarSpacer />
        </Toolbar>

        {isLoading ? (
          <TableSkeleton rows={6} columns={4} />
        ) : isError ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : units.length === 0 ? (
          <EmptyState icon={Building2} title="No units defined" description="Add units such as Each, Box or Kilogram." />
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Unit</th>
                  <th>Abbreviation</th>
                  <th className="text-right">Products</th>
                  <th>Status</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {units.map((unit) => (
                  <tr key={unit.id}>
                    <td>
                      <p className="font-medium text-slate-800">{unit.name}</p>
                      {unit.description && <p className="text-xs text-slate-400">{unit.description}</p>}
                    </td>
                    <td className="font-mono text-xs uppercase text-slate-500">{unit.abbreviation}</td>
                    <td className="text-right tabular">{unit.products_count ?? 0}</td>
                    <td>{unit.is_active ? <Badge tone="green">Active</Badge> : <Badge>Inactive</Badge>}</td>
                    <td>
                      <Dropdown
                        align="right"
                        trigger={
                          <button type="button" className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        }
                        items={[
                          { label: 'Edit', icon: Pencil, disabled: !can('categories.manage'), onSelect: () => openEdit(unit) },
                          { label: 'Delete', icon: Trash2, tone: 'danger', disabled: !can('categories.manage'), onSelect: () => setDeleting(unit) },
                        ]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination meta={data?.meta} links={data?.links} onPageChange={setPage} className="border-t border-slate-200" />
      </Card>

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? `Edit ${editing.name}` : 'New unit'}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={closeModal} disabled={saveMutation.isPending}>
              Cancel
            </Button>
            <Button onClick={() => submit()} loading={saveMutation.isPending}>
              {editing ? 'Save changes' : 'Create unit'}
            </Button>
          </>
        }
      >
        <form className="space-y-4" onSubmit={submit}>
          {formError && <Alert tone="error">{formError}</Alert>}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label="Name"
              required
              placeholder="Each"
              value={form.name}
              error={errors.name?.[0]}
              onChange={(event) => setForm((state) => ({ ...state, name: event.target.value }))}
            />
            <Input
              label="Abbreviation"
              required
              placeholder="ea"
              value={form.abbreviation}
              error={errors.abbreviation?.[0]}
              onChange={(event) => setForm((state) => ({ ...state, abbreviation: event.target.value }))}
            />
          </div>

          <Textarea
            label="Description"
            rows={2}
            value={form.description ?? ''}
            error={errors.description?.[0]}
            onChange={(event) => setForm((state) => ({ ...state, description: event.target.value }))}
          />

          <Checkbox
            label="Active"
            checked={form.is_active}
            onChange={(event) => setForm((state) => ({ ...state, is_active: event.target.checked }))}
          />

          <button type="submit" className="hidden" aria-hidden="true" />
        </form>
      </Modal>

      <Modal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Delete unit"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button variant="danger" loading={deleteMutation.isPending} onClick={() => deleteMutation.mutate(deleting.id)}>
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          Delete <span className="font-semibold">{deleting?.name}</span>? Units used by products cannot be deleted.
        </p>
      </Modal>
    </div>
  )
}