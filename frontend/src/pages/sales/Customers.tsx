import { useEffect, useState } from 'react';
import { Box, Grid, Card, CardContent, Typography, TextField, Button, Chip, IconButton, TableContainer, Table, TableHead, TableBody, TableRow, TableCell, Paper, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem, Tooltip, Pagination, CircularProgress } from '@mui/material';
import { Add, Edit, Delete, Search, FilterList, Refresh, MoreVert } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../lib/api';
import { DataDisplay, FilterBar, ConfirmDialog } from '../components/ui';
import { formatCurrency, formatDate } from '../lib/format';
import { useToast } from '../context/ToastContext';

const customerSchema = z.object({
  code: z.string().min(2, 'Code must be at least 2 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  company: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  taxNumber: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
  creditLimit: z.number().min(0).default(0),
  paymentTermsDays: z.number().int().min(0).default(30),
  notes: z.string().optional(),
  isActive: z.boolean().default(true),
});

type CustomerForm = z.infer<typeof customerSchema>;

interface Customer {
  id: string;
  code: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  city?: string;
  country?: string;
  creditLimit: number;
  paymentTermsDays: number;
  isActive: boolean;
  _count?: { salesOrders: number; invoices: number };
  createdAt: string;
}

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Customer | null>(null);
  const [filters, setFilters] = useState<Record<string, any>>({});
  const { showToast } = useToast();

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<CustomerForm>({
    resolver: zodResolver(customerSchema),
  });

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/customers', { params: { page, limit, ...filters } });
      setCustomers(res.data.data);
      setTotal(res.data.meta.total);
    } catch (error) {
      showToast('Failed to fetch customers', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCustomers(); }, [page, filters]);

  const handleSearch = (newFilters: Record<string, any>) => {
    setFilters(newFilters);
    setPage(1);
  };

  const handleClear = () => {
    setFilters({});
    setPage(1);
  };

  const openCreate = () => {
    setEditingCustomer(null);
    reset({ isActive: true, creditLimit: 0, paymentTermsDays: 30 });
    setDialogOpen(true);
  };

  const openEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    reset({
      code: customer.code,
      name: customer.name,
      company: customer.company || '',
      email: customer.email || '',
      phone: customer.phone || '',
      taxNumber: customer.taxNumber || '',
      address: customer.address || '',
      city: customer.city || '',
      state: customer.state || '',
      country: customer.country || '',
      postalCode: customer.postalCode || '',
      creditLimit: customer.creditLimit,
      paymentTermsDays: customer.paymentTermsDays,
      notes: customer.notes || '',
      isActive: customer.isActive,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (data: CustomerForm) => {
    try {
      if (editingCustomer) {
        await api.put(`/customers/${editingCustomer.id}`, data);
        showToast('Customer updated successfully', 'success');
      } else {
        await api.post('/customers', data);
        showToast('Customer created successfully', 'success');
      }
      setDialogOpen(false);
      fetchCustomers();
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Operation failed', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await api.delete(`/customers/${deleteConfirm.id}`);
      showToast('Customer deleted successfully', 'success');
      fetchCustomers();
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Delete failed', 'error');
    } finally {
      setDeleteConfirm(null);
    }
  };

  const columns = [
    { field: 'code', header: 'Code', width: 100, sortable: true },
    { field: 'name', header: 'Name', sortable: true },
    { field: 'company', header: 'Company', width: 150 },
    { field: 'email', header: 'Email', width: 200 },
    { field: 'phone', header: 'Phone', width: 130 },
    { field: 'city', header: 'City', width: 120 },
    { field: 'creditLimit', header: 'Credit Limit', type: 'currency' as const, align: 'right' as const, width: 130 },
    { field: 'paymentTermsDays', header: 'Terms', width: 80, align: 'center' as const },
    { field: 'isActive', header: 'Status', type: 'badge' as const, badgeColor: v => v ? 'success' : 'default', width: 100, align: 'center' as const },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" fontWeight={600}>Customers</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={openCreate}>New Customer</Button>
      </Box>

      <FilterBar
        fields={[
          { name: 'search', label: 'Search', placeholder: 'Name, code, email...' },
          { name: 'isActive', label: 'Status', type: 'select', options: [{ value: 'true', label: 'Active' }, { value: 'false', label: 'Inactive' }] },
        ]}
        onSearch={handleSearch}
        onClear={handleClear}
        loading={loading}
      />

      <DataDisplay
        data={customers}
        columns={columns}
        loading={loading}
        emptyMessage="No customers found"
        onSort={(field, dir) => { /* implement server-side sort */ }}
        onRowClick={openEdit}
        actions={[
          { label: 'Edit', icon: <Edit fontSize="small" />, onClick: openEdit },
          { label: 'Delete', icon: <Delete fontSize="small" color="error" />, onClick: (c) => setDeleteConfirm(c), color: 'error' },
        ]}
      />

      <Pagination count={total} page={page} rowsPerPage={limit} onPageChange={setPage} />

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth sx={{ maxWidth: 600 }}>
        <DialogTitle>{editingCustomer ? 'Edit Customer' : 'New Customer'}</DialogTitle>
        <form onSubmit={handleSubmit(handleSubmit)}>
          <DialogContent sx={{ pt: 0 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 2, maxHeight: '70vh', overflow: 'auto' }}>
              <Grid container spacing={2} columns={12}>
                <Grid item xs={12} sm={6}>
                  <Controller name="code" control={register} render={({ field }) => <TextField {...field} label="Code*" fullWidth size="small" error={!!errors.code} helperText={errors.code?.message} />} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Controller name="name" control={register} render={({ field }) => <TextField {...field} label="Name*" fullWidth size="small" error={!!errors.name} helperText={errors.name?.message} />} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Controller name="company" control={register} render={({ field }) => <TextField {...field} label="Company" fullWidth size="small" />} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Controller name="email" control={register} render={({ field }) => <TextField {...field} label="Email" type="email" fullWidth size="small" error={!!errors.email} helperText={errors.email?.message} />} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Controller name="phone" control={register} render={({ field }) => <TextField {...field} label="Phone" fullWidth size="small" />} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Controller name="taxNumber" control={register} render={({ field }) => <TextField {...field} label="Tax Number" fullWidth size="small" />} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Controller name="creditLimit" control={register} render={({ field }) => <TextField {...field} label="Credit Limit" type="number" fullWidth size="small" />} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Controller name="paymentTermsDays" control={register} render={({ field }) => <TextField {...field} label="Payment Terms (days)" type="number" fullWidth size="small" />} />
                </Grid>
                <Grid item xs={12}>
                  <Controller name="address" control={register} render={({ field }) => <TextField {...field} label="Address" fullWidth size="small" multiline rows={2} />} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Controller name="city" control={register} render={({ field }) => <TextField {...field} label="City" fullWidth size="small" />} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Controller name="state" control={register} render={({ field }) => <TextField {...field} label="State/Province" fullWidth size="small" />} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Controller name="country" control={register} render={({ field }) => <TextField {...field} label="Country" fullWidth size="small" />} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Controller name="postalCode" control={register} render={({ field }) => <TextField {...field} label="Postal Code" fullWidth size="small" />} />
                </Grid>
                <Grid item xs={12}>
                  <Controller name="notes" control={register} render={({ field }) => <TextField {...field} label="Notes" fullWidth size="small" multiline rows={3} />} />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth size="small">
                    <Controller name="isActive" control={register} render={({ field }) => (
                      <Select native value={field.value} onChange={field.onChange} label="Status" fullWidth>
                        <option value={true}>Active</option>
                        <option value={false}>Inactive</option>
                      </Select>
                    )} />
                  </FormControl>
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 2, pb: 2 }}>
            <Button onClick={() => setDialogOpen(false)} variant="outlined">Cancel</Button>
            <Button type="submit" variant="contained" disabled={loading}>{editingCustomer ? 'Update' : 'Create'}</Button>
          </DialogActions>
        </form>
      </Dialog>

      <ConfirmDialog
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Delete Customer"
        message={`Are you sure you want to delete "${deleteConfirm?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="destructive"
      />
    </Box>
  );
}