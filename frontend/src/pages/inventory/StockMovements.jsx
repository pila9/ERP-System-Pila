import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeftRight, History, RefreshCw } from 'lucide-react'
import { get } from '../../lib/api'
import { cleanParams, cn } from '../../lib/utils'
import { formatCurrency, formatDateTime, formatNumber } from '../../lib/format'
import { MOVEMENT_TYPES, label as statusLabel } from '../../lib/status'
import { PageHeader } from '../../components/ui/DataDisplay'
import { Card } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Pagination from '../../components/ui/Pagination'
import { StatusBadge } from '../../components/ui/Badge'
import { Input, Select } from '../../components/ui/Form'
import { SearchInput, Toolbar, ToolbarSpacer } from '../../components/ui/FilterBar'
import { EmptyState, ErrorState, TableSkeleton } from '../../components/ui/Feedback'

const INBOUND_TYPES = ['in', 'transfer_in']

function movementDirection(type, quantity) {
  if (type === 'adjustment') return Number(quantity) >= 0 ? 1 : -1

  return INBOUND_TYPES.includes(type) ? 1 : -1
}

function referenceText(movement) {
  if (!movement.reference_type) return '—'

  return movement.reference_id ? `${movement.reference_type} #${movement.reference_id}` : movement.reference_type
}

export default function StockMovements() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({ type: '', warehouse_id: '', from: '', to: '' })

  const params = useMemo(
    () => cleanParams({ page, search, ...filters, per_page: 20 }),
    [page, search, filters],
  )

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['stock-movements', params],
    queryFn: () => get('stock/movements', params).then((response) => response.data),
  })

  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses', 'all'],
    queryFn: () => get('warehouses', { per_page: 100 }).then((response) => response.data.data),
  })

  const movements = data?.data ?? []
  const meta = data?.meta
  const links = data?.links

  const typeOptions = MOVEMENT_TYPES.map((type) => ({ value: type, label: statusLabel('movement_type', type) }))

  const warehouseOptions = (warehousesData ?? []).map((warehouse) => ({ value: warehouse.id, label: warehouse.name }))

  return (
    <div className="space-y-5">
      <PageHeader
        title="Stock movements"
        subtitle={`${meta?.total ?? 0} recorded stock movements`}
        actions={
          <Button variant="secondary" onClick={() => refetch()} loading={isFetching}>
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
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
            placeholder="Search number, product or note…"
            className="w-full sm:w-72"
          />
          <ToolbarSpacer />
          <Select
            className="w-44"
            placeholder="All types"
            value={filters.type}
            options={typeOptions}
            onChange={(event) => {
              setFilters((state) => ({ ...state, type: event.target.value }))
              setPage(1)
            }}
          />
          <Select
            className="w-44"
            placeholder="All warehouses"
            value={filters.warehouse_id}
            options={warehouseOptions}
            onChange={(event) => {
              setFilters((state) => ({ ...state, warehouse_id: event.target.value }))
              setPage(1)
            }}
          />
          <Input
            type="date"
            className="w-40"
            aria-label="From date"
            value={filters.from}
            onChange={(event) => {
              setFilters((state) => ({ ...state, from: event.target.value }))
              setPage(1)
            }}
          />
          <Input
            type="date"
            className="w-40"
            aria-label="To date"
            value={filters.to}
            onChange={(event) => {
              setFilters((state) => ({ ...state, to: event.target.value }))
              setPage(1)
            }}
          />
        </Toolbar>

        {isLoading ? (
          <TableSkeleton rows={10} columns={8} />
        ) : isError ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : movements.length === 0 ? (
          <EmptyState
            icon={History}
            title="No stock movements found"
            description="Every stock change is logged here as soon as it happens."
          />
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Number / Date</th>
                  <th>Product</th>
                  <th>Warehouse</th>
                  <th>Type</th>
                  <th className="text-right">Quantity</th>
                  <th className="text-right">Balance</th>
                  <th className="text-right">Unit cost</th>
                  <th className="text-right">Value</th>
                  <th>Reference</th>
                  <th>User</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((movement) => {
                  const direction = movementDirection(movement.type, movement.quantity)

                  return (
                    <tr key={movement.id}>
                      <td className="whitespace-nowrap">
                        <p className="font-mono text-xs font-semibold text-slate-700">{movement.number || `#${movement.id}`}</p>
                        <p className="text-[11px] text-slate-400">{formatDateTime(movement.created_at)}</p>
                      </td>
                      <td>
                        <p className="font-medium text-slate-800">{movement.product?.name || '—'}</p>
                        {movement.product?.code && (
                          <p className="font-mono text-[11px] text-slate-400">{movement.product.code}</p>
                        )}
                      </td>
                      <td className="text-sm text-slate-600">
                        <span className="inline-flex items-center gap-1">
                          <ArrowLeftRight className="h-3.5 w-3.5 text-slate-400" />
                          {movement.to_warehouse
                            ? `${movement.warehouse?.name || '—'} → ${movement.to_warehouse.name}`
                            : movement.warehouse?.name || '—'}
                        </span>
                      </td>
                      <td>
                        <StatusBadge group="movement_type" value={movement.type} />
                      </td>
                      <td
                        className={cn(
                          'text-right tabular font-semibold',
                          direction >= 0 ? 'text-emerald-600' : 'text-rose-600',
                        )}
                      >
                        {direction >= 0 ? '+' : '−'}
                        {formatNumber(Math.abs(Number(movement.quantity) || 0))}
                      </td>
                      <td className="text-right tabular">{formatNumber(movement.balance_after)}</td>
                      <td className="text-right tabular text-slate-500">{formatCurrency(movement.unit_cost)}</td>
                      <td className="text-right tabular font-medium">
                        {formatCurrency(Math.abs(Number(movement.quantity) || 0) * (Number(movement.unit_cost) || 0))}
                      </td>
                      <td className="text-xs text-slate-500">{referenceText(movement)}</td>
                      <td className="text-sm text-slate-600">{movement.user?.name || 'System'}</td>
                      <td className="max-w-[16rem] truncate text-xs text-slate-500">{movement.note || '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        <Pagination meta={meta} links={links} onPageChange={setPage} className="border-t border-slate-200" />
      </Card>
    </div>
  )
}