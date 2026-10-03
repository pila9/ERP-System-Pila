import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Ban, CreditCard, Printer, Send } from 'lucide-react'
import { get, post } from '../../lib/api'
import { cn, todayISO } from '../../lib/utils'
import { formatCurrency, formatDate, formatNumber } from '../../lib/format'
import { PAYMENT_METHODS, label as statusLabel } from '../../lib/status'
import { usePermission } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { PageHeader } from '../../components/ui/DataDisplay'
import { Card } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Alert from '../../components/ui/Alert'
import { StatusBadge } from '../../components/ui/Badge'
import { FormGrid, Input, Select, Textarea } from '../../components/ui/Form'
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/Feedback'

const METHOD_OPTIONS = PAYMENT_METHODS.map((method) => ({ value: method, label: statusLabel('payment_method', method) }))

const canPay = (invoice) => !['draft', 'cancelled', 'paid'].includes(invoice.status) && Number(invoice.balance_due) > 0
const canSend = (invoice) => invoice.status === 'draft'
const canCancel = (invoice) => !['cancelled', 'paid'].includes(invoice.status)

function TotalsBlock({ subtotal, discount, tax, shipping, grandTotal, extra = [] }) {
  return (
    <dl className="ml-auto w-full max-w-xs space-y-1.5 text-sm">
      <div className="flex items-center justify-between gap-4">
        <dt className="text-slate-500">Subtotal</dt>
        <dd className="tabular font-medium text-slate-700">{formatCurrency(subtotal)}</dd>
      </div>
      {discount > 0 && (
        <div className="flex items-center justify-between gap-4">
          <dt className="text-slate-500">Discount</dt>
          <dd className="tabular font-medium text-emerald-600">-{formatCurrency(discount)}</dd>
        </div>
      )}
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
      {extra.map((row) => (
        <div key={row.label} className="flex items-center justify-between gap-4">
          <dt className="text-slate-500">{row.label}</dt>
          <dd className={cn('tabular font-semibold', row.tone ?? 'text-slate-700')}>{row.value}</dd>
        </div>
      ))}
    </dl>
  )
}

