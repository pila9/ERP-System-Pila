import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Coins, PackageSearch, RefreshCw, TriangleAlert } from 'lucide-react'
import { get } from '../../lib/api'
import { cleanParams } from '../../lib/utils'
import { formatCurrency, formatNumber } from '../../lib/format'
import { PageHeader, ProgressBar, StatCard } from '../../components/ui/DataDisplay'
import { Card } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Pagination from '../../components/ui/Pagination'
import { StatusBadge } from '../../components/ui/Badge'
import { Select } from '../../components/ui/Form'
import { SearchInput, Toolbar, ToolbarSpacer } from '../../components/ui/FilterBar'
import { EmptyState, ErrorState, TableSkeleton } from '../../components/ui/Feedback'

const reorderQuantityOf = (product) => Number(product.reorder_quantity ?? 0) || 0

const estimatedCostOf = (product) => {
  if (product.estimated_cost !== null && product.estimated_cost !== undefined) {
    return Number(product.estimated_cost) || 0
  }

  return reorderQuantityOf(product) * (Number(product.cost_price) || 0)
}

export default function LowStock() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({ category_id: '' })

  const params = useMemo(
    () => cleanParams({ page, search, ...filters, per_page: 20 }),
    [page, search, filters],
  )

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['stock', 'low', params],
    queryFn: () => get('stock/low', params).then((response) => response.data),
  })

  const { data: categoriesData } = useQuery({
    queryKey: ['categories', 'all'],
    queryFn: () => get('categories', { per_page: 100, is_active: 1 }).then((response) => response.data.data),
  })

  const products = data?.data ?? []
  const meta = data?.meta
  const links = data?.links

  const totals = useMemo(
    () =>
      products.reduce(
        (accumulator, product) => ({
          reorder_quantity: accumulator.reorder_quantity + reorderQuantityOf(product),
          estimated_cost: accumulator.estimated_cost + estimatedCostOf(product),
        }),
        { reorder_quantity: 0, estimated_cost: 0 },
      ),
    [products],
  )

  const categoryOptions = (categoriesData ?? []).map((category) => ({ value: category.id, label: category.name }))

  return (
    <div className="space-y-5">
      <PageHeader
        title="Low stock"
        subtitle={`${meta?.total ?? 0} products at or below their reorder level`}
        actions={
          <Button variant="secondary" onClick={() => refetch()} loading={isFetching}>
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Products to reorder"
          value={formatNumber(meta?.total ?? 0, 0)}
          hint={`${products.filter((product) => Number(product.total_stock) <= 0).length} out of stock on this page`}
          icon={TriangleAlert}
          tone="amber"
        />
        <StatCard
          label="Reorder quantity"
          value={formatNumber(totals.reorder_quantity, 0)}
          hint="Suggested units for this page"
          icon={PackageSearch}
          tone="brand"
        />
        <StatCard
          label="Estimated cost"
          value={formatCurrency(totals.estimated_cost)}
          hint="Reorder quantity at cost price"
          icon={Coins}
          tone="green"
        />
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
            placeholder="All categories"
            value={filters.category_id}
            options={categoryOptions}
            onChange={(event) => {
              setFilters((state) => ({ ...state, category_id: event.target.value }))
              setPage(1)
            }}
          />
        </Toolbar>

        {isLoading ? (
          <TableSkeleton rows={8} columns={7} />
        ) : isError ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : products.length === 0 ? (
          <EmptyState
            icon={PackageSearch}
            title="Stock levels are healthy"
            description="No product is currently at or below its reorder level."
          />
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Product</th>
                  <th>Category</th>
                  <th className="text-right">Total stock</th>
                  <th className="text-right">Reorder level</th>
                  <th className="text-right">Reorder quantity</th>
                  <th>Status</th>
                  <th className="text-right">Estimated cost</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const reorderLevel = Number(product.reorder_level ?? 0)

                  return (
                    <tr key={product.id}>
                      <td className="whitespace-nowrap font-mono text-xs font-semibold text-slate-700">{product.code || '—'}</td>
                      <td>
                        <p className="font-medium text-slate-800">{product.name}</p>
                        <ProgressBar
                          className="mt-1.5 w-32"
                          value={Number(product.total_stock ?? 0)}
                          max={reorderLevel || 1}
                          tone={product.stock_status === 'out_of_stock' ? 'red' : 'amber'}
                        />
                      </td>
                      <td className="text-sm text-slate-500">{product.category?.name ?? product.category ?? '—'}</td>
                      <td
                        className={
                          Number(product.total_stock) <= 0
                            ? 'text-right tabular font-semibold text-rose-600'
                            : 'text-right tabular font-semibold text-amber-600'
                        }
                      >
                        {formatNumber(product.total_stock)}
                      </td>
                      <td className="text-right tabular text-slate-500">{formatNumber(reorderLevel)}</td>
                      <td className="text-right tabular">{formatNumber(reorderQuantityOf(product))}</td>
                      <td>
                        <StatusBadge group="stock_status" value={product.stock_status ?? product.status} />
                      </td>
                      <td className="text-right tabular font-medium">{formatCurrency(estimatedCostOf(product))}</td>
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