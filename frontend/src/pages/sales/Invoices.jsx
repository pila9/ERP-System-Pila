import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  Ban,
  CreditCard,
  Eye,
  MoreVertical,
  Plus,
  RefreshCw,
  Receipt,
  Send,
  Trash2,
  X,
} from 'lucide-react'
import { del, get, post } from '../../lib/api'
import { cleanParams, cn, isoDay, todayISO } from '../../lib/utils'
import { formatCurrency, formatDate } from '../../lib/format'
import { INVOICE_STATUSES, PAYMENT_METHODS, label as statusLabel } from '../../lib/status'
import { usePermission } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { PageHeader } from '../../components/ui/DataDisplay'
import { Card } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Alert from '../../components/ui/Alert'
import Dropdown from '../../components/ui/Dropdown'
import Pagination from '../../components/ui/Pagination'
import { StatusBadge } from '../../components/ui/Badge'
import { FormGrid, Input, Select, Textarea } from '../../components/ui/Form'
import { SearchInput, Toolbar, ToolbarSpacer } from '../../components/ui/FilterBar'
import { EmptyState, ErrorState, TableSkeleton } from '../../components/ui/Feedback'

const STATUS_OPTIONS = INVOICE_STATUSES.map((status) => ({ value: status, label: statusLabel('invoice_status', status) }))
const METHOD_OPTIONS = PAYMENT_METHODS.map((method) => ({ value: method, label: statusLabel('payment_method', method) }))

const canPay = (invoice) => !['draft', 'cancelled', 'paid'].includes(invoice.status) && Number(invoice.balance_due) > 0
const canSend = (invoice) => invoice.status === 'draft'
const canCancel = (invoice) => !['cancelled', 'paid'].includes(invoice.status)

const EMPTY_LINE = { product_id: '', description: '', quantity: 1, unit_price: 0, tax_rate: 0 }

const emptyInvoiceForm = () => ({
  customer_id: '',
  invoice_date: todayISO(),
  due_date: isoDay(30),
  status: 'draft',
  shipping: 0,
  notes: '',
  items: [{ ...EMPTY_LINE }],
})

const emptyPaymentForm = () => ({ amount: '', method: 'cash', paid_at: todayISO(), reference: '', note: '' })

function lineTotals(line) {
  const quantity = Number(line.quantity) || 0
  const unitPrice = Number(line.unit_price) || 0
  const taxRate = Number(line.tax_rate) || 0
  const subtotal = quantity * unitPrice
  const tax = (subtotal * taxRate) / 100

  return { subtotal, tax, total: subtotal + tax }
}

function invoiceTotals(items, shipping) {
  const lines = items.map(lineTotals)
  const subtotal = lines.reduce((sum, line) => sum + line.subtotal, 0)
  const taxTotal = lines.reduce((sum, line) => sum + line.tax, 0)
  const shippingAmount = Number(shipping) || 0

  return { subtotal, taxTotal, shipping: shippingAmount, grandTotal: subtotal + taxTotal + shippingAmount }
}

function TotalsBlock({ subtotal, tax, shipping, grandTotal }) {
  return (
    <dl className="ml-auto w-full max-w-xs space-y-1.5 text-sm">
      <div className="flex items-center justify-between gap-4">
        <dt className="text-slate-500">Subtotal</dt>
        <dd className="tabular font-medium text-slate-700">{formatCurrency(subtotal)}</dd>
      </div>
      <div className="flex items-center justify-between gap-4">
        <dt className="text-slate-500">Tax</dt>
        <dd className="tabular font-medium text-slate-700">{formatCurrency(tax)}</dd>
      </div>
      {shipping > 0 && (
        <div className="flex items-center justify-between gap-4">
          <dt className="text-slate-500">Shipping</dt>
          <dd className="tabular font-medium text-slate-700">{formatCurrency(shipping)}</dd>
        </div>
      )}
      <div className="flex items-center justify-between gap-4 border-t border-slate-200 pt-2">
        <dt className="text-base font-semibold text-slate-900">Grand total</dt>
        <dd className="tabular text-base font-bold text-slate-900">{formatCurrency(grandTotal)}</dd>
      </div>
    </dl>
  )
}

