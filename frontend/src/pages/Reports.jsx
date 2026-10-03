import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { CalendarRange, Download, RefreshCw } from 'lucide-react'
import { get } from '../lib/api'
import { cleanParams, cn, isoDay, todayISO } from '../lib/utils'
import {
  formatCurrency,
  formatDate,
  formatNumber,
  formatPercent,
  truncate,
} from '../lib/format'

import { PageHeader, ProgressBar, StatCard } from '../components/ui/DataDisplay'
import { Card, CardBody, CardHeader } from '../components/ui/Card'
import Button from '../components/ui/Button'
import { Input, Select } from '../components/ui/Form'
import { StatusBadge } from '../components/ui/Badge'
import { EmptyState, ErrorState, LoadingState } from '../components/ui/Feedback'

const PALETTE = { primary: '#3366ff', sky: '#0ea5e9' }
const AXIS = { stroke: '#94a3b8', fontSize: 11, tickLine: false, axisLine: false }
const GRID = { strokeDasharray: '3 3', stroke: '#e2e8f0', vertical: false }
const TOOLTIP_STYLE = { borderRadius: 10, fontSize: 12 }

const TABS = [
  { key: 'sales-summary', label: 'Sales summary', endpoint: 'sales-summary' },
  { key: 'top-products', label: 'Top products', endpoint: 'top-products' },
  { key: 'sales-by-customer', label: 'Sales by customer', endpoint: 'sales-by-customer' },
  { key: 'stock-valuation', label: 'Stock valuation', endpoint: 'stock-valuation' },
  { key: 'low-stock', label: 'Low stock', endpoint: 'low-stock' },
  { key: 'receivables', label: 'Receivables', endpoint: 'receivables' },
  { key: 'payables', label: 'Payables', endpoint: 'payables' },
  { key: 'stock-movements', label: 'Stock movements', endpoint: 'stock-movements' },
  { key: 'profit-loss', label: 'Profit & loss', endpoint: 'profit-loss' },
]

const BUCKETS = [
  { key: 'current', label: 'Current' },
  { key: '1-30', label: '1 – 30 days' },
  { key: '31-60', label: '31 – 60 days' },
  { key: '61-90', label: '61 – 90 days' },
  { key: '90+', label: '90+ days' },
]

const money = (value) => formatCurrency(value ?? 0)
const count = (value) => formatNumber(value ?? 0, 0)
const nameOf = (value) => (typeof value === 'object' && value !== null ? value.name ?? '-' : value ?? '-')

