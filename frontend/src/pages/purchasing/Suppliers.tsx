import { useEffect, useState } from 'react';
import { Box, Grid, Card, CardContent, Typography, Button, Chip, TableContainer, Table, TableHead, TableBody, TableRow, TableCell, Paper, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem, TextField, IconButton } from '@mui/material';
import { Controller } from 'react-hook-form';
import { Add, Edit, Delete, Search, FilterList } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../../lib/api';
import { DataDisplay, FilterBar, ConfirmDialog } from '../../components/ui';
import { useToast } from '../../context/ToastContext';

const supplierSchema = z.object({
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
  paymentTermsDays: z.number().int().min(0).default(30),
  bankName: z.string().optional(),
  bankAccount: z.string().optional(),
  notes: z.string().optional(),
  isActive: z.boolean().default(true),
});

type SupplierForm = z.infer<typeof supplierSchema>;

interface Supplier {
  id: string;
  code: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  city?: string;
  country?: string;
  paymentTermsDays: number;
  isActive: boolean;
  _count?: { purchaseOrders: number };
  createdAt: string;
}

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Supplier | null>(null);
  const [filters, setFilters] = useState<Record<string, any>>({});
  const { showToast } = useToast();

  const { register, handleSubmit: handleFormSubmit, reset, formState: { errors } } = useForm<SupplierForm>({
    resolver: zodResolver(supplierSchema),
  });

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/suppliers', { params: { page, limit, ...filters } });
      setSuppliers(res.data.data);
      setTotal(res.data.meta.total);
    } catch (error) { showToast('Failed to fetch', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSuppliers(); }, [page, filters]);

  const handleSearch = (newFilters: Record<string, any>) => { setFilters(newFilters); setPage(1); };
  const handleClear = () => { setFilters({}); setPage(1); };

  const openCreate = () => { setEditingSupplier(null); reset({ isActive: true, paymentTermsDays: 30 }); setDialogOpen(true); };
  const openEdit = (s: Supplier) => { setEditingSupplier(s); reset({ code: s.code, name: s.name, company: s.company || '', email: s.email || '', phone: s.phone || '', taxNumber: s.taxNumber || '', address: s.address || '', city: s.city || '', state: s.state || '', country: s.country || '', postalCode: s.postalCode || '', paymentTermsDays: s.paymentTermsDays, bankName: s.bankName || '', bankAccount: s.bankAccount || '', notes: s.notes || '', isActive: s.isActive }); setDialogOpen(true); };

  const handleSubmit = async (data: SupplierForm) => {
    try {
      if (editingSupplier) { await api.put(`/suppliers/${editingSupplier.id}`, data); showToast('Updated', 'success'); }
      else { await api.post('/suppliers', data); showToast('Created', 'success'); }
      setDialogOpen(false); fetchSuppliers();
    } catch (error: any) { showToast(error.response?.data?.error || 'Failed', 'error'); }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try { await api.delete(`/suppliers/${deleteConfirm.id}`); showToast('Deleted', 'success'); fetchSuppliers(); }
    catch (error: any) { showToast(error.response?.data?.error || 'Failed', 'error'); }
    finally { setDeleteConfirm(null); }
  };

  const columns = [
    { field: 'code', header: 'Code', width: 100, sortable: true },
    { field: 'name', header: 'Name', sortable: true },
    { field: 'company', header: 'Company', width: 150 },
    { field: 'email', header: 'Email', width: 200 },
    { field: 'phone', header: 'Phone', width: 130 },
    { field: 'city', header: 'City', width: 120 },
    { field: 'paymentTermsDays', header: 'Terms', width: 80, align: 'center' as const },
    { field: 'isActive', header: 'Status', type: 'badge' as const, badgeColor: v => v ? 'success' : 'default', width: 100, align: 'center' as const },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" fontWeight={600}>Suppliers</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={openCreate}>New Supplier</Button>
      </Box>

      <FilterBar fields={[{ name: 'search', label: 'Search', placeholder: 'Name, code, email...' }, { name: 'isActive', label: 'Status', type: 'select', options: [{ value: 'true', label: 'Active' }, { value: 'false', label: 'Inactive' }] }]} onSearch={handleSearch} onClear={handleClear} loading={loading} />

      <DataDisplay data={suppliers} columns={columns} loading={loading} emptyMessage="No suppliers found" onRowClick={openEdit} actions={[{ label: 'Edit', icon: <Edit fontSize="small" />, onClick: openEdit }, { label: 'Delete', icon: <Delete fontSize="small" color="error" />, onClick: (s) => setDeleteConfirm(s), color: 'error' }]} />

      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Pagination count={total} page={page} rowsPerPage={limit} onPageChange={setPage} />
      </Box>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth sx={{ maxWidth: 600 }}>
        <DialogTitle>{editingSupplier ? 'Edit Supplier' : 'New Supplier'}</DialogTitle>
        <form onSubmit={handleFormSubmit(handleSubmit)}>
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
                  <Controller name="paymentTermsDays" control={register} render={({ field }) => <TextField {...field} label="Payment Terms (days)" type="number" fullWidth size="small" />} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Controller name="bankName" control={register} render={({ field }) => <TextField {...field} label="Bank Name" fullWidth size="small" />} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Controller name="bankAccount" control={register} render={({ field }) => <TextField {...field} label="Bank Account" fullWidth size="small" />} />
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
            <Button type="submit" variant="contained" disabled={loading}>{editingSupplier ? 'Update' : 'Create'}</Button>
          </DialogActions>
        </form>
      </Dialog>

      <ConfirmDialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} onConfirm={handleDelete} title="Delete Supplier" message={`Delete "${deleteConfirm?.name}"?`} variant="destructive" />
    </Box>
  );
}

import { Grid, Pagination } from '@mui/material';import { Controller } from 'react-hook-form';