export default function Invoices() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const toast = useToast()
  const can = usePermission()

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({
    status: '',
    customer_id: '',
    outstanding: '',
    from: '',
    to: '',
  })
  const [paying, setPaying] = useState(null)
  const [payment, setPayment] = useState(emptyPaymentForm)
  const [paymentErrors, setPaymentErrors] = useState({})
  const [paymentError, setPaymentError] = useState(null)
  const [cancelling, setCancelling] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [invoiceForm, setInvoiceForm] = useState(emptyInvoiceForm)
  const [invoiceErrors, setInvoiceErrors] = useState({})
  const [invoiceError, setInvoiceError] = useState(null)
  const [lineError, setLineError] = useState(null)

  const params = useMemo(
    () => cleanParams({ page, search, ...filters, per_page: 15 }),
    [page, search, filters],
  )

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['invoices', params],
    queryFn: () => get('invoices', params).then((response) => response.data),
  })

  const { data: customersData } = useQuery({
    queryKey: ['customers', 'all'],
    queryFn: () => get('customers', { per_page: 100, is_active: 1 }).then((response) => response.data.data),
  })

  const { data: productsData } = useQuery({
    queryKey: ['products', 'all'],
    queryFn: () => get('products', { per_page: 100, is_active: 1 }).then((response) => response.data.data),
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['invoices'] })
    queryClient.invalidateQueries({ queryKey: ['sales-orders'] })
    queryClient.invalidateQueries({ queryKey: ['payments'] })
    queryClient.invalidateQueries({ queryKey: ['dashboard'] })
  }

  const sendMutation = useMutation({
    mutationFn: (invoice) => post(`invoices/${invoice.id}/send`),
    onSuccess: (response) => {
      invalidate()
      toast.success(response?.data?.message || 'Invoice sent.')
    },
    onError: (err) => toast.error(err?.message || 'Unable to send the invoice.'),
  })

  const paymentMutation = useMutation({
    mutationFn: ({ invoiceId, payload }) => post(`invoices/${invoiceId}/payments`, payload),
    onSuccess: (response) => {
      invalidate()
      setPaying(null)
      setPayment(emptyPaymentForm())
      setPaymentErrors({})
      setPaymentError(null)
      toast.success(response?.data?.message || 'Payment recorded.')
    },
    onError: (err) => {
      setPaymentErrors(err?.errors || {})
      setPaymentError(err?.message || 'Unable to record the payment.')
    },
  })

  const cancelMutation = useMutation({
    mutationFn: (invoice) => post(`invoices/${invoice.id}/cancel`),
    onSuccess: (response) => {
      invalidate()
      setCancelling(null)
      toast.success(response?.data?.message || 'Invoice cancelled.')
    },
    onError: (err) => {
      toast.error(err?.message || 'Unable to cancel the invoice.')
      setCancelling(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (invoice) => del(`invoices/${invoice.id}`),
    onSuccess: (response) => {
      invalidate()
      setDeleting(null)
      toast.success(response?.data?.message || 'Invoice deleted.')
    },
    onError: (err) => {
      toast.error(err?.message || 'Unable to delete the invoice.')
      setDeleting(null)
    },
  })

  const createMutation = useMutation({
    mutationFn: (payload) => post('invoices', payload),
    onSuccess: (response) => {
      invalidate()
      setCreateOpen(false)
      setInvoiceForm(emptyInvoiceForm())
      setInvoiceErrors({})
      setInvoiceError(null)
      toast.success(response?.data?.message || 'Invoice created.')
    },
    onError: (err) => {
      setInvoiceErrors(err?.errors || {})
      setInvoiceError(err?.message || 'Unable to create the invoice.')
    },
  })

  const openCreate = () => {
    setInvoiceForm(emptyInvoiceForm())
    setInvoiceErrors({})
    setInvoiceError(null)
    setLineError(null)
    setCreateOpen(true)
  }

  const openPayment = (invoice) => {
    setPaying(invoice)
    setPayment({ ...emptyPaymentForm(), amount: Number(invoice.balance_due ?? 0).toFixed(2) })
    setPaymentErrors({})
    setPaymentError(null)
  }

  const submitPayment = () => {
    const amount = Number(payment.amount)

    if (!Number.isFinite(amount) || amount <= 0) {
      setPaymentError('Enter a payment amount greater than zero.')
      return
    }

    if (amount > Number(paying.balance_due ?? 0)) {
      setPaymentError(`Amount cannot exceed the balance due of ${formatCurrency(paying.balance_due)}.`)
      return
    }

    setPaymentError(null)
    setPaymentErrors({})

    paymentMutation.mutate({
      invoiceId: paying.id,
      payload: {
        amount,
        method: payment.method,
        paid_at: payment.paid_at || todayISO(),
        reference: payment.reference || null,
        note: payment.note || null,
      },
    })
  }

  const submitInvoice = () => {
    const invalid = invoiceForm.items.some((line) => !(Number(line.quantity) > 0))

    if (invalid) {
      setLineError('Every line needs a quantity greater than zero.')
      return
    }

    setLineError(null)
    setInvoiceError(null)
    setInvoiceErrors({})

    createMutation.mutate({
      customer_id: Number(invoiceForm.customer_id) || null,
      invoice_date: invoiceForm.invoice_date || todayISO(),
      due_date: invoiceForm.due_date || null,
      status: invoiceForm.status,
      shipping: Number(invoiceForm.shipping) || 0,
      notes: invoiceForm.notes || null,
      items: invoiceForm.items.map((line) => ({
        product_id: line.product_id ? Number(line.product_id) : null,
        description: line.product_id ? null : line.description || 'Item',
        quantity: Number(line.quantity),
        unit_price: Number(line.unit_price) || 0,
        tax_rate: Number(line.tax_rate) || 0,
      })),
    })
  }

  const invoices = data?.data ?? []
  const meta = data?.meta
  const links = data?.links

  const customerOptions = (customersData ?? []).map((customer) => ({ value: customer.id, label: customer.name }))
  const productOptions = (productsData ?? []).map((product) => ({
    value: product.id,
    label: `${product.code} · ${product.name}`,
  }))

  const createTotals = invoiceTotals(invoiceForm.items, invoiceForm.shipping)

  const setInvoiceField = (field, value) => setInvoiceForm((state) => ({ ...state, [field]: value }))

  const setInvoiceItem = (index, patch) =>
    setInvoiceForm((state) => ({
      ...state,
      items: state.items.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)),
    }))

  const selectProduct = (index, productId) => {
    const product = (productsData ?? []).find((entry) => String(entry.id) === String(productId))

    setInvoiceItem(index, {
      product_id: productId,
      unit_price: product ? Number(product.sale_price ?? 0) : 0,
      tax_rate: product ? Number(product.tax_rate ?? 0) : 0,
    })
  }

  const rowActions = (invoice) =>
    [
      { label: 'View', icon: Eye, onSelect: () => navigate(`/invoices/${invoice.id}`) },
      canPay(invoice) && {
        label: 'Record payment',
        icon: CreditCard,
        disabled: !can('invoices.payment'),
        onSelect: () => openPayment(invoice),
      },
      canSend(invoice) && {
        label: 'Send',
        icon: Send,
        disabled: !can('invoices.send'),
        onSelect: () => sendMutation.mutate(invoice),
      },
      canCancel(invoice) && {
        label: 'Cancel invoice',
        icon: Ban,
        tone: 'danger',
        disabled: !can('invoices.update'),
        onSelect: () => setCancelling(invoice),
      },
      invoice.status === 'draft' && {
        label: 'Delete',
        icon: Trash2,
        tone: 'danger',
        disabled: !can('invoices.delete'),
        onSelect: () => setDeleting(invoice),
      },
    ].filter(Boolean)

  return (
    <div className="space-y-5">
      <PageHeader
        title="Invoices"
        subtitle={`${meta?.total ?? 0} invoices`}
        actions={
          <>
            <Button variant="secondary" onClick={() => refetch()} loading={isFetching}>
              <RefreshCw className="h-4 w-4" /> Refresh
            </Button>
            {can('invoices.create') && (
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" /> New invoice
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
            placeholder="Search number or reference…"
            className="w-full sm:w-72"
          />
          <ToolbarSpacer />
          <Select
            className="w-44"
            placeholder="All customers"
            value={filters.customer_id}
            options={customerOptions}
            onChange={(event) => {
              setFilters((state) => ({ ...state, customer_id: event.target.value }))
              setPage(1)
            }}
          />
          <Select
            className="w-44"
            placeholder="Any status"
            value={filters.status}
            options={STATUS_OPTIONS}
            onChange={(event) => {
              setFilters((state) => ({ ...state, status: event.target.value }))
              setPage(1)
            }}
          />
          <Select
            className="w-40"
            placeholder="All invoices"
            value={filters.outstanding}
            options={[{ value: 1, label: 'Outstanding only' }]}
            onChange={(event) => {
              setFilters((state) => ({ ...state, outstanding: event.target.value }))
              setPage(1)
            }}
          />
          <Input
            className="w-40"
            type="date"
            value={filters.from}
            onChange={(event) => {
              setFilters((state) => ({ ...state, from: event.target.value }))
              setPage(1)
            }}
          />
          <Input
            className="w-40"
            type="date"
            value={filters.to}
            onChange={(event) => {
              setFilters((state) => ({ ...state, to: event.target.value }))
              setPage(1)
            }}
          />
        </Toolbar>

        {isLoading ? (
          <TableSkeleton rows={8} columns={7} />
        ) : isError ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : invoices.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No invoices found"
            description="Adjust your filters or create a standalone invoice."
            action={
              can('invoices.create') ? (
                <Button size="sm" onClick={openCreate}>
                  <Plus className="h-4 w-4" /> New invoice
                </Button>
              ) : null
            }
          />
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Number</th>
                  <th>Customer</th>
                  <th>Invoice date</th>
                  <th>Due date</th>
                  <th className="text-right">Grand total</th>
                  <th className="text-right">Paid</th>
                  <th className="text-right">Balance due</th>
                  <th>Status</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td>
                      <p className="whitespace-nowrap font-mono text-xs font-semibold text-slate-700">{invoice.number}</p>
                      {invoice.sales_order && (
                        <p className="text-[11px] text-slate-400">{invoice.sales_order.number}</p>
                      )}
                    </td>
                    <td className="font-medium text-slate-800">{invoice.customer?.name ?? '—'}</td>
                    <td className="whitespace-nowrap text-sm text-slate-500">{formatDate(invoice.invoice_date)}</td>
                    <td className="whitespace-nowrap text-sm text-slate-500">{formatDate(invoice.due_date)}</td>
                    <td className="text-right tabular font-semibold text-slate-800">
                      {formatCurrency(invoice.grand_total)}
                    </td>
                    <td className="text-right tabular text-slate-600">{formatCurrency(invoice.paid_amount)}</td>
                    <td
                      className={cn(
                        'text-right tabular font-semibold',
                        Number(invoice.balance_due) > 0 ? 'text-rose-600' : 'text-emerald-600',
                      )}
                    >
                      {formatCurrency(invoice.balance_due)}
                    </td>
                    <td>
                      <StatusBadge group="invoice_status" value={invoice.status} />
                    </td>
                    <td>
                      <Dropdown
                        align="right"
                        trigger={
                          <button
                            type="button"
                            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        }
                        items={rowActions(invoice)}
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
        open={Boolean(paying)}
        onClose={() => setPaying(null)}
        title="Record payment"
        subtitle={paying ? `${paying.number} · balance due ${formatCurrency(paying.balance_due)}` : undefined}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setPaying(null)}>
              Cancel
            </Button>
            <Button loading={paymentMutation.isPending} onClick={submitPayment}>
              Record payment
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {(paymentError || paymentErrors.amount?.[0]) && (
            <Alert tone="error">{paymentError || paymentErrors.amount[0]}</Alert>
          )}

          <FormGrid>
            <Input
              label="Amount"
              required
              type="number"
              step="0.01"
              min="0"
              hint={`Maximum ${formatCurrency(paying?.balance_due ?? 0)}`}
              value={payment.amount}
              error={paymentErrors.amount?.[0]}
              onChange={(event) => setPayment((state) => ({ ...state, amount: event.target.value }))}
            />
            <Select
              label="Method"
              options={METHOD_OPTIONS}
              value={payment.method}
              error={paymentErrors.method?.[0]}
              onChange={(event) => setPayment((state) => ({ ...state, method: event.target.value }))}
            />
            <Input
              label="Paid at"
              type="date"
              value={payment.paid_at}
              error={paymentErrors.paid_at?.[0]}
              onChange={(event) => setPayment((state) => ({ ...state, paid_at: event.target.value }))}
            />
            <Input
              label="Reference"
              value={payment.reference}
              error={paymentErrors.reference?.[0]}
              onChange={(event) => setPayment((state) => ({ ...state, reference: event.target.value }))}
            />
          </FormGrid>

          <Textarea
            label="Note"
            rows={2}
            value={payment.note}
            error={paymentErrors.note?.[0]}
            onChange={(event) => setPayment((state) => ({ ...state, note: event.target.value }))}
          />
        </div>
      </Modal>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="New invoice"
        subtitle="Standalone invoice not linked to a sales order"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)} disabled={createMutation.isPending}>
              Cancel
            </Button>
            <Button loading={createMutation.isPending} onClick={submitInvoice}>
              Create invoice
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {(invoiceError || lineError || Array.isArray(invoiceErrors.items)) && (
            <Alert tone="error">{invoiceError || lineError || invoiceErrors.items?.[0]}</Alert>
          )}

          <FormGrid columns={3}>
            <Select
              label="Customer"
              required
              placeholder="Select customer"
              options={customerOptions}
              value={invoiceForm.customer_id}
              error={invoiceErrors.customer_id?.[0]}
              onChange={(event) => setInvoiceField('customer_id', event.target.value)}
            />
            <Input
              label="Invoice date"
              type="date"
              value={invoiceForm.invoice_date}
              error={invoiceErrors.invoice_date?.[0]}
              onChange={(event) => setInvoiceField('invoice_date', event.target.value)}
            />
            <Input
              label="Due date"
              type="date"
              value={invoiceForm.due_date}
              error={invoiceErrors.due_date?.[0]}
              onChange={(event) => setInvoiceField('due_date', event.target.value)}
            />
          </FormGrid>

          <div className="table-wrapper rounded-lg border border-slate-200">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="min-w-[14rem]">Product</th>
                  <th className="min-w-[10rem]">Description</th>
                  <th className="w-24 text-right">Qty</th>
                  <th className="w-32 text-right">Price</th>
                  <th className="w-24 text-right">Tax %</th>
                  <th className="w-32 text-right">Total</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {invoiceForm.items.map((line, index) => {
                  const lineSum = lineTotals(line)

                  return (
                    <tr key={index}>
                      <td>
                        <Select
                          aria-label="Product"
                          placeholder="Optional"
                          options={productOptions}
                          value={line.product_id}
                          onChange={(event) => selectProduct(index, event.target.value)}
                        />
                      </td>
                      <td>
                        <Input
                          aria-label="Description"
                          value={line.description}
                          onChange={(event) => setInvoiceItem(index, { description: event.target.value })}
                        />
                      </td>
                      <td>
                        <Input
                          aria-label="Quantity"
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={line.quantity}
                          onChange={(event) => setInvoiceItem(index, { quantity: event.target.value })}
                        />
                      </td>
                      <td>
                        <Input
                          aria-label="Unit price"
                          type="number"
                          step="0.01"
                          min="0"
                          value={line.unit_price}
                          onChange={(event) => setInvoiceItem(index, { unit_price: event.target.value })}
                        />
                      </td>
                      <td>
                        <Input
                          aria-label="Tax rate"
                          type="number"
                          step="0.01"
                          min="0"
                          value={line.tax_rate}
                          onChange={(event) => setInvoiceItem(index, { tax_rate: event.target.value })}
                        />
                      </td>
                      <td className="text-right">
                        <p className="tabular font-semibold text-slate-800">{formatCurrency(lineSum.total)}</p>
                        <p className="tabular text-[11px] text-slate-400">tax {formatCurrency(lineSum.tax)}</p>
                      </td>
                      <td>
                        <button
                          type="button"
                          onClick={() =>
                            setInvoiceForm((state) => ({
                              ...state,
                              items:
                                state.items.length === 1
                                  ? [{ ...EMPTY_LINE }]
                                  : state.items.filter((_, itemIndex) => itemIndex !== index),
                            }))
                          }
                          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                          aria-label="Remove line"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <Select
                label="Status"
                options={[
                  { value: 'draft', label: 'Draft' },
                  { value: 'sent', label: 'Sent' },
                ]}
                value={invoiceForm.status}
                error={invoiceErrors.status?.[0]}
                onChange={(event) => setInvoiceField('status', event.target.value)}
              />
              <Input
                label="Shipping"
                type="number"
                step="0.01"
                min="0"
                value={invoiceForm.shipping}
                error={invoiceErrors.shipping?.[0]}
                onChange={(event) => setInvoiceField('shipping', event.target.value)}
              />
              <Textarea
                label="Notes"
                rows={2}
                value={invoiceForm.notes}
                error={invoiceErrors.notes?.[0]}
                onChange={(event) => setInvoiceField('notes', event.target.value)}
              />
            </div>
            <TotalsBlock
              subtotal={createTotals.subtotal}
              tax={createTotals.taxTotal}
              shipping={createTotals.shipping}
              grandTotal={createTotals.grandTotal}
            />
          </div>

          <div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setInvoiceForm((state) => ({ ...state, items: [...state.items, { ...EMPTY_LINE }] }))}
            >
              <Plus className="h-4 w-4" /> Add line
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={Boolean(cancelling)}
        onClose={() => setCancelling(null)}
        title="Cancel invoice"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCancelling(null)}>
              Keep invoice
            </Button>
            <Button variant="danger" loading={cancelMutation.isPending} onClick={() => cancelMutation.mutate(cancelling)}>
              Cancel invoice
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          Cancel <span className="font-mono font-semibold">{cancelling?.number}</span>? Invoices with recorded payments
          cannot be cancelled.
        </p>
      </Modal>

      <Modal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Delete invoice"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleting(null)}>
              Keep invoice
            </Button>
            <Button variant="danger" loading={deleteMutation.isPending} onClick={() => deleteMutation.mutate(deleting)}>
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          Delete draft invoice <span className="font-mono font-semibold">{deleting?.number}</span>? This cannot be
          undone.
        </p>
      </Modal>
    </div>
  )
}