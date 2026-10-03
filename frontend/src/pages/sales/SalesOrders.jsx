import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  Ban,
  CheckCircle2,
  Eye,
  FileText,
  MoreVertical,
  PackageCheck,
  Pencil,
  Plus,
  RefreshCw,
  ShoppingCart,
  Trash2,
  Truck,
} from 'lucide-react'
import { del, get, post } from '../../lib/api'
import { cleanParams, cn } from '../../lib/utils'
import { formatCurrency, formatDate, formatNumber } from '../../lib/format'
import { SALES_ORDER_STATUSES, label as statusLabel } from '../../lib/status'
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
import { Input, Select } from '../../components/ui/Form'
import { SearchInput, Toolbar, ToolbarSpacer } from '../../components/ui/FilterBar'
import { EmptyState, ErrorState, TableSkeleton } from '../../components/ui/Feedback'

const STATUS_OPTIONS = SALES_ORDER_STATUSES.map((status) => ({ value: status, label: statusLabel('order_status', status) }))

const canInvoice = (order) => ['confirmed', 'shipped'].includes(order.status) && !order.invoice
const canShip = (order) => order.status === 'confirmed'
const canComplete = (order) => ['shipped', 'invoiced'].includes(order.status)
const canCancel = (order) => !['cancelled', 'completed'].includes(order.status)

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

