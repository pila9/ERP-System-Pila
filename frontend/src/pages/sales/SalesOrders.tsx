import { useEffect, useState } from 'react';
import { Box, Grid, Card, CardContent, Typography, Button, Chip, TableContainer, Table, TableHead, TableBody, TableRow, TableCell, Paper, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem, TextField } from '@mui/material';
import { Controller } from 'react-hook-form';
import { Add, Edit, Delete, Search, FilterList } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../../lib/api';
import { DataDisplay, FilterBar, ConfirmDialog } from '../../components/ui';
import { formatCurrency, formatDate } from '../../lib/format';
import { useToast } from '../../context/ToastContext';
import { orderStatuses } from '../../lib/status';

const salesOrderSchema = z.object({
  customerId: z.string().uuid('Select a customer'),
  warehouseId: z.string().uuid().nullable().optional(),
  orderDate: z.string().min(1, 'Required'),
  expectedDate: z.string().optional(),
  status: z.enum(['draft', 'confirmed', 'shipped', 'completed', 'cancelled']).default('draft'),
  discountType: z.enum(['fixed', 'percentage']).default('fixed'),
  discountValue: z.number().min(0).default(0),
  shipping: z.number().min(0).default(0),
  notes: z.string().optional(),
  terms: z.string().optional(),
  reference: z.string().optional(),
  items: z.array(z.object({
    productId: z.string().uuid(),
    warehouseId: z.string().uuid().nullable().optional(),
    quantity: z.number().positive(),
    unitPrice: z.number().min(0),
    unitCost: z.number().min(0).optional(),
    discount: z.number().min(0).default(0),
    taxRate: z.number().min(0).max(100).default(0),
    description: z.string().optional(),
  })).min(1, 'At least one item required'),
});

type SalesOrderForm = z.infer<typeof salesOrderSchema>;

interface SalesOrder {
  id: string;
  number: string;
  customer: { name: string };
  orderDate: string;
  status: string;
  grandTotal: number;
  items: any[];
  createdAt: string;
}

