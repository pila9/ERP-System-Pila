import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { MoreVertical, Pencil, Plus, RefreshCw, Trash2, Users } from 'lucide-react'
import { del, get, post, put } from '../../lib/api'
import { cleanParams, cn } from '../../lib/utils'
import { formatCurrency } from '../../lib/format'
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
import { SearchInput, Toolbar, ToolbarSpacer } from '../../components/ui/FilterBar'
import { EmptyState, ErrorState, TableSkeleton } from '../../components/ui/Feedback'

const SORT_OPTIONS = [
  { value: 'name:asc', label: 'Name (A-Z)' },
  { value: 'name:desc', label: 'Name (Z-A)' },
  { value: 'code:asc', label: 'Code (A-Z)' },
  { value: 'balance:desc', label: 'Highest balance' },
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
  credit_limit: 0,
  payment_terms_days: 0,
  notes: '',
  is_active: true,
}

export default function Customers() {
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
    queryKey: ['customers', params],
    queryFn: () => get('customers', params).then((response) => response.data),
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['customers'] })
    queryClient.invalidateQueries({ queryKey: ['dashboard'] })
  }

  const saveMutation = useMutation({
    mutationFn: (payload) => (editing ? put(`customers/${editing.id}`, payload) : post('customers', payload)),
    onSuccess: () => {
      invalidate()
      closeModal()
      toast.success(editing ? 'Customer updated.' : 'Customer created.')
    },
    onError: (err) => {
      setErrors(err?.errors || {})
      setFormError(err?.message)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => del(`customers/${id}`),
    onSuccess: () => {
      invalidate()
      setDeleting(null)
      toast.success('Customer deleted.')
    },
    onError: (err) => {
      toast.error(err?.message || 'Unable to delete the customer.')
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

  const openEdit = (customer) => {
    setEditing(customer)
    setForm({
      code: customer.code ?? '',
      name: customer.name ?? '',
      company: customer.company ?? '',
      email: customer.email ?? '',
      phone: customer.phone ?? '',
      tax_number: customer.tax_number ?? '',
      address: customer.address ?? '',
      city: customer.city ?? '',
      state: customer.state ?? '',
      country: customer.country ?? '',
      postal_code: customer.postal_code ?? '',
      credit_limit: Number(customer.credit_limit ?? 0),
      payment_terms_days: Number(customer.payment_terms_days ?? 0),
      notes: customer.notes ?? '',
      is_active: Boolean(customer.is_active),
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
      credit_limit: Number(form.credit_limit) || 0,
      payment_terms_days: Number(form.payment_terms_days) || 0,
      notes: form.notes || null,
      is_active: Boolean(form.is_active),
    })
  }

  const customers = data?.data ?? []
  const meta = data?.meta
  const links = data?.links

  return (
    <div className="space-y-5">
      <PageHeader
        title="Customers"
        subtitle={`${meta?.total ?? 0} customers in the directory`}
        actions={
          <>
            <Button variant="secondary" onClick={() => refetch()} loading={isFetching}>
              <RefreshCw className="h-4 w-4" /> Refresh
            </Button>
            {can('customers.create') && (
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" /> New customer
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
            className="w-48"
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
        ) : customers.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No customers found"
            description="Adjust your filters or add the first customer."
            action={
              can('customers.create') ? (
                <Button size="sm" onClick={openCreate}>
                  <Plus className="h-4 w-4" /> New customer
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
                  <th>Customer</th>
                  <th>Contact</th>
                  <th>Location</th>
                  <th className="text-right">Credit limit</th>
                  <th className="text-right">Outstanding</th>
                  <th>Status</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id}>
                    <td className="whitespace-nowrap font-mono text-xs font-semibold text-slate-700">{customer.code || '—'}</td>
                    <td>
                      <p className="font-medium text-slate-800">{customer.name}</p>
                      {customer.company && <p className="text-xs text-slate-400">{customer.company}</p>}
                    </td>
                    <td className="text-sm text-slate-500">
                      <p>{customer.email || '—'}</p>
                      {customer.phone && <p className="text-xs text-slate-400">{customer.phone}</p>}
                    </td>
                    <td className="text-sm text-slate-500">
                      {[customer.city, customer.state, customer.country].filter(Boolean).join(', ') || '—'}
                    </td>
                    <td className="text-right tabular">{formatCurrency(customer.credit_limit)}</td>
                    <td
                      className={cn(
                        'text-right tabular font-semibold',
                        Number(customer.balance ?? 0) > 0 ? 'text-rose-600' : 'text-slate-600',
                      )}
                    >
                      {formatCurrency(customer.balance ?? 0)}
                    </td>
                    <td>{customer.is_active ? <Badge tone="green">Active</Badge> : <Badge>Inactive</Badge>}</td>
                    <td>
                      <Dropdown
                        align="right"
                        trigger={
                          <button type="button" className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        }
                        items={[
                          { label: 'Edit', icon: Pencil, disabled: !can('customers.update'), onSelect: () => openEdit(customer) },
                          {
                            label: 'Delete',
                            icon: Trash2,
                            tone: 'danger',
                            disabled: !can('customers.delete'),
                            onSelect: () => setDeleting(customer),
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
        title={editing ? `Edit ${editing.name}` : 'New customer'}
        subtitle={editing ? editing.code : 'Add a customer to the directory'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={closeModal} disabled={saveMutation.isPending}>
              Cancel
            </Button>
            <Button onClick={submit} loading={saveMutation.isPending}>
              {editing ? 'Save changes' : 'Create customer'}
            </Button>
          </>
        }
      >
        <form className="space-y-4" onSubmit={submit}>
          {formError && <Alert tone="error">{formError}</Alert>}

          <FormGrid>
            <Input
              label="Customer name"
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
              label="Credit limit"
              type="number"
              step="0.01"
              min="0"
              value={form.credit_limit}
              error={errors.credit_limit?.[0]}
              onChange={(event) => setForm((state) => ({ ...state, credit_limit: event.target.value }))}
            />
            <Input
              label="Payment terms (days)"
              type="number"
              step="1"
              min="0"
              value={form.payment_terms_days}
              error={errors.payment_terms_days?.[0]}
              onChange={(event) => setForm((state) => ({ ...state, payment_terms_days: event.target.value }))}
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
        title="Delete customer"
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
          Delete <span className="font-semibold">{deleting?.name}</span>? Customers with orders or invoices cannot be
          deleted - deactivate them instead.
        </p>
        {deleting?.balance > 0 && (
          <p className="mt-2 text-xs text-slate-500">
            Outstanding balance of {formatCurrency(deleting.balance)} must be cleared first.
          </p>
        )}
      </Modal>
    </div>
  )
}