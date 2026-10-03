import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  Ban,
  Eye,
  MoreVertical,
  PackageCheck,
  Pencil,
  Plus,
  RefreshCw,
  Send,
  ShoppingCart,
  Trash2,
  Truck,
} from 'lucide-react'
import { del, get, post } from '../../lib/api'
import { cleanParams, cn } from '../../lib/utils'
import { formatCurrency, formatDate, formatNumber } from '../../lib/format'
import { PURCHASE_ORDER_STATUSES, label as statusLabel } from '../../lib/status'
import { usePermission } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { PageHeader, ProgressBar } from '../../components/ui/DataDisplay'
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

const STATUS_OPTIONS = PURCHASE_ORDER_STATUSES.map((status) => ({
  value: status,
  label: statusLabel('purchase_status', status),
}))

const canBeReceived = (order) => ['ordered', 'partial'].includes(order.status)

const canPlace = (order) => order.status === 'draft'

const receivedProgress = (order) => {
  const ordered = (order.items ?? []).reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)

  if (!ordered) return 0

  const received = (order.items ?? []).reduce((sum, item) => sum + (Number(item.received_quantity) || 0), 0)

  return Math.round((received / ordered) * 100)
}

function TotalsBlock({ subtotal, discount, tax, shipping, grandTotal }) {
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
    </dl>
  )
}

