import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  AlertTriangle,
  Banknote,
  Boxes,
  Building2,
  Package,
  Receipt,
  RefreshCw,
  ShoppingCart,
  TrendingUp,
  Truck,
  UserCog,
  Users,
  Wallet,
} from 'lucide-react'
import { get } from '../lib/api'
import { cleanParams, cn, startOfMonthISO, todayISO } from '../lib/utils'
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatNumber,
  truncate,
} from '../lib/format'
import { badgeTone, label as statusLabel } from '../lib/status'
import { PageHeader, StatCard } from '../components/ui/DataDisplay'
import { Card, CardBody, CardHeader } from '../components/ui/Card'
import Button from '../components/ui/Button'
import { Input } from '../components/ui/Form'
import { StatusBadge } from '../components/ui/Badge'
import { EmptyState, ErrorState, LoadingState } from '../components/ui/Feedback'

const PALETTE = ['#3366ff', '#10b981', '#f59e0b', '#8b5cf6', '#f43f5e', '#0ea5e9']

const AXIS = { stroke: '#94a3b8', fontSize: 11, tickLine: false, axisLine: false }
const GRID = { strokeDasharray: '3 3', stroke: '#e2e8f0', vertical: false }

export default function Dashboard() {
  const [draft, setDraft] = useState({ from: startOfMonthISO(), to: todayISO() })
  const [range, setRange] = useState(draft)

  const params = useMemo(() => cleanParams({ from: range.from, to: range.to }), [range])

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['dashboard', params],
    queryFn: () => get('dashboard', params).then((response) => response.data),
  })

  const applyRange = () => {
    const from = draft.from || startOfMonthISO()
    const to = draft.to || todayISO()

    setRange(from <= to ? { from, to } : { from: to, to: from })
  }

  const section = (children) => {
    if (isLoading) return <LoadingState label="Loading dashboard…" />
    if (isError) return <ErrorState error={error} onRetry={refetch} />
    return children
  }

  const kpis = data?.kpis ?? {}
  const period = data?.period
  const salesTrend = data?.sales_trend ?? []
  const topProducts = data?.top_products ?? []
  const lowStock = data?.low_stock ?? []
  const recentOrders = data?.recent_orders ?? []
  const recentPayments = data?.recent_payments ?? []
  const statusBreakdown = data?.order_status_breakdown ?? []

  const statusChart = statusBreakdown.map((entry, index) => ({
    name: statusLabel('order_status', entry.status),
    value: Number(entry.count ?? 0),
    color: PALETTE[index % PALETTE.length],
  }))

  const totalOrders = statusChart.reduce((sum, entry) => sum + entry.value, 0)

  return (
    <div className="space-y-5">
      <PageHeader
        title="Dashboard"
        subtitle={
          period
            ? `${formatDate(period.from)} – ${formatDate(period.to)}`
            : 'Business overview at a glance'
        }
        actions={
          <>
            <Input
              type="date" value={draft.from} max={draft.to} className="w-40" aria-label="Period start"
              onChange={(event) => setDraft((state) => ({ ...state, from: event.target.value }))}
            />
            <Input
              type="date" value={draft.to} min={draft.from} className="w-40" aria-label="Period end"
              onChange={(event) => setDraft((state) => ({ ...state, to: event.target.value }))}
            />
            <Button onClick={applyRange}>Apply</Button>
            <Button variant="secondary" onClick={() => refetch()} loading={isFetching}>
              <RefreshCw className="h-4 w-4" /> Refresh
            </Button>
          </>
        }
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {section(
          <>
            <StatCard
              label="Sales" value={formatCurrency(kpis.sales_total ?? 0)} icon={TrendingUp} tone="brand"
              trend={kpis.sales_change_percent ?? 0}
              hint={`${formatNumber(kpis.open_sales_orders ?? 0, 0)} open sales orders`}
            />
            <StatCard
              label="Cash collected" value={formatCurrency(kpis.cash_collected ?? 0)} icon={Banknote} tone="green"
              trend={kpis.cash_change_percent ?? 0}
              hint={`Invoiced ${formatCurrency(kpis.invoiced_total ?? 0)}`}
            />
            <StatCard
              label="Stock value" value={formatCurrency(kpis.stock_value ?? 0)} icon={Boxes} tone="violet"
              hint={`${formatNumber(kpis.products_count ?? 0, 0)} products in catalogue`}
            />
            <StatCard
              label="Receivable" value={formatCurrency(kpis.receivable ?? 0)} icon={Wallet} tone="amber"
              hint={`Payable ${formatCurrency(kpis.payable ?? 0)}`}
            />
          </>,
        )}
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {section(
          <>
            <StatCard
              label="Open sales orders" value={formatNumber(kpis.open_sales_orders ?? 0, 0)}
              hint="Draft, confirmed, invoiced or shipped" icon={ShoppingCart} tone="brand"
            />
            <StatCard
              label="Open invoices" value={formatNumber(kpis.open_invoices ?? 0, 0)}
              hint="Not fully settled" icon={Receipt} tone="violet"
            />
            <StatCard
              label="Open purchase orders" value={formatNumber(kpis.open_purchase_orders ?? 0, 0)}
              hint="Awaiting receipt" icon={Truck} tone="slate"
            />
            <StatCard
              label="Low stock" value={formatNumber(kpis.low_stock_count ?? 0, 0)} icon={AlertTriangle} tone="red"
              hint={`${formatNumber(kpis.out_of_stock_count ?? 0, 0)} out of stock`}
            />
          </>,
        )}
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {section(
          <>
            <StatCard
              label="Products" value={formatNumber(kpis.active_products_count ?? 0, 0)}
              hint="Active in catalogue" icon={Package} tone="slate"
            />
            <StatCard
              label="Customers" value={formatNumber(kpis.active_customers_count ?? 0, 0)}
              hint="Active accounts" icon={Users} tone="brand"
            />
            <StatCard
              label="Suppliers" value={formatNumber(kpis.suppliers_count ?? 0, 0)}
              hint="Registered vendors" icon={Building2} tone="green"
            />
            <StatCard
              label="Users" value={formatNumber(kpis.users_count ?? 0, 0)}
              hint={`${formatNumber(kpis.stock_movements_today ?? 0, 0)} movements today`} icon={UserCog} tone="violet"
            />
          </>,
        )}
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Sales trend" subtitle="Last six months invoiced sales" />
          {section(
            salesTrend.length === 0 ? (
              <EmptyState title="No sales recorded" description="Sales will appear here once orders are invoiced." />
            ) : (
              <CardBody>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={salesTrend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3366ff" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#3366ff" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid {...GRID} />
                    <XAxis dataKey="label" {...AXIS} />
                    <YAxis {...AXIS} width={72} tickFormatter={(value) => formatCurrency(value).replace(/\.00$/, '')} />
                    <Tooltip formatter={(value) => formatCurrency(value)} contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                    <Area type="monotone" dataKey="total" name="Sales" stroke="#3366ff" strokeWidth={2} fill="url(#salesFill)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardBody>
            ),
          )}
        </Card>

        <Card>
          <CardHeader title="Orders by status" subtitle={`${formatNumber(totalOrders, 0)} orders in the period`} />
          {section(
            statusChart.length === 0 ? (
              <EmptyState title="No orders yet" description="Order statuses will be summarised here." />
            ) : (
              <CardBody className="space-y-4">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={statusChart} dataKey="value" nameKey="name" innerRadius={54} outerRadius={86} paddingAngle={2}>
                      {statusChart.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} stroke="#fff" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatNumber(value, 0)} contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>

                <ul className="space-y-2">
                  {statusBreakdown.map((entry, index) => (
                    <li key={entry.status ?? index} className="flex items-center justify-between gap-3 text-sm">
                      <span className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: PALETTE[index % PALETTE.length] }}
                        />
                        <span
                          className={cn(
                            'rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
                            badgeTone('order_status', entry.status),
                          )}
                        >
                          {statusLabel('order_status', entry.status)}
                        </span>
                      </span>
                      <span className="tabular font-semibold text-slate-700">
                        {formatNumber(entry.count ?? 0, 0)}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardBody>
            ),
          )}
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Top products"
            subtitle="Best sellers by revenue"
            actions={
              <Link to="/products" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
                View catalogue
              </Link>
            }
          />
          {section(
            topProducts.length === 0 ? (
              <EmptyState title="No product sales" description="Top sellers appear once products are sold." />
            ) : (
              <CardBody>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={topProducts} margin={{ top: 8, right: 8, left: 0, bottom: 40 }}>
                    <CartesianGrid {...GRID} />
                    <XAxis
                      dataKey="name"
                      {...AXIS}
                      angle={-25}
                      textAnchor="end"
                      height={60}
                      interval={0}
                      tickFormatter={(value) => truncate(value, 18)}
                    />
                    <YAxis {...AXIS} width={72} tickFormatter={(value) => formatCurrency(value).replace(/\.00$/, '')} />
                    <Tooltip
                      formatter={(value) => formatCurrency(value)}
                      contentStyle={{ borderRadius: 10, fontSize: 12 }}
                    />
                    <Bar dataKey="revenue" name="Revenue" fill="#3366ff" radius={[6, 6, 0, 0]} maxBarSize={48} />
                  </BarChart>
                </ResponsiveContainer>
              </CardBody>
            ),
          )}
        </Card>

        <Card>
          <CardHeader
            title="Low stock alerts"
            subtitle="At or below the reorder level"
            actions={
              <Link to="/inventory/low-stock" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
                View all
              </Link>
            }
          />
          {section(
            lowStock.length === 0 ? (
              <EmptyState icon={Package} title="Stock levels are healthy" description="No products need reordering." />
            ) : (
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Product</th>
                      <th className="text-right">Stock</th>
                      <th className="text-right">Reorder</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStock.map((item) => (
                      <tr key={item.id}>
                        <td className="whitespace-nowrap font-mono text-xs text-slate-500">{item.code}</td>
                        <td className="max-w-[14rem] truncate font-medium text-slate-800">{item.name}</td>
                        <td className="text-right tabular font-semibold text-rose-600">
                          {formatNumber(item.total_stock ?? 0, 0)}
                        </td>
                        <td className="text-right tabular text-slate-500">
                          {formatNumber(item.reorder_level ?? 0, 0)}
                        </td>
                        <td>
                          <StatusBadge group="stock_status" value={item.stock_status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ),
          )}
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Recent orders"
            subtitle="Latest sales orders"
            actions={
              <Link to="/sales-orders" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
                View all
              </Link>
            }
          />
          {section(
            recentOrders.length === 0 ? (
              <EmptyState icon={ShoppingCart} title="No sales orders" description="New orders will show up here." />
            ) : (
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Number</th>
                      <th>Customer</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th className="text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order) => (
                      <tr key={order.id}>
                        <td className="whitespace-nowrap font-mono text-xs font-semibold text-slate-700">
                          {order.number}
                        </td>
                        <td className="max-w-[12rem] truncate">{order.customer ?? '—'}</td>
                        <td className="whitespace-nowrap text-slate-500">{formatDate(order.order_date)}</td>
                        <td>
                          <StatusBadge group="order_status" value={order.status} />
                        </td>
                        <td className="text-right tabular font-medium">{formatCurrency(order.grand_total ?? 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ),
          )}
        </Card>

        <Card>
          <CardHeader title="Recent payments" subtitle="Latest cash received" />
          {section(
            recentPayments.length === 0 ? (
              <EmptyState icon={Banknote} title="No payments yet" description="Recorded payments will show up here." />
            ) : (
              <CardBody className="px-0 py-0">
                <ul className="divide-y divide-slate-100">
                  {recentPayments.map((payment) => (
                    <li key={payment.id} className="flex items-center justify-between gap-3 px-5 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-800">
                          {payment.customer ?? 'Walk-in customer'}
                        </p>
                        <p className="truncate text-xs text-slate-400">
                          {statusLabel('payment_method', payment.method)} · {formatDateTime(payment.paid_at)}
                        </p>
                      </div>
                      <p className="tabular shrink-0 text-sm font-semibold text-emerald-600">
                        {formatCurrency(payment.amount ?? 0)}
                      </p>
                    </li>
                  ))}
                </ul>
              </CardBody>
            ),
          )}
        </Card>
      </section>
    </div>
  )
}