import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { MapPin, MoreVertical, Pencil, Plus, RefreshCw, Trash2, Warehouse as WarehouseIcon } from 'lucide-react'
import { del, get, post, put } from '../../lib/api'
import { cleanParams } from '../../lib/utils'
import { formatCurrency, formatNumber } from '../../lib/format'
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
import { Checkbox, FormGrid, Input } from '../../components/ui/Form'
import { SearchInput, Toolbar, ToolbarSpacer } from '../../components/ui/FilterBar'
import { EmptyState, ErrorState, TableSkeleton } from '../../components/ui/Feedback'

const EMPTY_FORM = {
  code: '',
  name: '',
  address: '',
  city: '',
  country: '',
  phone: '',
  manager: '',
  is_default: false,
  is_active: true,
}

export default function Warehouses() {
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
    queryKey: ['warehouses', params],
    queryFn: () => get('warehouses', params).then((response) => response.data),
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['warehouses'] })
    queryClient.invalidateQueries({ queryKey: ['stock'] })
  }

  const saveMutation = useMutation({
    mutationFn: (payload) => (editing ? put(`warehouses/${editing.id}`, payload) : post('warehouses', payload)),
    onSuccess: () => {
      invalidate()
      closeModal()
      toast.success(editing ? 'Warehouse updated.' : 'Warehouse created.')
    },
    onError: (err) => {
      setErrors(err?.errors || {})
      setFormError(err?.message)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => del(`warehouses/${id}`),
    onSuccess: () => {
      invalidate()
      setDeleting(null)
      toast.success('Warehouse deleted.')
    },
    onError: (err) => {
      toast.error(err?.message || 'Unable to delete the warehouse.')
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

  const openEdit = (warehouse) => {
    setEditing(warehouse)
    setForm({
      code: warehouse.code ?? '',
      name: warehouse.name ?? '',
      address: warehouse.address ?? '',
      city: warehouse.city ?? '',
      country: warehouse.country ?? '',
      phone: warehouse.phone ?? '',
      manager: warehouse.manager ?? '',
      is_default: Boolean(warehouse.is_default),
      is_active: Boolean(warehouse.is_active),
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
    saveMutation.mutate({
      ...form,
      address: form.address || null,
      city: form.city || null,
      country: form.country || null,
      phone: form.phone || null,
      manager: form.manager || null,
      is_default: Boolean(form.is_default),
      is_active: Boolean(form.is_active),
    })
  }

  const warehouses = data?.data ?? []

  return (
    <div className="space-y-5">
      <PageHeader
        title="Warehouses"
        subtitle={`${data?.meta?.total ?? 0} locations`}
        actions={
          <>
            <Button variant="secondary" onClick={() => refetch()} loading={isFetching}>
              <RefreshCw className="h-4 w-4" /> Refresh
            </Button>
            {can('warehouses.manage') && (
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" /> New warehouse
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
            placeholder="Search warehouses…"
            className="w-full sm:w-72"
          />
          <ToolbarSpacer />
        </Toolbar>

        {isLoading ? (
          <TableSkeleton rows={5} columns={5} />
        ) : isError ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : warehouses.length === 0 ? (
          <EmptyState icon={WarehouseIcon} title="No warehouses yet" description="Add a warehouse to start tracking stock." />
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Warehouse</th>
                  <th>Location</th>
                  <th>Manager</th>
                  <th className="text-right">Quantity</th>
                  <th className="text-right">Stock value</th>
                  <th>Status</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {warehouses.map((warehouse) => (
                  <tr key={warehouse.id}>
                    <td>
                      <p className="font-medium text-slate-800">{warehouse.name}</p>
                      <p className="font-mono text-xs text-slate-400">{warehouse.code}</p>
                    </td>
                    <td className="text-sm text-slate-500">
                      {warehouse.city || warehouse.address ? (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-slate-400" />
                          {[warehouse.city, warehouse.country].filter(Boolean).join(', ') || '—'}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="text-sm text-slate-600">{warehouse.manager || '—'}</td>
                    <td className="text-right tabular">{formatNumber(warehouse.total_quantity ?? 0)}</td>
                    <td className="text-right tabular font-medium">{formatCurrency(warehouse.total_value ?? 0)}</td>
                    <td>
                      <div className="flex flex-wrap items-center gap-1">
                        {warehouse.is_default && <Badge tone="brand">Default</Badge>}
                        {warehouse.is_active ? <Badge tone="green">Active</Badge> : <Badge>Inactive</Badge>}
                      </div>
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
                          { label: 'Edit', icon: Pencil, disabled: !can('warehouses.manage'), onSelect: () => openEdit(warehouse) },
                          { label: 'Delete', icon: Trash2, tone: 'danger', disabled: !can('warehouses.manage'), onSelect: () => setDeleting(warehouse) },
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
        title={editing ? `Edit ${editing.name}` : 'New warehouse'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={closeModal} disabled={saveMutation.isPending}>
              Cancel
            </Button>
            <Button onClick={() => submit()} loading={saveMutation.isPending}>
              {editing ? 'Save changes' : 'Create warehouse'}
            </Button>
          </>
        }
      >
        <form className="space-y-4" onSubmit={submit}>
          {formError && <Alert tone="error">{formError}</Alert>}

          <FormGrid>
            <Input
              label="Code"
              required
              placeholder="WH-MAIN"
              value={form.code}
              error={errors.code?.[0]}
              onChange={(event) => setForm((state) => ({ ...state, code: event.target.value }))}
            />
            <Input
              label="Name"
              required
              value={form.name}
              error={errors.name?.[0]}
              onChange={(event) => setForm((state) => ({ ...state, name: event.target.value }))}
            />
            <Input
              label="City"
              value={form.city ?? ''}
              error={errors.city?.[0]}
              onChange={(event) => setForm((state) => ({ ...state, city: event.target.value }))}
            />
            <Input
              label="Country"
              value={form.country ?? ''}
              error={errors.country?.[0]}
              onChange={(event) => setForm((state) => ({ ...state, country: event.target.value }))}
            />
          </FormGrid>

          <Input
            label="Address"
            value={form.address ?? ''}
            error={errors.address?.[0]}
            onChange={(event) => setForm((state) => ({ ...state, address: event.target.value }))}
          />

          <FormGrid>
            <Input
              label="Phone"
              value={form.phone ?? ''}
              error={errors.phone?.[0]}
              onChange={(event) => setForm((state) => ({ ...state, phone: event.target.value }))}
            />
            <Input
              label="Manager"
              value={form.manager ?? ''}
              error={errors.manager?.[0]}
              onChange={(event) => setForm((state) => ({ ...state, manager: event.target.value }))}
            />
          </FormGrid>

          <div className="flex flex-wrap gap-6 border-t border-slate-100 pt-3">
            <Checkbox
              label="Default warehouse"
              checked={form.is_default}
              onChange={(event) => setForm((state) => ({ ...state, is_default: event.target.checked }))}
            />
            <Checkbox
              label="Active"
              checked={form.is_active}
              onChange={(event) => setForm((state) => ({ ...state, is_active: event.target.checked }))}
            />
          </div>

          <button type="submit" className="hidden" aria-hidden="true" />
        </form>
      </Modal>

      <Modal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Delete warehouse"
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
          Delete <span className="font-semibold">{deleting?.name}</span>? Warehouses holding stock cannot be deleted.
        </p>
      </Modal>
    </div>
  )
}