export default function SalesOrders() {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<SalesOrder | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<SalesOrder | null>(null);
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const { showToast } = useToast();

  const { register, handleSubmit: handleFormSubmit, reset, setValue, watch, formState: { errors } } = useForm<SalesOrderForm>({
    resolver: zodResolver(salesOrderSchema),
    defaultValues: { items: [{ productId: '', quantity: 1, unitPrice: 0, discount: 0, taxRate: 0 }] },
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordersRes, customersRes, productsRes, warehousesRes] = await Promise.all([
        api.get('/sales-orders', { params: { page, limit, ...filters } }),
        api.get('/customers', { params: { limit: 1000, isActive: true } }),
        api.get('/products', { params: { limit: 1000, isActive: true } }),
        api.get('/warehouses', { params: { limit: 1000, isActive: true } }),
      ]);
      setOrders(ordersRes.data.data);
      setTotal(ordersRes.data.meta.total);
      setCustomers(customersRes.data.data);
      setProducts(productsRes.data.data);
      setWarehouses(warehousesRes.data.data);
    } catch (error) {
      showToast('Failed to fetch data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [page, filters]);

  const handleSearch = (newFilters: Record<string, any>) => { setFilters(newFilters); setPage(1); };
  const handleClear = () => { setFilters({}); setPage(1); };

  const openCreate = () => {
    setEditingOrder(null);
    reset({ status: 'draft', discountType: 'fixed', discountValue: 0, shipping: 0, items: [{ productId: '', quantity: 1, unitPrice: 0, discount: 0, taxRate: 0 }] });
    setDialogOpen(true);
  };

  const openEdit = (order: SalesOrder) => {
    setEditingOrder(order);
    reset({
      customerId: order.customer?.id || '',
      orderDate: order.orderDate.split('T')[0],
      status: order.status,
      discountType: 'fixed',
      discountValue: 0,
      shipping: 0,
      items: order.items.map(i => ({ productId: i.productId, quantity: i.quantity, unitPrice: i.unitPrice, discount: i.discount, taxRate: i.taxRate, description: i.description })),
    });
    setDialogOpen(true);
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const items = watch('items');
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setValue('items', newItems);
  };

  const addItem = () => {
    const items = watch('items');
    setValue('items', [...items, { productId: '', quantity: 1, unitPrice: 0, discount: 0, taxRate: 0 }]);
  };

  const removeItem = (index: number) => {
    const items = watch('items');
    if (items.length > 1) setValue('items', items.filter((_, i) => i !== index));
  };

  const handleSubmit = async (data: SalesOrderForm) => {
    try {
      if (editingOrder) {
        await api.put(`/sales-orders/${editingOrder.id}`, data);
        showToast('Sales order updated', 'success');
      } else {
        await api.post('/sales-orders', data);
        showToast('Sales order created', 'success');
      }
      setDialogOpen(false);
      fetchData();
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Operation failed', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await api.delete(`/sales-orders/${deleteConfirm.id}`);
      showToast('Deleted', 'success');
      fetchData();
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Delete failed', 'error');
    } finally { setDeleteConfirm(null); }
  };

  const columns = [
    { field: 'number', header: 'Order #', width: 150, sortable: true },
    { field: 'customer.name', header: 'Customer', sortable: true },
    { field: 'orderDate', header: 'Date', type: 'date' as const, width: 130, sortable: true },
    { field: 'status', header: 'Status', type: 'badge' as const, badgeColor: (v) => orderStatuses[v as keyof typeof orderStatuses]?.color || 'default', width: 130, align: 'center' as const },
    { field: 'grandTotal', header: 'Total', type: 'currency' as const, align: 'right' as const, width: 130, sortable: true },
    { field: 'createdAt', header: 'Created', type: 'date' as const, width: 130 },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" fontWeight={600}>Sales Orders</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={openCreate}>New Order</Button>
      </Box>

      <FilterBar fields={[{ name: 'search', label: 'Search', placeholder: 'Order #, customer...' }, { name: 'status', label: 'Status', type: 'select', options: Object.entries(orderStatuses).map(([k, v]) => ({ value: k, label: v.label })) }]} onSearch={handleSearch} onClear={handleClear} loading={loading} />

      <DataDisplay data={orders} columns={columns} loading={loading} emptyMessage="No orders found" onRowClick={openEdit} actions={[{ label: 'Edit', icon: <Edit fontSize="small" />, onClick: openEdit }, { label: 'Delete', icon: <Delete fontSize="small" color="error" />, onClick: (o) => setDeleteConfirm(o), color: 'error' }]} />

      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Pagination count={total} page={page} rowsPerPage={limit} onPageChange={setPage} />
      </Box>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xl" fullWidth sx={{ maxWidth: 900 }}>
        <DialogTitle>{editingOrder ? 'Edit Sales Order' : 'New Sales Order'}</DialogTitle>
        <form onSubmit={handleFormSubmit(handleSubmit)}>
          <DialogContent sx={{ pt: 0 }}>
            <Box sx={{ p: 2, maxHeight: '75vh', overflow: 'auto' }}>
              <Grid container spacing={2} columns={12}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small">
                    <Controller name="customerId" control={register} render={({ field }) => (
                      <Select native label="Customer*" value={field.value} onChange={field.onChange} error={!!errors.customerId}>
                        <option value="">Select Customer</option>
                        {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
                      </Select>
                    )} />
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Controller name="orderDate" control={register} render={({ field }) => <TextField {...field} label="Order Date*" type="date" fullWidth size="small" error={!!errors.orderDate} helperText={errors.orderDate?.message} InputLabelProps={{ shrink: true }} />} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Controller name="expectedDate" control={register} render={({ field }) => <TextField {...field} label="Expected Date" type="date" fullWidth size="small" InputLabelProps={{ shrink: true }} />} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small">
                    <Controller name="status" control={register} render={({ field }) => (
                      <Select native value={field.value} onChange={field.onChange} label="Status" fullWidth>
                        {Object.entries(orderStatuses).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                      </Select>
                    )} />
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small">
                    <Controller name="discountType" control={register} render={({ field }) => (
                      <Select native value={field.value} onChange={field.onChange} label="Discount Type" fullWidth>
                        <option value="fixed">Fixed</option>
                        <option value="percentage">Percentage</option>
                      </Select>
                    )} />
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Controller name="discountValue" control={register} render={({ field }) => <TextField {...field} label="Discount Value" type="number" fullWidth size="small" />} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Controller name="shipping" control={register} render={({ field }) => <TextField {...field} label="Shipping" type="number" fullWidth size="small" />} />
                </Grid>
                <Grid item xs={12}>
                  <Controller name="notes" control={register} render={({ field }) => <TextField {...field} label="Notes" fullWidth size="small" multiline rows={2} />} />
                </Grid>
                <Grid item xs={12}>
                  <Controller name="terms" control={register} render={({ field }) => <TextField {...field} label="Terms" fullWidth size="small" multiline rows={2} />} />
                </Grid>
                <Grid item xs={12}>
                  <Controller name="reference" control={register} render={({ field }) => <TextField {...field} label="Reference" fullWidth size="small" />} />
                </Grid>
              </Grid>

              <Box sx={{ mt: 3, mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" fontWeight={600}>Order Items</Typography>
                <Button size="small" startIcon={<Add />} onClick={addItem}>Add Item</Button>
              </Box>

              {watch('items').map((item, index) => (
                <Card key={index} sx={{ mb: 1 }}>
                  <CardContent>
                    <Grid container spacing={2} columns={12}>
                      <Grid item xs={12} sm={4}>
                        <FormControl fullWidth size="small">
                          <Controller name={`items.${index}.productId`} control={register} render={({ field }) => (
                            <Select native value={field.value} onChange={(e) => handleItemChange(index, 'productId', e.target.value)} label="Product*" fullWidth error={!!errors.items?.[index]?.productId}>
                              <option value="">Select Product</option>
                              {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.code}) - {p.salePrice}</option>)}
                            </Select>
                          )} />
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        <Controller name={`items.${index}.quantity`} control={register} render={({ field }) => <TextField {...field} label="Qty*" type="number" fullWidth size="small" onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))} />} />
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        <Controller name={`items.${index}.unitPrice`} control={register} render={({ field }) => <TextField {...field} label="Unit Price*" type="number" fullWidth size="small" step="0.01" onChange={(e) => handleItemChange(index, 'unitPrice', Number(e.target.value))} />} />
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        <Controller name={`items.${index}.discount`} control={register} render={({ field }) => <TextField {...field} label="Discount" type="number" fullWidth size="small" step="0.01" onChange={(e) => handleItemChange(index, 'discount', Number(e.target.value))} />} />
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        <Controller name={`items.${index}.taxRate`} control={register} render={({ field }) => <TextField {...field} label="Tax %" type="number" fullWidth size="small" step="0.01" onChange={(e) => handleItemChange(index, 'taxRate', Number(e.target.value))} />} />
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-end' }}>
                          <IconButton size="small" onClick={() => removeItem(index)} color="error"><Delete fontSize="small" /></IconButton>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 2, pb: 2 }}>
            <Button onClick={() => setDialogOpen(false)} variant="outlined">Cancel</Button>
            <Button type="submit" variant="contained" disabled={loading}>{editingOrder ? 'Update' : 'Create'}</Button>
          </DialogActions>
        </form>
      </Dialog>

      <ConfirmDialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} onConfirm={handleDelete} title="Delete Order" message={`Delete "${deleteConfirm?.number}"?`} variant="destructive" />
    </Box>
  );
}

import { IconButton } from '@mui/material';import { Controller } from 'react-hook-form';
