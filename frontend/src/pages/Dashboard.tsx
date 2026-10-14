import { useEffect, useState } from 'react';
import { Grid, Card, CardContent, Typography, Box, CircularProgress, Chip, Button, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Tab, Tabs } from '@mui/material';
import { TrendingUp, TrendingDown, ShoppingCart, LocalShipping, Receipt, Inventory, People, AttachMoney, AccountBalance, Schedule } from '@mui/icons-material';
import { formatCurrency, formatNumber } from '../lib/format';
import { api } from '../lib/api';
import { dashboardService } from '../services/dashboardService';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  trend?: { value: number; label: string };
}

function StatCard({ title, value, icon, color, trend }: StatCardProps) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>{title}</Typography>
            <Typography variant="h4" fontWeight={700} sx={{ mb: 0.5 }}>{value}</Typography>
            {trend && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {trend.value >= 0 ? <TrendingUp fontSize="small" color="success" /> : <TrendingDown fontSize="small" color="error" />}
                <Typography variant="body2" color={trend.value >= 0 ? 'success.main' : 'error.main'}>
                  {Math.abs(trend.value)}% {trend.label}
                </Typography>
              </Box>
            )}
          </Box>
          <Box sx={{ p: 1, borderRadius: 2, bgcolor: `${color}.light`, color: `${color}.main` }}>{icon}</Box>
        </Box>
      </CardContent>
    </Card>
  );
}

interface RecentOrderRow {
  id: string;
  number: string;
  customer: string;
  date: string;
  status: string;
  total: number;
}

