import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Factory, MoreVertical, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { del, get, post, put } from '../../lib/api'
import { cleanParams } from '../../lib/utils'
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
import { Checkbox, FormGrid, Input, Select, Textarea } from '../../components/ui/Form'
import { SearchInput, Toolbar, ToolbarSpacer } from '../../components/ui/FilterBar'
import { EmptyState, ErrorState, TableSkeleton } from '../../components/ui/Feedback'

const SORT_OPTIONS = [
  { value: 'name:asc', label: 'Name (A-Z)' },
  { value: 'name:desc', label: 'Name (Z-A)' },
  { value: 'code:asc', label: 'Code (A-Z)' },
  { value: 'created_at:desc', label: 'Newest first' },
]

const EMPTY_FORM = {
  code: '',
  name: '',
  company: '',
  email: '',
  phone: '',
  tax_number: '',
  address: '',
  city: '',
  state: '',
  country: '',
  postal_code: '',
  payment_terms_days: 0,
  bank_name: '',
  bank_account: '',
  notes: '',
  is_active: true,
}

export default function Suppliers() {
  const queryClient = useQueryClient()
  const toast = useToast()
  const can = usePermission()

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({ is_active: '', sort: '' })
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const params = useMemo(() => {
    const [sort, direction] = filters.sort ? filters.sort.split(':') : ['', '']

    return cleanParams({ page, search, is_active: filters.is_active, sort, direction, per_page: 15 })
  }, [page, search, filters])

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['suppliers', params],
    queryFn: () => get('suppliers', params).then((response) => response.data),
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['suppliers'] })
    queryClient.invalidateQueries({ queryKey: ['dashboard'] })
  }

  const saveMutation = useMutation({
    mutationFn: (payload) => (editing ? put(`suppliers/${editing.id}`, payload) : post('suppliers', payload)),
    onSuccess: () => {
      invalidate()
      closeModal()
      toast.success(editing ? 'Supplier updated.' : 'Supplier created.')
    },
    onError: (err) => {
      setErrors(err?.errors || {})
      setFormError(err?.message)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => del(`suppliers/${id}`),
    onSuccess: () => {
      invalidate()
      setDeleting(null)
      toast.success('Supplier deleted.')
    },
    onError: (err) => {
      toast.error(err?.message || 'Unable to delete the supplier.')
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

  const openEdit = (supplier) => {
    setEditing(supplier)
    setForm({
      code: supplier.code ?? '',
      name: supplier.name ?? '',
      company: supplier.company ?? '',
      email: supplier.email ?? '',
      phone: supplier.phone ?? '',
      tax_number: supplier.tax_number ?? '',
      address: supplier.address ?? '',
      city: supplier.city ?? '',
      state: supplier.state ?? '',
      country: supplier.country ?? '',
      postal_code: supplier.postal_code ?? '',
      payment_terms_days: Number(supplier.payment_terms_days ?? 0),
      bank_name: supplier.bank_name ?? '',
      bank_account: supplier.bank_account ?? '',
      notes: supplier.notes ?? '',
      is_active: Boolean(supplier.is_active),
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
      code: form.code || null,
      company: form.company || null,
      email: form.email || null,
      phone: form.phone || null,
      tax_number: form.tax_number || null,
      address: form.address || null,
      city: form.city || null,
      state: form.state || null,
      country: form.country || null,
      postal_code: form.postal_code || null,
      payment_terms_days: Number(form.payment_terms_days) || 0,
      bank_name: form.bank_name || null,
      bank_account: form.bank_account || null,
      notes: form.notes || null,
      is_active: Boolean(form.is_active),
    })
  }

  const suppliers = data?.data ?? []
  const meta = data?.meta
  const links = data?.links

  return (
    <div className="space-y-5">
      <PageHeader
        title="Suppliers"
        subtitle={`${meta?.total ?? 0} suppliers in the directory`}
        actions={
          <>
            <Button variant="secondary" onClick={() => refetch()} loading={isFetching}>
              <RefreshCw className="h-4 w-4" /> Refresh
            </Button>
            {can('suppliers.create') && (
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" /> New supplier
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
            placeholder="Search name, company or code…"
            className="w-full sm:w-72"
          />
          <ToolbarSpacer />
          <Select
            className="w-36"
            placeholder="Any status"
            value={filters.is_active}
            options={[
              { value: 1, label: 'Active' },
              { value: 0, label: 'Inactive' },
            ]}
            onChange={(event) => {
              setFilters((state) => ({ ...state, is_active: event.target.value }))
              setPage(1)
            }}
          />
          <Select
            className="w-44"
            placeholder="Default sort"
            value={filters.sort}
            options={SORT_OPTIONS}
            onChange={(event) => {
              setFilters((state) => ({ ...state, sort: event.target.value }))
              setPage(1)
            }}
          />
        </Toolbar>

        {isLoading ? (
          <TableSkeleton rows={8} columns={8} />
        ) : isError ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : suppliers.length === 0 ? (
          <EmptyState
            icon={Factory}
            title="No suppliers found"
            description="Adjust your filters or add the first supplier."
            action={
              can('suppliers.create') ? (
                <Button size="sm" onClick={openCreate}>
                  <Plus className="h-4 w-4" /> New supplier
                </Button>
              ) : null
            }
          />
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Supplier</th>
                  <th>Contact</th>
                  <th>Location</th>
                  <th className="text-right">Payment terms</th>
                  <th className="text-right">Purchase orders</th>
                  <th>Status</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {suppliers.map((supplier) => (
                  <tr key={supplier.id}>
                    <td className="whitespace-nowrap font-mono text-xs font-semibold text-slate-700">{supplier.code || '—'}</td>
                    <td>
                      <p className="font-medium text-slate-800">{supplier.name}</p>
                      {supplier.company && <p className="text-xs text-slate-400">{supplier.company}</p>}
                    </td>
                    <td className="text-sm text-slate-500">
                      <p>{supplier.email || '—'}</p>
                      {supplier.phone && <p className="text-xs text-slate-400">{supplier.phone}</p>}
                    </td>
                    <td className="text-sm text-slate-500">
                      {[supplier.city, supplier.state, supplier.country].filter(Boolean).join(', ') || '—'}
                    </td>
                    <td className="text-right tabular">
                      {Number(supplier.payment_terms_days ?? 0) > 0 ? (
                        <span className="font-medium text-slate-700">{supplier.payment_terms_days} days</span>
                      ) : (
                        <span className="text-xs text-slate-400">Due on receipt</span>
                      )}
                    </td>
                    <td className="text-right tabular">{supplier.purchase_orders_count ?? 0}</td>
                    <td>{supplier.is_active ? <Badge tone="green">Active</Badge> : <Badge>Inactive</Badge>}</td>
                    <td>
                      <Dropdown
                        align="right"
                        trigger={
                          <button type="button" className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        }
                        items={[
                          { label: 'Edit', icon: Pencil, disabled: !can('suppliers.update'), onSelect: () => openEdit(supplier) },
                          {
                            label: 'Delete',
                            icon: Trash2,
                            tone: 'danger',
                            disabled: !can('suppliers.delete'),
                            onSelect: () => setDeleting(supplier),
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
        title={editing ? `Edit ${editing.name}` : 'New supplier'}
        subtitle={editing ? editing.code : 'Add a supplier to the directory'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={closeModal} disabled={saveMutation.isPending}>
              Cancel
            </Button>
            <Button onClick={submit} loading={saveMutation.isPending}>
              {editing ? 'Save changes' : 'Create supplier'}
            </Button>
          </>
        }
      >
        <form className="space-y-4" onSubmit={submit}>
          {formError && <Alert tone="error">{formError}</Alert>}

          <FormGrid>
            <Input
              label="Supplier name"
              required
              value={form.name}
              error={errors.name?.[0]}
              onChange={(event) => setForm((state) => ({ ...state, name: event.target.value }))}
            />
            <Input
              label="Code"
              hint="Leave blank to auto-generate"
              value={form.code}
              error={errors.code?.[0]}
              onChange={(event) => setForm((state) => ({ ...state, code: event.target.value }))}
            />
            <Input
              label="Company"
              value={form.company}
              error={errors.company?.[0]}
              onChange={(event) => setForm((state) => ({ ...state, company: event.target.value }))}
            />
            <Input
              label="Tax number"
              value={form.tax_number}
              error={errors.tax_number?.[0]}
              onChange={(event) => setForm((state) => ({ ...state, tax_number: event.target.value }))}
            />
          </FormGrid>

          <FormGrid>
            <Input
              label="Email"
              type="email"
              value={form.email}
              error={errors.email?.[0]}
              onChange={(event) => setForm((state) => ({ ...state, email: event.target.value }))}
            />
            <Input
              label="Phone"
              value={form.phone}
              error={errors.phone?.[0]}
              onChange={(event) => setForm((state) => ({ ...state, phone: event.target.value }))}
            />
          </FormGrid>

          <Textarea
            label="Address"
            rows={2}
            value={form.address}
            error={errors.address?.[0]}
            onChange={(event) => setForm((state) => ({ ...state, address: event.target.value }))}
          />

          <FormGrid columns={3}>
            <Input
              label="City"
              value={form.city}
              error={errors.city?.[0]}
              onChange={(event) => setForm((state) => ({ ...state, city: event.target.value }))}
            />
            <Input
              label="State"
              value={form.state}
              error={errors.state?.[0]}
              onChange={(event) => setForm((state) => ({ ...state, state: event.target.value }))}
            />
            <Input
              label="Postal code"
              value={form.postal_code}
              error={errors.postal_code?.[0]}
              onChange={(event) => setForm((state) => ({ ...state, postal_code: event.target.value }))}
            />
            <Input
              label="Country"
              value={form.country}
              error={errors.country?.[0]}
              onChange={(event) => setForm((state) => ({ ...state, country: event.target.value }))}
            />
            <Input
              label="Payment terms (days)"
              type="number"
              step="1"
              min="0"
              hint="0 means due on receipt"
              value={form.payment_terms_days}
              error={errors.payment_terms_days?.[0]}
              onChange={(event) => setForm((state) => ({ ...state, payment_terms_days: event.target.value }))}
            />
            <Input
              label="Bank account"
              value={form.bank_account}
              error={errors.bank_account?.[0]}
              onChange={(event) => setForm((state) => ({ ...state, bank_account: event.target.value }))}
            />
            <Input
              label="Bank name"
              value={form.bank_name}
              error={errors.bank_name?.[0]}
              onChange={(event) => setForm((state) => ({ ...state, bank_name: event.target.value }))}
            />
          </FormGrid>

          <Textarea
            label="Notes"
            value={form.notes}
            error={errors.notes?.[0]}
            onChange={(event) => setForm((state) => ({ ...state, notes: event.target.value }))}
          />

          <div className="border-t border-slate-100 pt-3">
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
        title="Delete supplier"
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
          Delete <span className="font-semibold">{deleting?.name}</span>? Suppliers with purchase orders cannot be
          deleted - deactivate them instead.
        </p>
      </Modal>
    </div>
  )
}