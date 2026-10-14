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

const warehouseSchema = z.object({
  code: z.string().min(2, 'Code must be at least 2 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  phone: z.string().optional(),
  manager: z.string().optional(),
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

type WarehouseForm = z.infer<typeof warehouseSchema>;

interface Warehouse {
  id: string;
  code: string;
  name: string;
  address?: string;
  city?: string;
  country?: string;
  phone?: string;
  manager?: string;
  isDefault: boolean;
  isActive: boolean;
  _count?: { stockLevels: number };
  createdAt: string;
}

export default function Warehouses() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Warehouse | null>(null);
  const [filters, setFilters] = useState<Record<string, any>>({});
  const { showToast } = useToast();

  const { register, handleSubmit: handleFormSubmit, reset, formState: { errors } } = useForm<WarehouseForm>({
    resolver: zodResolver(warehouseSchema),
  });

  const fetchWarehouses = async () => {
    setLoading(true);
    try {
      const res = await api.get('/warehouses', { params: { page, limit, ...filters } });
      setWarehouses(res.data.data);
      setTotal(res.data.meta.total);
    } catch (error) { showToast('Failed to fetch', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchWarehouses(); }, [page, filters]);

  const handleSearch = (newFilters: Record<string, any>) => { setFilters(newFilters); setPage(1); };
  const handleClear = () => { setFilters({}); setPage(1); };

  const openCreate = () => { setEditingWarehouse(null); reset({ isDefault: false, isActive: true }); setDialogOpen(true); };
  const openEdit = (w: Warehouse) => { setEditingWarehouse(w); reset({ code: w.code, name: w.name, address: w.address || '', city: w.city || '', country: w.country || '', phone: w.phone || '', manager: w.manager || '', isDefault: w.isDefault, isActive: w.isActive }); setDialogOpen(true); };

  const handleSubmit = async (data: WarehouseForm) => {
    try {
      if (editingWarehouse) { await api.put(`/warehouses/${editingWarehouse.id}`, data); showToast('Updated', 'success'); }
      else { await api.post('/warehouses', data); showToast('Created', 'success'); }
      setDialogOpen(false); fetchWarehouses();
    } catch (error: any) { showToast(error.response?.data?.error || 'Failed', 'error'); }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try { await api.delete(`/warehouses/${deleteConfirm.id}`); showToast('Deleted', 'success'); fetchWarehouses(); }
    catch (error: any) { showToast(error.response?.data?.error || 'Failed', 'error'); }
    finally { setDeleteConfirm(null); }
  };

  const columns = [
    { field: 'code', header: 'Code', width: 100, sortable: true },
    { field: 'name', header: 'Name', sortable: true },
    { field: 'city', header: 'City', width: 120 },
    { field: 'country', header: 'Country', width: 120 },
    { field: 'manager', header: 'Manager', width: 130 },
    { field: 'isDefault', header: 'Default', type: 'badge' as const, badgeColor: v => v ? 'primary' : 'default', width: 100, align: 'center' as const },
    { field: 'isActive', header: 'Status', type: 'badge' as const, badgeColor: v => v ? 'success' : 'default', width: 100, align: 'center' as const },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" fontWeight={600}>Warehouses</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={openCreate}>New Warehouse</Button>
      </Box>

      <FilterBar fields={[{ name: 'search', label: 'Search', placeholder: 'Name, code...' }, { name: 'isActive', label: 'Status', type: 'select', options: [{ value: 'true', label: 'Active' }, { value: 'false', label: 'Inactive' }] }, { name: 'isDefault', label: 'Default', type: 'select', options: [{ value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }] }]} onSearch={handleSearch} onClear={handleClear} loading={loading} />

      <DataDisplay data={warehouses} columns={columns} loading={loading} emptyMessage="No warehouses" onRowClick={openEdit} actions={[{ label: 'Edit', icon: <Edit fontSize="small" />, onClick: openEdit }, { label: 'Delete', icon: <Delete fontSize="small" color="error" />, onClick: (w) => setDeleteConfirm(w), color: 'error' }]} />

      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Pagination count={total} page={page} rowsPerPage={limit} onPageChange={setPage} />
      </Box>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingWarehouse ? 'Edit Warehouse' : 'New Warehouse'}</DialogTitle>
        <form onSubmit={handleFormSubmit(handleSubmit)}>
          <DialogContent sx={{ pt: 0 }}>
            <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Grid container spacing={2} columns={12}>
                <Grid item xs={12} sm={6}>
                  <Controller name="code" control={register} render={({ field }) => <TextField {...field} label="Code*" fullWidth size="small" error={!!errors.code} helperText={errors.code?.message} />} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Controller name="name" control={register} render={({ field }) => <TextField {...field} label="Name*" fullWidth size="small" error={!!errors.name} helperText={errors.name?.message} />} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Controller name="city" control={register} render={({ field }) => <TextField {...field} label="City" fullWidth size="small" />} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Controller name="country" control={register} render={({ field }) => <TextField {...field} label="Country" fullWidth size="small" />} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Controller name="phone" control={register} render={({ field }) => <TextField {...field} label="Phone" fullWidth size="small" />} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Controller name="manager" control={register} render={({ field }) => <TextField {...field} label="Manager" fullWidth size="small" />} />
                </Grid>
                <Grid item xs={12}>
                  <Controller name="address" control={register} render={({ field }) => <TextField {...field} label="Address" fullWidth size="small" multiline rows={2} />} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small">
                    <Controller name="isDefault" control={register} render={({ field }) => (
                      <Select native value={field.value} onChange={field.onChange} label="Default Warehouse" fullWidth>
                        <option value={true}>Yes</option>
                        <option value={false}>No</option>
                      </Select>
                    )} />
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
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
            <Button type="submit" variant="contained" disabled={loading}>{editingWarehouse ? 'Update' : 'Create'}</Button>
          </DialogActions>
        </form>
      </Dialog>

      <ConfirmDialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} onConfirm={handleDelete} title="Delete Warehouse" message={`Delete "${deleteConfirm?.name}"?`} variant="destructive" />
    </Box>
  );
}

import { Grid, Pagination } from '@mui/material';import { Controller } from 'react-hook-form';