export default function SalesOrders() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const toast = useToast()
  const can = usePermission()

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({ status: '', customer_id: '', warehouse_id: '', from: '', to: '' })
  const [detailId, setDetailId] = useState(null)
  const [actionError, setActionError] = useState(null)
  const [cancelling, setCancelling] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const params = useMemo(
    () => cleanParams({ page, search, ...filters, per_page: 15 }),
    [page, search, filters],
  )

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['sales-orders', params],
    queryFn: () => get('sales-orders', params).then((response) => response.data),
  })

  const { data: customersData } = useQuery({
    queryKey: ['customers', 'all'],
    queryFn: () => get('customers', { per_page: 100, is_active: 1 }).then((response) => response.data.data),
  })

  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses', 'all'],
    queryFn: () => get('warehouses', { per_page: 100, is_active: 1 }).then((response) => response.data.data),
  })

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ['sales-orders', 'detail', detailId],
    queryFn: () => get(`sales-orders/${detailId}`).then((response) => response.data),
    enabled: Boolean(detailId),
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['sales-orders'] })
    queryClient.invalidateQueries({ queryKey: ['invoices'] })
    queryClient.invalidateQueries({ queryKey: ['stock'] })
    queryClient.invalidateQueries({ queryKey: ['dashboard'] })
  }

  const handleError = (fallback) => (err) => {
    const message = err?.message || fallback
    toast.error(message)
    setActionError(message)
  }

  const confirmMutation = useMutation({
    mutationFn: (order) => post(`sales-orders/${order.id}/confirm`),
    onSuccess: (response) => {
      invalidate()
      setActionError(null)
      toast.success(response?.data?.message || 'Order confirmed and stock reserved.')
    },
    onError: handleError('Unable to confirm the order.'),
  })

  const shipMutation = useMutation({
    mutationFn: (order) => post(`sales-orders/${order.id}/ship`),
    onSuccess: (response) => {
      invalidate()
      setActionError(null)
      toast.success(response?.data?.message || 'Order shipped.')
    },
    onError: handleError('Unable to ship the order.'),
  })

  const invoiceMutation = useMutation({
    mutationFn: (order) => post(`sales-orders/${order.id}/invoice`),
    onSuccess: (response) => {
      invalidate()
      setActionError(null)
      toast.success(response?.data?.message || 'Invoice created.')
      const invoiceId = response?.data?.data?.id ?? response?.data?.id
      if (invoiceId) navigate(`/invoices/${invoiceId}`)
    },
    onError: handleError('Unable to create the invoice.'),
  })

  const completeMutation = useMutation({
    mutationFn: (order) => post(`sales-orders/${order.id}/complete`),
    onSuccess: (response) => {
      invalidate()
      setActionError(null)
      toast.success(response?.data?.message || 'Order completed.')
    },
    onError: handleError('Unable to complete the order.'),
  })

  const cancelMutation = useMutation({
    mutationFn: (order) => post(`sales-orders/${order.id}/cancel`),
    onSuccess: (response) => {
      invalidate()
      setCancelling(null)
      setActionError(null)
      toast.success(response?.data?.message || 'Order cancelled.')
    },
    onError: (err) => {
      toast.error(err?.message || 'Unable to cancel the order.')
      setCancelling(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (order) => del(`sales-orders/${order.id}`),
    onSuccess: (response) => {
      invalidate()
      setDeleting(null)
      setDetailId(null)
      toast.success(response?.data?.message || 'Order deleted.')
    },
    onError: (err) => {
      toast.error(err?.message || 'Unable to delete the order.')
      setDeleting(null)
    },
  })

  const openDetail = (order) => {
    setActionError(null)
    setDetailId(order.id)
  }

  const closeDetail = () => {
    setDetailId(null)
    setActionError(null)
  }

  const orders = data?.data ?? []
  const meta = data?.meta
  const links = data?.links
  const items = detail?.items ?? []

  const customerOptions = (customersData ?? []).map((customer) => ({ value: customer.id, label: customer.name }))
  const warehouseOptions = (warehousesData ?? []).map((warehouse) => ({ value: warehouse.id, label: warehouse.name }))

  const rowActions = (order) =>
    [
      { label: 'View', icon: Eye, onSelect: () => openDetail(order) },
      order.status === 'draft' && {
        label: 'Edit',
        icon: Pencil,
        disabled: !can('sales.update'),
        onSelect: () => navigate(`/sales-orders/${order.id}/edit`),
      },
      order.status === 'draft' && {
        label: 'Confirm order',
        icon: CheckCircle2,
        disabled: !can('sales.confirm'),
        onSelect: () => confirmMutation.mutate(order),
      },
      canShip(order) && {
        label: 'Ship',
        icon: Truck,
        disabled: !can('sales.ship'),
        onSelect: () => shipMutation.mutate(order),
      },
      canInvoice(order) && {
        label: 'Create invoice',
        icon: FileText,
        disabled: !can('invoices.create'),
        onSelect: () => invoiceMutation.mutate(order),
      },
      canComplete(order) && {
        label: 'Complete',
        icon: PackageCheck,
        disabled: !can('sales.complete'),
        onSelect: () => completeMutation.mutate(order),
      },
      canCancel(order) && {
        label: 'Cancel order',
        icon: Ban,
        tone: 'danger',
        disabled: !can('sales.update'),
        onSelect: () => setCancelling(order),
      },
      order.status === 'draft' && {
        label: 'Delete',
        icon: Trash2,
        tone: 'danger',
        disabled: !can('sales.delete'),
        onSelect: () => setDeleting(order),
      },
    ].filter(Boolean)

  return (
    <div className="space-y-5">
      <PageHeader
        title="Sales orders"
        subtitle={`${meta?.total ?? 0} orders`}
        actions={
          <>
            <Button variant="secondary" onClick={() => refetch()} loading={isFetching}>
              <RefreshCw className="h-4 w-4" /> Refresh
            </Button>
            {can('sales.create') && (
              <Button onClick={() => navigate('/sales-orders/new')}>
                <Plus className="h-4 w-4" /> New sales order
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
            className="w-40"
            placeholder="All warehouses"
            value={filters.warehouse_id}
            options={warehouseOptions}
            onChange={(event) => {
              setFilters((state) => ({ ...state, warehouse_id: event.target.value }))
              setPage(1)
            }}
          />
          <Select
            className="w-40"
            placeholder="Any status"
            value={filters.status}
            options={STATUS_OPTIONS}
            onChange={(event) => {
              setFilters((state) => ({ ...state, status: event.target.value }))
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
        ) : orders.length === 0 ? (
          <EmptyState
            icon={ShoppingCart}
            title="No sales orders found"
            description="Adjust your filters or create the first sales order."
            action={
              can('sales.create') ? (
                <Button size="sm" onClick={() => navigate('/sales-orders/new')}>
                  <Plus className="h-4 w-4" /> New sales order
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
                  <th>Order date</th>
                  <th>Expected</th>
                  <th className="text-right">Items</th>
                  <th className="text-right">Grand total</th>
                  <th>Status</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <p className="whitespace-nowrap font-mono text-xs font-semibold text-slate-700">{order.number}</p>
                      {order.reference && <p className="text-[11px] text-slate-400">{order.reference}</p>}
                    </td>
                    <td>
                      <p className="font-medium text-slate-800">{order.customer?.name ?? '—'}</p>
                      {order.warehouse && <p className="text-xs text-slate-400">{order.warehouse.name}</p>}
                    </td>
                    <td className="whitespace-nowrap text-sm text-slate-500">{formatDate(order.order_date)}</td>
                    <td className="whitespace-nowrap text-sm text-slate-500">{formatDate(order.expected_date)}</td>
                    <td className="text-right tabular">{formatNumber(order.items_count ?? 0, 0)}</td>
                    <td className="text-right tabular font-semibold text-slate-800">
                      {formatCurrency(order.grand_total)}
                    </td>
                    <td>
                      <StatusBadge group="order_status" value={order.status} />
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
                        items={rowActions(order)}
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
        open={Boolean(detailId)}
        onClose={closeDetail}
        title={detail ? `${detail.number} · ${detail.customer?.name ?? ''}` : 'Sales order'}
        subtitle={detail ? `Placed on ${formatDate(detail.order_date)}` : undefined}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={closeDetail}>
              Close
            </Button>
            {detail?.status === 'draft' && can('sales.update') && (
              <Button variant="secondary" onClick={() => navigate(`/sales-orders/${detail.id}/edit`)}>
                <Pencil className="h-4 w-4" /> Edit
              </Button>
            )}
            {detail?.status === 'draft' && (
              <Button
                disabled={!can('sales.confirm')}
                loading={confirmMutation.isPending}
                onClick={() => confirmMutation.mutate(detail)}
              >
                <CheckCircle2 className="h-4 w-4" /> Confirm
              </Button>
            )}
            {detail && canShip(detail) && (
              <Button
                disabled={!can('sales.ship')}
                loading={shipMutation.isPending}
                onClick={() => shipMutation.mutate(detail)}
              >
                <Truck className="h-4 w-4" /> Ship
              </Button>
            )}
            {detail && canInvoice(detail) && (
              <Button
                disabled={!can('invoices.create')}
                loading={invoiceMutation.isPending}
                onClick={() => invoiceMutation.mutate(detail)}
              >
                <FileText className="h-4 w-4" /> Invoice
              </Button>
            )}
            {detail && canComplete(detail) && (
              <Button
                disabled={!can('sales.complete')}
                loading={completeMutation.isPending}
                onClick={() => completeMutation.mutate(detail)}
              >
                <PackageCheck className="h-4 w-4" /> Complete
              </Button>
            )}
          </>
        }
      >
        {detailLoading || !detail ? (
          <TableSkeleton rows={5} columns={5} />
        ) : (
          <div className="space-y-4">
            {actionError && <Alert tone="error">{actionError}</Alert>}

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Customer</p>
                <p className="mt-1 text-sm font-medium text-slate-800">{detail.customer?.name ?? '—'}</p>
                {detail.customer?.email && <p className="text-xs text-slate-500">{detail.customer.email}</p>}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Dates</p>
                <p className="mt-1 text-sm text-slate-600">Order: {formatDate(detail.order_date)}</p>
                <p className="text-xs text-slate-500">Expected: {formatDate(detail.expected_date)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <StatusBadge group="order_status" value={detail.status} />
                  {detail.warehouse && <span className="text-xs text-slate-500">{detail.warehouse.name}</span>}
                </div>
                {detail.reference && <p className="mt-1 text-xs text-slate-500">Ref: {detail.reference}</p>}
                {detail.invoice && (
                  <p className="mt-1 text-xs text-slate-500">
                    Invoice: <span className="font-mono">{detail.invoice.number}</span>
                  </p>
                )}
              </div>
            </div>

            {detail.notes && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Notes</p>
                <p className="mt-1 whitespace-pre-line text-sm text-slate-600">{detail.notes}</p>
              </div>
            )}

            <div className="table-wrapper rounded-lg border border-slate-200">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Product</th>
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
                      <td>
                        <p className="font-medium text-slate-800">{item.product?.name ?? '—'}</p>
                        <p className="font-mono text-[11px] text-slate-400">{item.product?.code}</p>
                      </td>
                      <td className="text-right tabular">{formatNumber(item.quantity)}</td>
                      <td className="text-right tabular">{formatCurrency(item.unit_price)}</td>
                      <td className="text-right tabular">{formatCurrency(item.discount)}</td>
                      <td className="text-right tabular">{formatCurrency(item.tax_amount)}</td>
                      <td className="text-right tabular font-semibold">{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <TotalsBlock
              subtotal={detail.subtotal}
              discount={detail.discount_amount}
              tax={detail.tax_total}
              shipping={detail.shipping}
              grandTotal={detail.grand_total}
            />
          </div>
        )}
      </Modal>

      <Modal
        open={Boolean(cancelling)}
        onClose={() => setCancelling(null)}
        title="Cancel sales order"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCancelling(null)}>
              Keep order
            </Button>
            <Button
              variant="danger"
              loading={cancelMutation.isPending}
              onClick={() => cancelMutation.mutate(cancelling)}
            >
              Cancel order
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          Cancel <span className="font-mono font-semibold">{cancelling?.number}</span>? Any reserved stock is released
          back to the available quantity.
        </p>
      </Modal>

      <Modal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Delete sales order"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleting(null)}>
              Keep order
            </Button>
            <Button
              variant="danger"
              loading={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate(deleting)}
            >
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          Delete draft order <span className="font-mono font-semibold">{deleting?.number}</span>? This cannot be undone.
        </p>
      </Modal>
    </div>
  )
}