export default function InvoiceDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const toast = useToast()
  const can = usePermission()

  const [paying, setPaying] = useState(false)
  const [payment, setPayment] = useState({ amount: '', method: 'cash', paid_at: todayISO(), reference: '', note: '' })
  const [paymentErrors, setPaymentErrors] = useState({})
  const [paymentError, setPaymentError] = useState(null)
  const [cancelling, setCancelling] = useState(false)

  const { data: invoice, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['invoices', 'detail', id],
    queryFn: () => get(`invoices/${id}`).then((response) => response.data),
    enabled: Boolean(id),
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['invoices'] })
    queryClient.invalidateQueries({ queryKey: ['sales-orders'] })
    queryClient.invalidateQueries({ queryKey: ['payments'] })
    queryClient.invalidateQueries({ queryKey: ['dashboard'] })
  }

  const sendMutation = useMutation({
    mutationFn: () => post(`invoices/${id}/send`),
    onSuccess: (response) => {
      invalidate()
      toast.success(response?.data?.message || 'Invoice sent.')
    },
    onError: (err) => toast.error(err?.message || 'Unable to send the invoice.'),
  })

  const cancelMutation = useMutation({
    mutationFn: () => post(`invoices/${id}/cancel`),
    onSuccess: (response) => {
      invalidate()
      setCancelling(false)
      toast.success(response?.data?.message || 'Invoice cancelled.')
    },
    onError: (err) => {
      toast.error(err?.message || 'Unable to cancel the invoice.')
      setCancelling(false)
    },
  })

  const paymentMutation = useMutation({
    mutationFn: (payload) => post(`invoices/${id}/payments`, payload),
    onSuccess: (response) => {
      invalidate()
      setPaying(false)
      setPaymentErrors({})
      setPaymentError(null)
      toast.success(response?.data?.message || 'Payment recorded.')
    },
    onError: (err) => {
      setPaymentErrors(err?.errors || {})
      setPaymentError(err?.message || 'Unable to record the payment.')
    },
  })

  const openPayment = () => {
    setPayment({
      amount: Number(invoice.balance_due ?? 0).toFixed(2),
      method: 'cash',
      paid_at: todayISO(),
      reference: '',
      note: '',
    })
    setPaymentErrors({})
    setPaymentError(null)
    setPaying(true)
  }

  const submitPayment = () => {
    const amount = Number(payment.amount)

    if (!Number.isFinite(amount) || amount <= 0) {
      setPaymentError('Enter a payment amount greater than zero.')
      return
    }

    if (amount > Number(invoice.balance_due ?? 0)) {
      setPaymentError(`Amount cannot exceed the balance due of ${formatCurrency(invoice.balance_due)}.`)
      return
    }

    setPaymentError(null)
    setPaymentErrors({})

    paymentMutation.mutate({
      amount,
      method: payment.method,
      paid_at: payment.paid_at || todayISO(),
      reference: payment.reference || null,
      note: payment.note || null,
    })
  }

  if (isLoading) return <LoadingState label="Loading invoice…" />
  if (isError) return <ErrorState error={error} onRetry={refetch} />
  if (!invoice) return <EmptyState title="Invoice not found" description="The invoice may have been deleted." />

  const customer = invoice.customer ?? {}
  const items = invoice.items ?? []
  const payments = invoice.payments ?? []
  const overdue = Number(invoice.days_overdue ?? 0) > 0

  return (
    <div className="space-y-5">
      <div className="no-print space-y-5">
        <PageHeader
          title={invoice.number}
          subtitle={`${customer.name ?? 'Customer'} · issued ${formatDate(invoice.invoice_date)}`}
          actions={
            <>
              <Button variant="secondary" onClick={() => navigate('/invoices')}>
                <ArrowLeft className="h-4 w-4" /> Back to invoices
              </Button>
              {can('invoices.payment') && canPay(invoice) && (
                <Button onClick={openPayment}>
                  <CreditCard className="h-4 w-4" /> Record payment
                </Button>
              )}
              {can('invoices.send') && canSend(invoice) && (
                <Button
                  variant="secondary"
                  loading={sendMutation.isPending}
                  onClick={() => sendMutation.mutate()}
                >
                  <Send className="h-4 w-4" /> Send
                </Button>
              )}
              {can('invoices.update') && canCancel(invoice) && (
                <Button variant="secondary" onClick={() => setCancelling(true)}>
                  <Ban className="h-4 w-4" /> Cancel
                </Button>
              )}
              <Button variant="secondary" onClick={() => window.print()}>
                <Printer className="h-4 w-4" /> Print
              </Button>
            </>
          }
        />
      </div>

      <div className="print-area">
        <Card className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-6 border-b border-slate-200 pb-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Invoice</p>
              <h2 className="mt-1 font-mono text-2xl font-bold text-slate-900">{invoice.number}</h2>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <StatusBadge group="invoice_status" value={invoice.status} />
                {overdue && (
                  <span className="inline-flex items-center rounded-full bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700 ring-1 ring-inset ring-rose-200">
                    {invoice.days_overdue} day{invoice.days_overdue === 1 ? '' : 's'} overdue
                  </span>
                )}
              </div>
            </div>

            <div className="grid gap-1 text-right text-sm">
              <p className="text-slate-500">
                Invoice date <span className="font-semibold text-slate-800">{formatDate(invoice.invoice_date)}</span>
              </p>
              <p className="text-slate-500">
                Due date <span className="font-semibold text-slate-800">{formatDate(invoice.due_date)}</span>
              </p>
              {invoice.sales_order && (
                <p className="text-slate-500">
                  Sales order{' '}
                  <span className="font-mono font-semibold text-slate-800">{invoice.sales_order.number}</span>
                </p>
              )}
              {invoice.reference && <p className="text-slate-500">Ref: {invoice.reference}</p>}
            </div>
          </div>

          <div className="grid gap-6 border-b border-slate-200 py-5 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Bill to</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{customer.name}</p>
              {customer.company && <p className="text-sm text-slate-600">{customer.company}</p>}
              <p className="mt-1 text-sm text-slate-600">
                {[customer.address, customer.city, customer.country].filter(Boolean).join(', ') || '—'}
              </p>
              {customer.tax_number && <p className="text-xs text-slate-500">Tax no: {customer.tax_number}</p>}
            </div>
          </div>

          <div className="table-wrapper py-5">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Description</th>
                  <th className="text-right">Qty</th>
                  <th className="text-right">Unit price</th>
                  <th className="text-right">Discount</th>
                  <th className="text-right">Tax</th>
                  <th className="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="font-medium text-slate-800">{item.product?.name ?? '—'}</td>
                    <td className="text-sm text-slate-500">{item.description || '—'}</td>
                    <td className="text-right tabular">{formatNumber(item.quantity)}</td>
                    <td className="text-right tabular">{formatCurrency(item.unit_price)}</td>
                    <td className="text-right tabular">{formatCurrency(item.discount)}</td>
                    <td className="text-right tabular">{formatCurrency(item.tax_amount)}</td>
                    <td className="text-right tabular font-semibold text-slate-800">{formatCurrency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border-t border-slate-200 pt-5">
            <TotalsBlock
              subtotal={invoice.subtotal}
              discount={invoice.discount_amount}
              tax={invoice.tax_total}
              shipping={invoice.shipping}
              grandTotal={invoice.grand_total}
              extra={[
                { label: 'Paid', value: formatCurrency(invoice.paid_amount), tone: 'text-emerald-600' },
                {
                  label: 'Balance due',
                  value: formatCurrency(invoice.balance_due),
                  tone: Number(invoice.balance_due) > 0 ? 'text-rose-600' : 'text-emerald-600',
                },
              ]}
            />
          </div>

          <div className="mt-6 border-t border-slate-200 pt-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Payments</p>
            {payments.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">No payments recorded against this invoice yet.</p>
            ) : (
              <div className="table-wrapper mt-2">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Number</th>
                      <th>Date</th>
                      <th>Method</th>
                      <th>Reference</th>
                      <th className="text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((entry) => (
                      <tr key={entry.id}>
                        <td className="font-mono text-xs font-semibold text-slate-700">{entry.number}</td>
                        <td className="whitespace-nowrap text-sm text-slate-500">{formatDate(entry.paid_at)}</td>
                        <td className="text-sm text-slate-600">
                          {statusLabel('payment_method', entry.method)}
                        </td>
                        <td className="text-sm text-slate-500">{entry.reference || '—'}</td>
                        <td className="text-right tabular font-semibold text-slate-800">
                          {formatCurrency(entry.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {(invoice.terms || invoice.notes) && (
            <div className="mt-6 border-t border-slate-200 pt-5 text-sm">
              {invoice.terms && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Terms</p>
                  <p className="mt-1 whitespace-pre-line text-slate-600">{invoice.terms}</p>
                </div>
              )}
              {invoice.notes && (
                <div className={invoice.terms ? 'mt-4' : undefined}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Notes</p>
                  <p className="mt-1 whitespace-pre-line text-slate-600">{invoice.notes}</p>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>

      <Modal
        open={paying}
        onClose={() => setPaying(false)}
        title="Record payment"
        subtitle={`${invoice.number} · balance due ${formatCurrency(invoice.balance_due)}`}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setPaying(false)}>
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
              hint={`Maximum ${formatCurrency(invoice.balance_due)}`}
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
        open={cancelling}
        onClose={() => setCancelling(false)}
        title="Cancel invoice"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCancelling(false)}>
              Keep invoice
            </Button>
            <Button variant="danger" loading={cancelMutation.isPending} onClick={() => cancelMutation.mutate()}>
              Cancel invoice
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          Cancel invoice <span className="font-mono font-semibold">{invoice.number}</span>? Invoices with recorded
          payments cannot be cancelled.
        </p>
      </Modal>
    </div>
  )
}