export default function Dashboard() {
  const [overview, setOverview] = useState<any>(null);
  const [salesChart, setSalesChart] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [topCustomers, setTopCustomers] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrderRow[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [overviewRes, chartRes, productsRes, customersRes] = await Promise.all([
          api.get('/dashboard/overview'),
          api.get('/dashboard/sales-chart'),
          api.get('/dashboard/top-products'),
          api.get('/dashboard/top-customers'),
        ]);
        setOverview(overviewRes.data.stats);
        setSalesChart(chartRes.data);
        setTopProducts(productsRes.data);
        setTopCustomers(customersRes.data);

        const [ordersRes, invoicesRes] = await Promise.all([
          api.get('/sales-orders', { params: { limit: 5, sortBy: 'createdAt', sortOrder: 'desc' } }),
          api.get('/invoices', { params: { limit: 5, sortBy: 'createdAt', sortOrder: 'desc' } }),
        ]);
        setRecentOrders(ordersRes.data.data.map((o: any) => ({
          id: o.id,
          number: o.number,
          customer: o.customer?.name || '-',
          date: o.orderDate,
          status: o.status,
          total: o.grandTotal,
        })));
        setRecentInvoices(invoicesRes.data.data);
      } catch (error) {
        console.error('Dashboard error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: 3 }}>
        {[...Array(4)].map((_, i) => (
          <Card key={i}><CardContent><Skeleton variant="rectangular" height={80} /></CardContent></Card>
        ))}
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h4" fontWeight={600}>Dashboard</Typography>
        <Chip label="Live" icon={<Box component="span" sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.main', animation: 'pulse 2s infinite' }} />} color="success" size="small" variant="outlined" />
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Revenue"
            value={formatCurrency(overview?.salesRevenue || 0)}
            icon={<AttachMoney />}
            color="success"
            trend={{ value: 12.5, label: 'vs last month' }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Orders"
            value={formatNumber(overview?.salesOrders || 0)}
            icon={<ShoppingCart />}
            color="primary"
            trend={{ value: 8.2, label: 'vs last month' }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Outstanding Receivables"
            value={formatCurrency(overview?.outstandingReceivables || 0)}
            icon={<AccountBalance />}
            color="warning"
            trend={{ value: -5.3, label: 'vs last month' }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Low Stock Items"
            value={overview?.lowStockCount || 0}
            icon={<Inventory />}
            color={overview?.lowStockCount > 10 ? 'error' : 'info'}
            trend={{ value: overview?.lowStockCount > 10 ? 15 : -3, label: 'items need attention' }}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight={600}>Sales Overview</Typography>
                <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" sx={{ minWidth: 200 }}>
                  <Tab label="Last 30 Days" />
                  <Tab label="This Quarter" />
                  <Tab label="This Year" />
                </Tabs>
              </Box>
              <Box sx={{ height: 300 }}>
                {salesChart.length > 0 ? (
                  <SalesChart data={salesChart} />
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'text.secondary' }}>
                    No sales data available
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>Top Products</Typography>
              {topProducts.length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {topProducts.slice(0, 5).map((item: any, i: number) => (
                    <Box key={item.product?.id || i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Chip label={`${i + 1}`} size="small" variant="outlined" color="primary" sx={{ width: 28, height: 28, fontSize: '0.75rem' }} />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={500} noWrap>{item.product?.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{formatNumber(item.quantitySold)} sold</Typography>
                      </Box>
                      <Typography variant="body2" fontWeight={600} color="primary.main">{formatCurrency(item.revenue)}</Typography>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">No data available</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>Recent Sales Orders</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Order #</TableCell>
                      <TableCell>Customer</TableCell>
                      <TableCell align="right">Date</TableCell>
                      <TableCell align="right">Total</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentOrders.map(order => (
                      <TableRow key={order.id} hover>
                        <TableCell><strong>{order.number}</strong></TableCell>
                        <TableCell>{order.customer}</TableCell>
                        <TableCell align="right">{order.date}</TableCell>
                        <TableCell align="right">{formatCurrency(order.total)}</TableCell>
                        <TableCell>
                          <Chip label={order.status} size="small" variant="outlined" color={getStatusColor(order.status)} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>Recent Invoices</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Invoice #</TableCell>
                      <TableCell>Customer</TableCell>
                      <TableCell align="right">Date</TableCell>
                      <TableCell align="right">Total</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentInvoices.map((inv: any) => (
                      <TableRow key={inv.id} hover>
                        <TableCell><strong>{inv.number}</strong></TableCell>
                        <TableCell>{inv.customer?.name || '-'}</TableCell>
                        <TableCell align="right">{inv.invoiceDate}</TableCell>
                        <TableCell align="right">{formatCurrency(inv.grandTotal)}</TableCell>
                        <TableCell>
                          <Chip label={inv.status} size="small" variant="outlined" color={getInvoiceStatusColor(inv.status)} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

function SalesChart({ data }: { data: any[] }) {
  const maxValue = Math.max(...data.map(d => d.total));
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '100%', px: 1, pb: 1 }}>
      {data.map((d, i) => (
        <Box key={i} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: 20 }}>
          <Box
            sx={{
              width: '100%',
              maxWidth: 30,
              height: `${(d.total / maxValue) * 250}px`,
              minHeight: 4,
              borderRadius: '4px 4px 0 0',
              bgcolor: 'primary.main',
              transition: 'height 0.3s ease',
              '&:hover': { bgcolor: 'primary.dark' },
            }}
            title={`${d.date}: ${formatCurrency(d.total)}`}
          />
          <Typography variant="caption" sx={{ mt: 1, textAlign: 'center', whiteSpace: 'nowrap' }}>
            {d.date.split('-').slice(1).join('-')}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

function getStatusColor(status: string) {
  const colors: Record<string, 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'> = {
    draft: 'default',
    confirmed: 'info',
    shipped: 'primary',
    completed: 'success',
    cancelled: 'error',
    ordered: 'info',
    received: 'success',
    sent: 'info',
    paid: 'success',
    partial: 'warning',
  };
  return colors[status] || 'default';
}

function getInvoiceStatusColor(status: string) {
  return getStatusColor(status);
}

import { Skeleton } from '@mui/material';