export default function PurchaseOrders() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const toast = useToast()
  const can = usePermission()

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({ status: '', supplier_id: '', warehouse_id: '', from: '', to: '' })
  const [detailId, setDetailId] = useState(null)
  const [actionError, setActionError] = useState(null)
  const [receiving, setReceiving] = useState(null)
  const [receiveLines, setReceiveLines] = useState({})
  const [receiveError, setReceiveError] = useState(null)
  const [cancelling, setCancelling] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const params = useMemo(
    () => cleanParams({ page, search, ...filters, per_page: 15 }),
    [page, search, filters],
  )

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['purchase-orders', params],
    queryFn: () => get('purchase-orders', params).then((response) => response.data),
  })

  const { data: suppliersData } = useQuery({
    queryKey: ['suppliers', 'all'],
    queryFn: () => get('suppliers', { per_page: 100, is_active: 1 }).then((response) => response.data.data),
  })

  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses', 'all'],
    queryFn: () => get('warehouses', { per_page: 100, is_active: 1 }).then((response) => response.data.data),
  })

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ['purchase-orders', 'detail', detailId],
    queryFn: () => get(`purchase-orders/${detailId}`).then((response) => response.data),
    enabled: Boolean(detailId),
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
    queryClient.invalidateQueries({ queryKey: ['stock'] })
    queryClient.invalidateQueries({ queryKey: ['stock-movements'] })
    queryClient.invalidateQueries({ queryKey: ['dashboard'] })
  }

  const placeMutation = useMutation({
    mutationFn: (order) => post(`purchase-orders/${order.id}/place`),
    onSuccess: (response) => {
      invalidate()
      setActionError(null)
      toast.success(response?.data?.message || 'Purchase order placed.')
    },
    onError: (err) => {
      const message = err?.message || 'Unable to place the purchase order.'
      toast.error(message)
      setActionError(message)
    },
  })

  const receiveMutation = useMutation({
    mutationFn: ({ orderId, items }) => post(`purchase-orders/${orderId}/receive`, { items }),
    onSuccess: (response) => {
      invalidate()
      setReceiving(null)
      setReceiveError(null)
      toast.success(response?.data?.message || 'Stock received.')
    },
    onError: (err) => {
      const message = err?.message || 'Unable to receive the purchase order.'
      toast.error(message)
      setReceiveError(message)
    },
  })

  const cancelMutation = useMutation({
    mutationFn: (order) => post(`purchase-orders/${order.id}/cancel`),
    onSuccess: (response) => {
      invalidate()
      setCancelling(null)
      setActionError(null)
      toast.success(response?.data?.message || 'Purchase order cancelled.')
    },
    onError: (err) => {
      toast.error(err?.message || 'Unable to cancel the purchase order.')
      setCancelling(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (order) => del(`purchase-orders/${order.id}`),
    onSuccess: (response) => {
      invalidate()
      setDeleting(null)
      setDetailId(null)
      toast.success(response?.data?.message || 'Purchase order deleted.')
    },
    onError: (err) => {
      toast.error(err?.message || 'Unable to delete the purchase order.')
      setDeleting(null)
    },
  })

  const openDetail = (order) => {
    setActionError(null)
    setDetailId(order.id)
  }

  const openReceive = (order) => {
    const prefilled = {}

    ;(order.items ?? []).forEach((item) => {
      prefilled[item.id] = Number(item.remaining_quantity ?? 0)
    })

    setReceiveLines(prefilled)
    setReceiveError(null)
    setReceiving(order)
  }

  const submitReceive = () => {
    const items = (receiving.items ?? [])
      .map((item) => ({
        item_id: item.id,
        quantity: Number(receiveLines[item.id] ?? 0),
      }))
      .filter((entry) => entry.quantity > 0)

    if (!items.length) {
      setReceiveError('Enter at least one quantity to receive.')
      return
    }

    const invalid = (receiving.items ?? []).some((item) => {
      const quantity = Number(receiveLines[item.id] ?? 0)

      return quantity > Number(item.remaining_quantity ?? 0)
    })

    if (invalid) {
      setReceiveError('A quantity exceeds the remaining quantity for one of the lines.')
      return
    }

    setReceiveError(null)
    receiveMutation.mutate({ orderId: receiving.id, items })
  }

  const orders = data?.data ?? []
  const meta = data?.meta
  const links = data?.links
  const items = detail?.items ?? []

  const supplierOptions = (suppliersData ?? []).map((supplier) => ({ value: supplier.id, label: supplier.name }))
  const warehouseOptions = (warehousesData ?? []).map((warehouse) => ({ value: warehouse.id, label: warehouse.name }))

  const rowActions = (order) =>
    [
      { label: 'View', icon: Eye, onSelect: () => openDetail(order) },
      order.status === 'draft' && {
        label: 'Edit',
        icon: Pencil,
        disabled: !can('purchases.update'),
        onSelect: () => navigate(`/purchase-orders/${order.id}/edit`),
      },
      canPlace(order) && {
        label: 'Place order',
        icon: Send,
        disabled: !can('purchases.approve'),
        onSelect: () => placeMutation.mutate(order),
      },
      canBeReceived(order) && {
        label: 'Receive stock',
        icon: PackageCheck,
        disabled: !can('purchases.receive'),
        onSelect: () => openReceive(order),
      },
      ['draft', 'ordered'].includes(order.status) && {
        label: 'Cancel order',
        icon: Ban,
        tone: 'danger',
        disabled: !can('purchases.update'),
        onSelect: () => setCancelling(order),
      },
      order.status === 'draft' && {
        label: 'Delete',
        icon: Trash2,
        tone: 'danger',
        disabled: !can('purchases.delete'),
        onSelect: () => setDeleting(order),
      },
    ].filter(Boolean)

  return (
    <div className="space-y-5">
      <PageHeader
        title="Purchase orders"
        subtitle={`${meta?.total ?? 0} purchase orders`}
        actions={
          <>
            <Button variant="secondary" onClick={() => refetch()} loading={isFetching}>
              <RefreshCw className="h-4 w-4" /> Refresh
            </Button>
            {can('purchases.create') && (
              <Button onClick={() => navigate('/purchase-orders/new')}>
                <Plus className="h-4 w-4" /> New purchase order
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
            placeholder="All suppliers"
            value={filters.supplier_id}
            options={supplierOptions}
            onChange={(event) => {
              setFilters((state) => ({ ...state, supplier_id: event.target.value }))
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
            className="w-44"
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
            title="No purchase orders found"
            description="Adjust your filters or create the first purchase order."
            action={
              can('purchases.create') ? (
                <Button size="sm" onClick={() => navigate('/purchase-orders/new')}>
                  <Plus className="h-4 w-4" /> New purchase order
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
                  <th>Supplier</th>
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
                      <p className="font-medium text-slate-800">{order.supplier?.name ?? '—'}</p>
                      {order.warehouse && <p className="text-xs text-slate-400">{order.warehouse.name}</p>}
                    </td>
                    <td className="whitespace-nowrap text-sm text-slate-500">{formatDate(order.order_date)}</td>
                    <td className="whitespace-nowrap text-sm text-slate-500">{formatDate(order.expected_date)}</td>
                    <td className="text-right tabular">{formatNumber(order.items_count ?? 0, 0)}</td>
                    <td className="text-right tabular font-semibold text-slate-800">
                      {formatCurrency(order.grand_total)}
                    </td>
                    <td>
                      <StatusBadge group="purchase_status" value={order.status} />
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
        onClose={() => setDetailId(null)}
        title={detail ? `${detail.number} · ${detail.supplier?.name ?? ''}` : 'Purchase order'}
        subtitle={detail ? `Ordered on ${formatDate(detail.order_date)}` : undefined}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDetailId(null)}>
              Close
            </Button>
            {detail?.status === 'draft' && can('purchases.update') && (
              <Button variant="secondary" onClick={() => navigate(`/purchase-orders/${detail.id}/edit`)}>
                <Pencil className="h-4 w-4" /> Edit
              </Button>
            )}
            {detail && canPlace(detail) && (
              <Button
                disabled={!can('purchases.approve')}
                loading={placeMutation.isPending}
                onClick={() => placeMutation.mutate(detail)}
              >
                <Send className="h-4 w-4" /> Place order
              </Button>
            )}
            {detail && canBeReceived(detail) && (
              <Button
                disabled={!can('purchases.receive')}
                loading={receiveMutation.isPending}
                onClick={() => openReceive(detail)}
              >
                <Truck className="h-4 w-4" /> Receive stock
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
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Supplier</p>
                <p className="mt-1 text-sm font-medium text-slate-800">{detail.supplier?.name ?? '—'}</p>
                {detail.supplier?.email && <p className="text-xs text-slate-500">{detail.supplier.email}</p>}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Dates</p>
                <p className="mt-1 text-sm text-slate-600">Order: {formatDate(detail.order_date)}</p>
                <p className="text-xs text-slate-500">Expected: {formatDate(detail.expected_date)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <StatusBadge group="purchase_status" value={detail.status} />
                  {detail.warehouse && <span className="text-xs text-slate-500">{detail.warehouse.name}</span>}
                </div>
                {detail.reference && <p className="mt-1 text-xs text-slate-500">Ref: {detail.reference}</p>}
              </div>
            </div>

            {detail.notes && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Notes</p>
                <p className="mt-1 whitespace-pre-line text-sm text-slate-600">{detail.notes}</p>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold uppercase tracking-wide">Received progress</span>
                <span className="tabular font-semibold text-slate-700">{receivedProgress(detail)}%</span>
              </div>
              <ProgressBar
                className="mt-1.5"
                value={receivedProgress(detail)}
                tone={detail.status === 'received' ? 'green' : 'brand'}
              />
            </div>

            <div className="table-wrapper rounded-lg border border-slate-200">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th className="text-right">Ordered</th>
                    <th className="text-right">Received</th>
                    <th className="text-right">Remaining</th>
                    <th className="text-right">Unit price</th>
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
                      <td className="text-right tabular">{formatNumber(item.received_quantity)}</td>
                      <td
                        className={cn(
                          'text-right tabular font-semibold',
                          Number(item.remaining_quantity) > 0 ? 'text-amber-600' : 'text-emerald-600',
                        )}
                      >
                        {formatNumber(item.remaining_quantity)}
                      </td>
                      <td className="text-right tabular">{formatCurrency(item.unit_price)}</td>
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
        open={Boolean(receiving)}
        onClose={() => setReceiving(null)}
        title="Receive stock"
        subtitle={receiving ? `${receiving.number} · ${receiving.supplier?.name ?? ''}` : undefined}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setReceiving(null)} disabled={receiveMutation.isPending}>
              Cancel
            </Button>
            <Button loading={receiveMutation.isPending} onClick={submitReceive}>
              Receive stock
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {receiveError && <Alert tone="error">{receiveError}</Alert>}

          <div className="table-wrapper rounded-lg border border-slate-200">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th className="text-right">Ordered</th>
                  <th className="text-right">Already received</th>
                  <th className="text-right">Remaining</th>
                  <th className="w-40 text-right">Receive now</th>
                </tr>
              </thead>
              <tbody>
                {(receiving?.items ?? []).map((item) => {
                  const remaining = Number(item.remaining_quantity ?? 0)
                  const value = receiveLines[item.id] ?? ''
                  const exceeds = Number(value) > remaining

                  return (
                    <tr key={item.id}>
                      <td>
                        <p className="font-medium text-slate-800">{item.product?.name ?? '—'}</p>
                        <p className="font-mono text-[11px] text-slate-400">{item.product?.code}</p>
                      </td>
                      <td className="text-right tabular">{formatNumber(item.quantity)}</td>
                      <td className="text-right tabular">{formatNumber(item.received_quantity)}</td>
                      <td className="text-right tabular font-semibold">{formatNumber(remaining)}</td>
                      <td>
                        <Input
                          aria-label="Receive quantity"
                          type="number"
                          step="0.01"
                          min="0"
                          max={remaining}
                          disabled={remaining <= 0}
                          value={value}
                          error={exceeds ? `Maximum ${formatNumber(remaining)}` : undefined}
                          onChange={(event) =>
                            setReceiveLines((state) => ({ ...state, [item.id]: event.target.value }))
                          }
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-slate-500">
            Received quantities increase stock and recalculate the moving average cost.
          </p>
        </div>
      </Modal>

      <Modal
        open={Boolean(cancelling)}
        onClose={() => setCancelling(null)}
        title="Cancel purchase order"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCancelling(null)}>
              Keep order
            </Button>
            <Button variant="danger" loading={cancelMutation.isPending} onClick={() => cancelMutation.mutate(cancelling)}>
              Cancel order
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          Cancel <span className="font-mono font-semibold">{cancelling?.number}</span>? Draft and ordered purchase
          orders can only be cancelled.
        </p>
      </Modal>

      <Modal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Delete purchase order"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleting(null)}>
              Keep order
            </Button>
            <Button variant="danger" loading={deleteMutation.isPending} onClick={() => deleteMutation.mutate(deleting)}>
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          Delete draft order <span className="font-mono font-semibold">{deleting?.number}</span>? This cannot be
          undone.
        </p>
      </Modal>
    </div>
  )
}