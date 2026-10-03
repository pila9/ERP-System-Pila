import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeftRight,
  Coins,
  Layers,
  Package,
  PackageSearch,
  RefreshCw,
  SlidersHorizontal,
  TriangleAlert,
  Warehouse as WarehouseIcon,
} from 'lucide-react'
import { get, post } from '../../lib/api'
import { cleanParams, cn } from '../../lib/utils'
import { formatCurrency, formatNumber } from '../../lib/format'
import { usePermission } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { PageHeader, StatCard } from '../../components/ui/DataDisplay'
import { Card } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Alert from '../../components/ui/Alert'
import Badge from '../../components/ui/Badge'
import Pagination from '../../components/ui/Pagination'
import { Checkbox, FormGrid, Input, Select, Textarea } from '../../components/ui/Form'
import { SearchInput, Toolbar, ToolbarSpacer } from '../../components/ui/FilterBar'
import { EmptyState, ErrorState, TableSkeleton } from '../../components/ui/Feedback'

const EMPTY_ADJUST = { product_id: '', warehouse_id: '', quantity: '', note: '' }
const EMPTY_TRANSFER = { product_id: '', from_warehouse_id: '', to_warehouse_id: '', quantity: '', note: '' }

export default function StockLevels() {
  const queryClient = useQueryClient()
  const toast = useToast()
  const can = usePermission()

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({ warehouse_id: '', low_only: false })

  const [adjustOpen, setAdjustOpen] = useState(false)
  const [adjustForm, setAdjustForm] = useState(EMPTY_ADJUST)
  const [adjustErrors, setAdjustErrors] = useState({})
  const [adjustError, setAdjustError] = useState(null)

  const [transferOpen, setTransferOpen] = useState(false)
  const [transferForm, setTransferForm] = useState(EMPTY_TRANSFER)
  const [transferErrors, setTransferErrors] = useState({})
  const [transferError, setTransferError] = useState(null)

  const params = useMemo(
    () =>
      cleanParams({
        page,
        search,
        warehouse_id: filters.warehouse_id,
        low_only: filters.low_only ? 1 : undefined,
        per_page: 15,
      }),
    [page, search, filters],
  )

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['stock', 'levels', params],
    queryFn: () => get('stock/levels', params).then((response) => response.data),
  })

  const { data: summary } = useQuery({
    queryKey: ['stock', 'summary'],
    queryFn: () => get('stock/summary').then((response) => response.data.data),
  })

  const { data: productsData } = useQuery({
    queryKey: ['products', 'all'],
    queryFn: () => get('products', { per_page: 100, is_active: 1 }).then((response) => response.data.data),
  })

  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses', 'all'],
    queryFn: () => get('warehouses', { per_page: 100 }).then((response) => response.data.data),
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['stock'] })
    queryClient.invalidateQueries({ queryKey: ['stock-movements'] })
    queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    queryClient.invalidateQueries({ queryKey: ['products'] })
  }

  const adjustMutation = useMutation({
    mutationFn: (payload) => post('stock/adjustments', payload),
    onSuccess: () => {
      invalidate()
      setAdjustOpen(false)
      setAdjustForm(EMPTY_ADJUST)
      toast.success('Stock adjusted.')
    },
    onError: (err) => {
      setAdjustErrors(err?.errors || {})
      setAdjustError(err?.message)
      toast.error(err?.message || 'Unable to adjust stock.')
    },
  })

  const transferMutation = useMutation({
    mutationFn: (payload) => post('stock/transfers', payload),
    onSuccess: () => {
      invalidate()
      setTransferOpen(false)
      setTransferForm(EMPTY_TRANSFER)
      toast.success('Stock transferred.')
    },
    onError: (err) => {
      setTransferErrors(err?.errors || {})
      setTransferError(err?.message)
      toast.error(err?.message || 'Unable to transfer stock.')
    },
  })

  const openAdjust = () => {
    setAdjustForm({
      ...EMPTY_ADJUST,
      warehouse_id: filters.warehouse_id || '',
    })
    setAdjustErrors({})
    setAdjustError(null)
    setAdjustOpen(true)
  }

  const openTransfer = () => {
    setTransferForm({ ...EMPTY_TRANSFER, from_warehouse_id: filters.warehouse_id || '' })
    setTransferErrors({})
    setTransferError(null)
    setTransferOpen(true)
  }

  const submitAdjust = (event) => {
    event?.preventDefault()
    setAdjustErrors({})
    setAdjustError(null)
    adjustMutation.mutate({
      product_id: Number(adjustForm.product_id) || null,
      warehouse_id: Number(adjustForm.warehouse_id) || null,
      quantity: Number(adjustForm.quantity),
      note: adjustForm.note || null,
    })
  }

  const submitTransfer = (event) => {
    event?.preventDefault()
    setTransferErrors({})
    setTransferError(null)
    transferMutation.mutate({
      product_id: Number(transferForm.product_id) || null,
      from_warehouse_id: Number(transferForm.from_warehouse_id) || null,
      to_warehouse_id: Number(transferForm.to_warehouse_id) || null,
      quantity: Number(transferForm.quantity),
      note: transferForm.note || null,
    })
  }

  const levels = data?.data ?? []
  const meta = data?.meta
  const links = data?.links

  const productOptions = (productsData ?? []).map((product) => ({
    value: product.id,
    label: `${product.code} - ${product.name}`,
  }))

  const warehouseOptions = (warehousesData ?? []).map((warehouse) => ({ value: warehouse.id, label: warehouse.name }))

  const toWarehouseOptions = warehouseOptions.filter((option) => String(option.value) !== String(transferForm.from_warehouse_id))

  return (
    <div className="space-y-5">
      <PageHeader
        title="Stock levels"
        subtitle={`${meta?.total ?? 0} stock lines across all warehouses`}
        actions={
          <>
            <Button variant="secondary" onClick={() => refetch()} loading={isFetching}>
              <RefreshCw className="h-4 w-4" /> Refresh
            </Button>
            {can('stock.transfer') && (
              <Button variant="secondary" onClick={openTransfer}>
                <ArrowLeftRight className="h-4 w-4" /> Transfer
              </Button>
            )}
            {can('stock.adjust') && (
              <Button onClick={openAdjust}>
                <SlidersHorizontal className="h-4 w-4" /> Adjust stock
              </Button>
            )}
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <StatCard label="SKUs" value={formatNumber(summary?.total_skus ?? 0, 0)} hint={`${summary?.tracked_skus ?? 0} tracked`} icon={Layers} tone="brand" />
        <StatCard label="Quantity" value={formatNumber(summary?.total_quantity ?? 0, 0)} hint={`${formatNumber(summary?.reserved_quantity ?? 0, 0)} reserved`} icon={Package} tone="violet" />
        <StatCard label="Stock value" value={formatCurrency(summary?.total_value ?? 0)} hint="At cost price" icon={Coins} tone="green" />
        <StatCard label="Retail value" value={formatCurrency(summary?.retail_value ?? 0)} hint="At sale price" icon={Coins} tone="green" />
        <StatCard label="Low stock" value={formatNumber(summary?.low_stock_count ?? 0, 0)} hint="At or below reorder level" icon={TriangleAlert} tone="amber" />
        <StatCard label="Out of stock" value={formatNumber(summary?.out_of_stock_count ?? 0, 0)} hint="Nothing on hand" icon={TriangleAlert} tone="red" />
      </div>

      <Card>
        <Toolbar>
          <SearchInput
            value={search}
            onChange={(value) => {
              setSearch(value)
              setPage(1)
            }}
            placeholder="Search product name or code…"
            className="w-full sm:w-72"
          />
          <ToolbarSpacer />
          <Select
            className="w-48"
            placeholder="All warehouses"
            value={filters.warehouse_id}
            options={warehouseOptions}
            onChange={(event) => {
              setFilters((state) => ({ ...state, warehouse_id: event.target.value }))
              setPage(1)
            }}
          />
          <Checkbox
            label="Low stock only"
            checked={filters.low_only}
            onChange={(event) => {
              setFilters((state) => ({ ...state, low_only: event.target.checked }))
              setPage(1)
            }}
          />
        </Toolbar>

        {isLoading ? (
          <TableSkeleton rows={8} columns={7} />
        ) : isError ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : levels.length === 0 ? (
          <EmptyState
            icon={PackageSearch}
            title="No stock lines found"
            description="Adjust your filters, or receive stock through a purchase order."
          />
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Product</th>
                  <th>Warehouse</th>
                  <th className="text-right">On hand</th>
                  <th className="text-right">Reserved</th>
                  <th className="text-right">Available</th>
                  <th className="text-right">Value</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {levels.map((level) => (
                  <tr key={level.id}>
                    <td className="whitespace-nowrap font-mono text-xs font-semibold text-slate-700">
                      {level.product?.code || '—'}
                    </td>
                    <td>
                      <p className="font-medium text-slate-800">{level.product?.name || '—'}</p>
                      {level.product?.sku && <p className="font-mono text-[11px] text-slate-400">{level.product.sku}</p>}
                    </td>
                    <td className="text-sm text-slate-600">
                      <span className="inline-flex items-center gap-1">
                        <WarehouseIcon className="h-3.5 w-3.5 text-slate-400" />
                        {level.warehouse?.name || '—'}
                      </span>
                    </td>
                    <td
                      className={cn(
                        'text-right tabular font-semibold',
                        Number(level.quantity) <= 0 ? 'text-rose-600' : level.is_low ? 'text-amber-600' : 'text-slate-700',
                      )}
                    >
                      {formatNumber(level.quantity)}
                    </td>
                    <td className="text-right tabular text-slate-500">{formatNumber(level.reserved_quantity)}</td>
                    <td className="text-right tabular font-medium">{formatNumber(level.available_quantity)}</td>
                    <td className="text-right tabular">{formatCurrency(level.value)}</td>
                    <td>
                      {level.is_low ? <Badge tone="amber">Low</Badge> : <Badge tone="green">OK</Badge>}
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
        open={adjustOpen}
        onClose={() => setAdjustOpen(false)}
        title="Adjust stock"
        subtitle="Set the on-hand quantity for a product in one warehouse"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAdjustOpen(false)} disabled={adjustMutation.isPending}>
              Cancel
            </Button>
            <Button onClick={submitAdjust} loading={adjustMutation.isPending}>
              Apply adjustment
            </Button>
          </>
        }
      >
        <form className="space-y-4" onSubmit={submitAdjust}>
          {adjustError && <Alert tone="error">{adjustError}</Alert>}

          <Select
            label="Product"
            required
            placeholder="Select a product"
            options={productOptions}
            value={adjustForm.product_id}
            error={adjustErrors.product_id?.[0]}
            onChange={(event) => setAdjustForm((state) => ({ ...state, product_id: event.target.value }))}
          />

          <Select
            label="Warehouse"
            required
            placeholder="Select a warehouse"
            options={warehouseOptions}
            value={adjustForm.warehouse_id}
            error={adjustErrors.warehouse_id?.[0]}
            onChange={(event) => setAdjustForm((state) => ({ ...state, warehouse_id: event.target.value }))}
          />

          <Input
            label="New quantity on hand"
            required
            type="number"
            step="0.01"
            placeholder="0"
            hint="Replaces the current on-hand quantity and records an adjustment movement."
            value={adjustForm.quantity}
            error={adjustErrors.quantity?.[0]}
            onChange={(event) => setAdjustForm((state) => ({ ...state, quantity: event.target.value }))}
          />

          <Textarea
            label="Note"
            value={adjustForm.note}
            error={adjustErrors.note?.[0]}
            onChange={(event) => setAdjustForm((state) => ({ ...state, note: event.target.value }))}
          />

          <button type="submit" className="hidden" aria-hidden="true" />
        </form>
      </Modal>

      <Modal
        open={transferOpen}
        onClose={() => setTransferOpen(false)}
        title="Transfer stock"
        subtitle="Move a quantity of a product between warehouses"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setTransferOpen(false)} disabled={transferMutation.isPending}>
              Cancel
            </Button>
            <Button onClick={submitTransfer} loading={transferMutation.isPending}>
              Transfer stock
            </Button>
          </>
        }
      >
        <form className="space-y-4" onSubmit={submitTransfer}>
          {transferError && <Alert tone="error">{transferError}</Alert>}

          <Select
            label="Product"
            required
            placeholder="Select a product"
            options={productOptions}
            value={transferForm.product_id}
            error={transferErrors.product_id?.[0]}
            onChange={(event) => setTransferForm((state) => ({ ...state, product_id: event.target.value }))}
          />

          <FormGrid>
            <Select
              label="From warehouse"
              required
              placeholder="Select a warehouse"
              options={warehouseOptions}
              value={transferForm.from_warehouse_id}
              error={transferErrors.from_warehouse_id?.[0]}
              onChange={(event) =>
                setTransferForm((state) => ({ ...state, from_warehouse_id: event.target.value, to_warehouse_id: '' }))
              }
            />
            <Select
              label="To warehouse"
              required
              placeholder="Select a warehouse"
              options={toWarehouseOptions}
              value={transferForm.to_warehouse_id}
              error={transferErrors.to_warehouse_id?.[0]}
              onChange={(event) => setTransferForm((state) => ({ ...state, to_warehouse_id: event.target.value }))}
            />
          </FormGrid>

          <Input
            label="Quantity"
            required
            type="number"
            step="0.01"
            min="0"
            placeholder="0"
            error={transferErrors.quantity?.[0]}
            onChange={(event) => setTransferForm((state) => ({ ...state, quantity: event.target.value }))}
          />

          <Textarea
            label="Note"
            value={transferForm.note}
            error={transferErrors.note?.[0]}
            onChange={(event) => setTransferForm((state) => ({ ...state, note: event.target.value }))}
          />

          <button type="submit" className="hidden" aria-hidden="true" />
        </form>
      </Modal>
    </div>
  )
}