function downloadCsv(filename, columns, rows) {
  const escape = (value) => {
    if (value === null || value === undefined) return ''
    const text = String(value)
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
  }

  const cell = (row, column) => (column.render ? column.render(row) : row[column.key] ?? '')

  const header = columns.map((column) => escape(column.label)).join(',')
  const body = rows.map((row) => columns.map((column) => escape(cell(row, column))).join(',')).join('\n')
  const blob = new Blob([`${header}\n${body}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function DataTable({ columns, rows, emptyTitle = 'Nothing to report', emptyDescription, filename }) {
  if (!rows.length) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />
  }

  return (
    <div className="table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} className={cn(column.align === 'right' && 'text-right')}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.id ?? row.invoice_id ?? row.customer_id ?? row.supplier_id ?? row.product_id ?? index}>
              {columns.map((column) => (
                <td key={column.key} className={cn(column.align === 'right' && 'text-right tabular')}>
                  {column.render ? column.render(row) : (row[column.key] ?? '-')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {filename && (
        <div className="flex justify-end border-t border-slate-200 px-4 py-3">
          <Button variant="secondary" size="sm" onClick={() => downloadCsv(filename, columns, rows)}>
            <Download className="h-4 w-4" /> Download CSV
          </Button>
        </div>
      )}
    </div>
  )
}

const STATUS_COLUMN = {
  key: 'status',
  label: 'Status',
  render: (row) => <StatusBadge group="order_status" value={row.status} />,
}

const BY_STATUS_COLUMNS = [
  STATUS_COLUMN,
  {
    key: 'orders',
    label: 'Orders',
    align: 'right',
    render: (row) => count(row.orders_count ?? row.count ?? row.orders ?? 0),
  },
  {
    key: 'amount',
    label: 'Amount',
    align: 'right',
    render: (row) => money(row.total ?? row.amount ?? row.value ?? 0),
  },
]

const BY_CUSTOMER_COLUMNS = [
  { key: 'customer', label: 'Customer', render: (row) => nameOf(row.customer ?? row.name) },
  { key: 'orders_count', label: 'Orders', align: 'right', render: (row) => count(row.orders_count ?? row.orders ?? 0) },
  { key: 'total', label: 'Sales', align: 'right', render: (row) => money(row.total ?? row.sales_total ?? 0) },
]

const BY_PRODUCT_COLUMNS = [
  { key: 'product', label: 'Product', render: (row) => nameOf(row.product ?? row.name) },
  { key: 'quantity', label: 'Qty', align: 'right', render: (row) => formatNumber(row.quantity ?? 0, 0) },
  { key: 'revenue', label: 'Revenue', align: 'right', render: (row) => money(row.revenue ?? row.total ?? 0) },
]

const TOP_PRODUCT_COLUMNS = [
  { key: 'code', label: 'Code', render: (row) => <span className="font-mono text-xs text-slate-500">{row.code ?? '-'}</span> },
  { key: 'name', label: 'Product', render: (row) => truncate(row.name, 40) },
  { key: 'quantity', label: 'Qty sold', align: 'right', render: (row) => formatNumber(row.quantity ?? 0, 0) },
  { key: 'revenue', label: 'Revenue', align: 'right', render: (row) => money(row.revenue) },
  { key: 'cost', label: 'Cost', align: 'right', render: (row) => money(row.cost) },
  { key: 'profit', label: 'Profit', align: 'right', render: (row) => money(row.profit) },
  { key: 'margin_percent', label: 'Margin', align: 'right',
    render: (row) => (
      <span className={cn('font-semibold', (row.margin_percent ?? 0) < 0 ? 'text-rose-600' : 'text-emerald-600')}>
        {formatPercent(row.margin_percent)}
      </span>
    ) },
]

const CUSTOMER_SALES_COLUMNS = [
  { key: 'code', label: 'Code', render: (row) => <span className="font-mono text-xs text-slate-500">{row.code ?? '-'}</span> },
  { key: 'name', label: 'Customer' },
  { key: 'orders_count', label: 'Orders', align: 'right', render: (row) => count(row.orders_count) },
  { key: 'total', label: 'Total sales', align: 'right', render: (row) => money(row.total) },
  { key: 'average_order_value', label: 'Avg order', align: 'right', render: (row) => money(row.average_order_value) },
]

const VALUATION_COLUMNS = [
  { key: 'code', label: 'Code', render: (row) => <span className="font-mono text-xs text-slate-500">{row.code ?? '-'}</span> },
  { key: 'name', label: 'Product', render: (row) => truncate(row.name, 32) },
  { key: 'category', label: 'Category', render: (row) => nameOf(row.category) },
  { key: 'warehouse', label: 'Warehouse', render: (row) => nameOf(row.warehouse) },
  { key: 'quantity', label: 'Qty', align: 'right', render: (row) => formatNumber(row.quantity ?? 0, 0) },
  { key: 'cost_price', label: 'Cost', align: 'right', render: (row) => money(row.cost_price) },
  { key: 'sale_price', label: 'Price', align: 'right', render: (row) => money(row.sale_price) },
  { key: 'cost_value', label: 'Cost value', align: 'right', render: (row) => money(row.cost_value) },
  { key: 'retail_value', label: 'Retail value', align: 'right', render: (row) => money(row.retail_value) },
  { key: 'potential_profit', label: 'Potential profit', align: 'right',
    render: (row) => <span className="font-semibold text-emerald-600">{money(row.potential_profit)}</span> },
  { key: 'is_low', label: 'Stock', render: (row) => <StatusBadge group="stock_status" value={row.is_low ? 'low' : 'in_stock'} /> },
]

const LOW_STOCK_COLUMNS = [
  { key: 'code', label: 'Code', render: (row) => <span className="font-mono text-xs text-slate-500">{row.code ?? '-'}</span> },
  { key: 'name', label: 'Product', render: (row) => truncate(row.name, 34) },
  { key: 'category', label: 'Category', render: (row) => nameOf(row.category) },
  { key: 'quantity', label: 'On hand', align: 'right', render: (row) => count(row.quantity) },
  { key: 'level', label: 'Against reorder level',
    render: (row) => (
      <div className="min-w-[9rem]">
        <ProgressBar
          value={row.quantity ?? 0}
          max={Number(row.reorder_level) || Number(row.quantity) || 1}
          tone={row.status === 'out_of_stock' ? 'red' : row.status === 'low' ? 'amber' : 'green'}
        />
        <p className="mt-1 text-[11px] text-slate-400">{count(row.quantity)} / {count(row.reorder_level)}</p>
      </div>
    ) },
  { key: 'reorder_quantity', label: 'Reorder qty', align: 'right', render: (row) => formatNumber(row.reorder_quantity ?? 0, 0) },
  { key: 'status', label: 'Status', render: (row) => <StatusBadge group="stock_status" value={row.status} /> },
  { key: 'estimated_cost', label: 'Est. cost', align: 'right', render: (row) => money(row.estimated_cost) },
]

const RECEIVABLE_COLUMNS = [
  { key: 'number', label: 'Invoice', render: (row) => <span className="font-mono text-xs font-semibold text-slate-700">{row.number}</span> },
  { key: 'customer', label: 'Customer', render: (row) => truncate(nameOf(row.customer), 28) },
  { key: 'invoice_date', label: 'Date', render: (row) => formatDate(row.invoice_date) },
  { key: 'due_date', label: 'Due', render: (row) => formatDate(row.due_date) },
  { key: 'status', label: 'Status', render: (row) => <StatusBadge group="invoice_status" value={row.status} /> },
  { key: 'grand_total', label: 'Total', align: 'right', render: (row) => money(row.grand_total) },
  { key: 'paid_amount', label: 'Paid', align: 'right', render: (row) => money(row.paid_amount) },
  { key: 'balance_due', label: 'Balance', align: 'right',
    render: (row) => <span className="font-semibold text-rose-600">{money(row.balance_due)}</span> },
  { key: 'days_overdue', label: 'Days overdue', align: 'right',
    render: (row) => (row.days_overdue > 0
      ? <span className="font-semibold text-rose-600">{count(row.days_overdue)}</span>
      : <span className="text-slate-400">-</span>) },
  { key: 'bucket', label: 'Bucket', render: (row) => row.bucket ?? '-' },
]

const DEBTOR_COLUMNS = [
  { key: 'customer', label: 'Customer', render: (row) => truncate(nameOf(row.customer ?? row.name), 34) },
  { key: 'invoices_count', label: 'Invoices', align: 'right', render: (row) => count(row.invoices_count ?? row.count ?? 0) },
  { key: 'balance', label: 'Outstanding', align: 'right',
    render: (row) => <span className="font-semibold text-rose-600">{money(row.balance_due ?? row.balance ?? row.total)}</span> },
]

const PAYABLE_COLUMNS = [
  { key: 'code', label: 'Code', render: (row) => <span className="font-mono text-xs text-slate-500">{row.code ?? '-'}</span> },
  { key: 'name', label: 'Supplier', render: (row) => truncate(row.name, 36) },
  { key: 'orders_count', label: 'Orders', align: 'right', render: (row) => count(row.orders_count) },
  { key: 'total', label: 'Purchased', align: 'right', render: (row) => money(row.total) },
  { key: 'paid', label: 'Paid', align: 'right', render: (row) => money(row.paid) },
  { key: 'balance', label: 'Balance', align: 'right', render: (row) => <span className="font-semibold text-amber-600">{money(row.balance)}</span> },
]

const MOVEMENT_COLUMNS = [
  { key: 'type', label: 'Type', render: (row) => <StatusBadge group="movement_type" value={row.type} /> },
  { key: 'movements', label: 'Movements', align: 'right', render: (row) => count(row.movements) },
  { key: 'quantity', label: 'Quantity', align: 'right', render: (row) => formatNumber(row.quantity ?? 0, 0) },
  { key: 'value', label: 'Value', align: 'right', render: (row) => money(row.value) },
]

const BUCKET_COLUMNS = [
  { key: 'bucket', label: 'Ageing bucket' },
  { key: 'invoices', label: 'Invoices', align: 'right', render: (row) => count(row.invoices) },
  { key: 'amount', label: 'Outstanding', align: 'right', render: (row) => money(row.amount) },
  { key: 'share', label: 'Share', align: 'right',
    render: (row) => (
      <div className="flex items-center justify-end gap-2">
        <ProgressBar value={row.share} tone={row.key === 'current' ? 'green' : 'amber'} className="w-16" />
        <span className="w-14 text-right">{formatPercent(row.share, 0)}</span>
      </div>
    ) },
]

function isEmphasised(type) {
  const value = String(type ?? '').toLowerCase()
  return value.includes('subtotal') || value.includes('total') || value === 'net'
}

export default function Reports() {
  const [tab, setTab] = useState(TABS[0].key)
  const [period, setPeriod] = useState({ from: isoDay(-29), to: todayISO() })
  const [valuationFilters, setValuationFilters] = useState({ category_id: '', warehouse_id: '' })

  const active = TABS.find((entry) => entry.key === tab) ?? TABS[0]

  const params = useMemo(() => {
    const base = { from: period.from, to: period.to }

    if (tab === 'stock-valuation') {
      return cleanParams({ ...base, ...valuationFilters })
    }

    return cleanParams(base)
  }, [period, tab, valuationFilters])

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['reports', tab, params],
    queryFn: () => get(`reports/${active.endpoint}`, params).then((response) => response.data),
  })

  const { data: categoriesData } = useQuery({
    queryKey: ['categories', 'all'],
    queryFn: () => get('categories', { per_page: 100 }).then((response) => response.data.data),
    enabled: tab === 'stock-valuation',
  })

  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses', 'all'],
    queryFn: () => get('warehouses', { per_page: 100 }).then((response) => response.data.data),
    enabled: tab === 'stock-valuation',
  })

  const selectTab = (key) => {
    setTab(key)
    setPeriod({ from: isoDay(-29), to: todayISO() })
  }

  const totals = data?.totals ?? {}
  const rows = data?.rows ?? []
  const bucketData = data?.buckets ?? {}
  const bucketsTotal = BUCKETS.reduce((sum, entry) => {
    const bucket = bucketData[entry.key]
    if (bucket && typeof bucket === 'object') return sum + Number(bucket.amount ?? bucket.total ?? 0)
    return sum + Number(bucket ?? 0)
  }, 0)

  const bucketRows = BUCKETS.map((entry) => {
    const bucket = bucketData[entry.key]
    const object = bucket && typeof bucket === 'object' ? bucket : null
    const amount = Number(object ? object.amount ?? object.total ?? 0 : bucket ?? 0)

    return {
      key: entry.key,
      bucket: entry.label,
      invoices: Number(object ? object.count ?? object.invoices ?? 0 : 0),
      amount,
      share: bucketsTotal ? (amount / bucketsTotal) * 100 : 0,
    }
  })

  const renderSalesSummary = () => {
    const trend = data?.trend ?? []
    const byStatus = data?.by_status ?? []
    const byCustomer = data?.by_customer ?? []
    const byProduct = data?.by_product ?? []

    return (
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard label="Orders" value={count(totals.orders_count)} hint="In the selected period" icon={null} tone="brand" />
          <StatCard label="Sales total" value={money(totals.sales_total)} hint={`Cancelled ${money(totals.cancelled_total)}`} tone="green" />
          <StatCard label="Average order value" value={money(totals.average_order_value)} tone="violet" />
          <StatCard label="Invoiced" value={money(totals.invoiced_total)} tone="brand" />
          <StatCard label="Collected" value={money(totals.collected_total)} tone="green" />
          <StatCard label="Outstanding" value={money(totals.outstanding_total)} tone="amber" />
        </div>

        <Card>
          <CardHeader title="Daily sales" subtitle="Invoiced value per day" />
          <CardBody>
            {trend.length === 0 ? (
              <EmptyState title="No sales in this period" description="Widen the date range or record an invoice." />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={trend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid {...GRID} />
                  <XAxis dataKey="label" {...AXIS} tickFormatter={(value) => truncate(value, 12)} minTickGap={16} />
                  <YAxis {...AXIS} width={72} tickFormatter={(value) => formatCurrency(value).replace(/\.00$/, '')} />
                  <Tooltip
                    formatter={(value, name) => (name === 'total' ? formatCurrency(value) : formatNumber(value, 0))}
                    contentStyle={TOOLTIP_STYLE}
                  />
                  <Line type="monotone" dataKey="total" name="total" stroke={PALETTE.primary} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="orders" name="orders" stroke={PALETTE.sky} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Sales by status" subtitle="Order count and value per status" />
          <DataTable
            columns={BY_STATUS_COLUMNS}
            rows={byStatus}
            emptyTitle="No orders in this period"
            filename={`sales-by-status-${period.from}_${period.to}.csv`}
          />
        </Card>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <Card>
            <CardHeader title="Sales by customer" subtitle="Top customers in the period" />
            <DataTable columns={BY_CUSTOMER_COLUMNS} rows={byCustomer} emptyTitle="No customer sales" filename="sales-by-customer.csv" />
          </Card>
          <Card>
            <CardHeader title="Sales by product" subtitle="Products sold in the period" />
            <DataTable columns={BY_PRODUCT_COLUMNS} rows={byProduct} emptyTitle="No product sales" filename="sales-by-product.csv" />
          </Card>
        </div>
      </div>
    )
  }

  const renderTopProducts = () => (
    <Card>
      <CardHeader title="Top products" subtitle="Quantity, revenue, cost and margin per product" />
      <DataTable
        columns={TOP_PRODUCT_COLUMNS}
        rows={rows}
        emptyTitle="No product sales"
        emptyDescription="Products appear here once they are sold in the period."
        filename={`top-products-${period.from}_${period.to}.csv`}
      />
    </Card>
  )

  const renderSalesByCustomer = () => (
    <Card>
      <CardHeader title="Sales by customer" subtitle="Order count, total sales and average order value" />
      <DataTable
        columns={CUSTOMER_SALES_COLUMNS}
        rows={rows}
        emptyTitle="No customer sales"
        emptyDescription="Customers appear here once they place orders in the period."
        filename={`sales-by-customer-${period.from}_${period.to}.csv`}
      />
    </Card>
  )

  const renderStockValuation = () => (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Stock lines" value={count(totals.lines)} hint={`${formatNumber(totals.quantity ?? 0, 0)} units on hand`} tone="brand" />
        <StatCard label="Cost value" value={money(totals.cost_value)} tone="violet" />
        <StatCard label="Retail value" value={money(totals.retail_value)} tone="sky" />
        <StatCard label="Potential profit" value={money(totals.potential_profit)} tone="green" />
      </div>

      <Card>
        <CardHeader title="Stock valuation" subtitle="Cost against retail value per product" />
        <DataTable
          columns={VALUATION_COLUMNS}
          rows={rows}
          emptyTitle="No stock to value"
          emptyDescription="Receive stock or adjust the category and warehouse filters."
          filename="stock-valuation.csv"
        />
      </Card>
    </div>
  )

  const renderLowStock = () => (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Products to reorder" value={count(totals.count)} tone="amber" />
        <StatCard label="Out of stock" value={count(totals.out_of_stock)} tone="rose" />
        <StatCard label="Estimated reorder cost" value={money(totals.estimated_reorder_cost)} tone="brand" />
      </div>

      <Card>
        <CardHeader title="Low stock" subtitle="On hand quantity against the reorder level" />
        <DataTable
          columns={LOW_STOCK_COLUMNS}
          rows={rows}
          emptyTitle="Stock levels are healthy"
          emptyDescription="No product is at or below its reorder level."
          filename="low-stock.csv"
        />
      </Card>
    </div>
  )

  const renderReceivables = () => (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Outstanding" value={money(totals.outstanding)} hint="Across all open invoices" tone="rose" />
        <StatCard label="Overdue" value={money(totals.overdue)} hint="Past the due date" tone="amber" />
        <StatCard label="Open invoices" value={count(totals.invoices_count)} tone="brand" />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Ageing buckets" subtitle="Outstanding balance by days overdue" />
          <DataTable columns={BUCKET_COLUMNS} rows={bucketRows} emptyTitle="No outstanding invoices" />
        </Card>
        <Card>
          <CardHeader title="Top debtors" subtitle="Largest outstanding balances" />
          <DataTable columns={DEBTOR_COLUMNS} rows={data?.top_debtors ?? []} emptyTitle="No debtors" />
        </Card>
      </div>

      <Card>
        <CardHeader title="Outstanding invoices" subtitle="Invoice level detail" />
        <DataTable
          columns={RECEIVABLE_COLUMNS}
          rows={rows}
          emptyTitle="No outstanding invoices"
          filename="receivables.csv"
        />
      </Card>
    </div>
  )

  const renderPayables = () => (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Suppliers" value={count(totals.suppliers_count)} tone="brand" />
        <StatCard label="Purchases" value={money(totals.purchases_total)} tone="violet" />
        <StatCard label="Balance payable" value={money(totals.balance)} tone="amber" />
      </div>

      <Card>
        <CardHeader title="Payables by supplier" subtitle="Purchased, paid and outstanding per supplier" />
        <DataTable
          columns={PAYABLE_COLUMNS}
          rows={rows}
          emptyTitle="No purchases"
          emptyDescription="Suppliers appear here once purchase orders are received."
          filename="payables.csv"
        />
      </Card>
    </div>
  )

  const renderStockMovements = () => (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Stock value" value={money(totals.stock_value)} tone="brand" />
        <StatCard label="Stock quantity" value={formatNumber(totals.stock_quantity ?? 0, 0)} tone="violet" />
        <StatCard label="Reserved" value={formatNumber(totals.reserved_quantity ?? 0, 0)} tone="amber" />
        <StatCard label="Movements" value={count(totals.movements)} hint="In the selected period" tone="sky" />
      </div>

      <Card>
        <CardHeader title="Movements by type" subtitle="Count, quantity and value per movement type" />
        <DataTable
          columns={MOVEMENT_COLUMNS}
          rows={data?.by_type ?? []}
          emptyTitle="No stock movements"
          filename="stock-movements.csv"
        />
      </Card>
    </div>
  )

  const renderProfitLoss = () => {
    const lines = data?.lines ?? []

    return (
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Net sales" value={money(totals.net_sales)} tone="brand" />
          <StatCard label="Cost of goods sold" value={money(totals.cogs)} tone="rose" />
          <StatCard
            label="Gross profit"
            value={money(totals.gross_profit)}
            tone={Number(totals.gross_profit ?? 0) < 0 ? 'rose' : 'green'}
            hint={totals.margin_percent !== undefined ? `Margin ${formatPercent(totals.margin_percent)}` : undefined}
          />
          <StatCard label="Gross margin" value={formatPercent(totals.margin_percent)} tone="violet" />
        </div>

        <Card>
          <CardHeader title="Profit & loss statement" subtitle={`${formatDate(period.from)} – ${formatDate(period.to)}`} />
          {lines.length === 0 ? (
            <EmptyState title="No statement data" description="Record sales and purchase receipts to build a statement." />
          ) : (
            <>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Line</th>
                      <th>Type</th>
                      <th className="text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((line, index) => (
                      <tr key={`${line.label}-${index}`} className={cn(isEmphasised(line.type) && 'bg-slate-50/80')}>
                        <td className={cn(isEmphasised(line.type) && 'font-semibold text-slate-900')}>{line.label}</td>
                        <td className="text-xs uppercase tracking-wide text-slate-400">{line.type ?? '-'}</td>
                        <td
                          className={cn(
                            'text-right tabular',
                            isEmphasised(line.type) ? 'font-bold text-slate-900' : 'text-slate-700',
                            Number(line.amount ?? 0) < 0 && 'text-rose-600',
                          )}
                        >
                          {money(line.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between gap-4 border-t border-slate-200 bg-slate-50/60 px-5 py-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Gross profit</p>
                  <p className="mt-1 text-xl font-bold tabular text-slate-900">{money(totals.gross_profit)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Margin</p>
                  <p className="mt-1 text-xl font-bold tabular text-emerald-600">{formatPercent(totals.margin_percent)}</p>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>
    )
  }

  const content = {
    'sales-summary': renderSalesSummary,
    'top-products': renderTopProducts,
    'sales-by-customer': renderSalesByCustomer,
    'stock-valuation': renderStockValuation,
    'low-stock': renderLowStock,
    receivables: renderReceivables,
    payables: renderPayables,
    'stock-movements': renderStockMovements,
    'profit-loss': renderProfitLoss,
  }[tab]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Reports"
        subtitle={`${formatDate(period.from)} – ${formatDate(period.to)} · ${active.label}`}
        actions={
          <Button variant="secondary" onClick={() => refetch()} loading={isFetching}>
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
        }
      />

      <Card>
        <div className="flex flex-wrap gap-1 border-b border-slate-200 p-2">
          {TABS.map((entry) => (
            <Button
              key={entry.key}
              size="sm"
              variant={entry.key === tab ? 'primary' : 'ghost'}
              onClick={() => selectTab(entry.key)}
            >
              {entry.label}
            </Button>
          ))}
        </div>

        <div className="flex flex-wrap items-end gap-3 px-4 py-3">
          <div className="flex items-center gap-2 text-slate-400">
            <CalendarRange className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wide">Period</span>
          </div>
          <Input
            type="date" value={period.from} max={period.to} className="w-40" aria-label="Period start"
            onChange={(event) => setPeriod((state) => ({ ...state, from: event.target.value }))}
          />
          <Input
            type="date" value={period.to} min={period.from} className="w-40" aria-label="Period end"
            onChange={(event) => setPeriod((state) => ({ ...state, to: event.target.value }))}
          />
          <Button variant="secondary" size="sm" onClick={() => setPeriod({ from: isoDay(-29), to: todayISO() })}>
            Last 30 days
          </Button>

          {tab === 'stock-valuation' && (
            <>
              <div className="flex-1" />
              <Select
                className="w-52" placeholder="All categories" value={valuationFilters.category_id}
                options={(categoriesData ?? []).map((category) => ({ value: category.id, label: category.name }))}
                onChange={(event) => setValuationFilters((state) => ({ ...state, category_id: event.target.value }))}
              />
              <Select
                className="w-52" placeholder="All warehouses" value={valuationFilters.warehouse_id}
                options={(warehousesData ?? []).map((warehouse) => ({ value: warehouse.id, label: warehouse.name }))}
                onChange={(event) => setValuationFilters((state) => ({ ...state, warehouse_id: event.target.value }))}
              />
            </>
          )}
        </div>
      </Card>

      {isLoading ? (
        <Card>
          <LoadingState label="Loading report…" />
        </Card>
      ) : isError ? (
        <Card>
          <ErrorState error={error} onRetry={refetch} />
        </Card>
      ) : (
        content()
      )}
    </div>
  )
}