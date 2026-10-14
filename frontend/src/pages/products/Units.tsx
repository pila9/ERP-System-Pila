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

const unitSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  abbreviation: z.string().min(1, 'Abbreviation required').max(20),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

type UnitForm = z.infer<typeof unitSchema>;

interface Unit {
  id: string;
  name: string;
  abbreviation: string;
  description?: string;
  isActive: boolean;
  _count?: { products: number };
  createdAt: string;
}

export default function Units() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Unit | null>(null);
  const [filters, setFilters] = useState<Record<string, any>>({});
  const { showToast } = useToast();

  const { register, handleSubmit: handleFormSubmit, reset, formState: { errors } } = useForm<UnitForm>({
    resolver: zodResolver(unitSchema),
  });

  const fetchUnits = async () => {
    setLoading(true);
    try {
      const res = await api.get('/units', { params: { page, limit, ...filters } });
      setUnits(res.data.data);
      setTotal(res.data.meta.total);
    } catch (error) { showToast('Failed to fetch', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUnits(); }, [page, filters]);

  const handleSearch = (newFilters: Record<string, any>) => { setFilters(newFilters); setPage(1); };
  const handleClear = () => { setFilters({}); setPage(1); };

  const openCreate = () => { setEditingUnit(null); reset({ isActive: true }); setDialogOpen(true); };
  const openEdit = (unit: Unit) => { setEditingUnit(unit); reset({ name: unit.name, abbreviation: unit.abbreviation, description: unit.description || '', isActive: unit.isActive }); setDialogOpen(true); };

  const handleSubmit = async (data: UnitForm) => {
    try {
      if (editingUnit) { await api.put(`/units/${editingUnit.id}`, data); showToast('Updated', 'success'); }
      else { await api.post('/units', data); showToast('Created', 'success'); }
      setDialogOpen(false); fetchUnits();
    } catch (error: any) { showToast(error.response?.data?.error || 'Failed', 'error'); }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try { await api.delete(`/units/${deleteConfirm.id}`); showToast('Deleted', 'success'); fetchUnits(); }
    catch (error: any) { showToast(error.response?.data?.error || 'Failed', 'error'); }
    finally { setDeleteConfirm(null); }
  };

  const columns = [
    { field: 'abbreviation', header: 'Abbr.', width: 80, sortable: true },
    { field: 'name', header: 'Name', sortable: true },
    { field: 'description', header: 'Description', width: 200 },
    { field: '_count.products', header: 'Products', width: 100, align: 'center' as const },
    { field: 'isActive', header: 'Status', type: 'badge' as const, badgeColor: v => v ? 'success' : 'default', width: 100, align: 'center' as const },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" fontWeight={600}>Units</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={openCreate}>New Unit</Button>
      </Box>

      <FilterBar fields={[{ name: 'search', label: 'Search', placeholder: 'Name, abbreviation...' }, { name: 'isActive', label: 'Status', type: 'select', options: [{ value: 'true', label: 'Active' }, { value: 'false', label: 'Inactive' }] }]} onSearch={handleSearch} onClear={handleClear} loading={loading} />

      <DataDisplay data={units} columns={columns} loading={loading} emptyMessage="No units found" onRowClick={openEdit} actions={[{ label: 'Edit', icon: <Edit fontSize="small" />, onClick: openEdit }, { label: 'Delete', icon: <Delete fontSize="small" color="error" />, onClick: (u) => setDeleteConfirm(u), color: 'error' }]} />

      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Pagination count={total} page={page} rowsPerPage={limit} onPageChange={setPage} />
      </Box>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingUnit ? 'Edit Unit' : 'New Unit'}</DialogTitle>
        <form onSubmit={handleFormSubmit(handleSubmit)}>
          <DialogContent sx={{ pt: 0 }}>
            <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Grid container spacing={2} columns={12}>
                <Grid item xs={12} sm={6}>
                  <Controller name="name" control={register} render={({ field }) => <TextField {...field} label="Name*" fullWidth size="small" error={!!errors.name} helperText={errors.name?.message} />} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Controller name="abbreviation" control={register} render={({ field }) => <TextField {...field} label="Abbreviation*" fullWidth size="small" error={!!errors.abbreviation} helperText={errors.abbreviation?.message} />} />
                </Grid>
                <Grid item xs={12}>
                  <Controller name="description" control={register} render={({ field }) => <TextField {...field} label="Description" fullWidth size="small" multiline rows={3} />} />
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
            <Button type="submit" variant="contained" disabled={loading}>{editingUnit ? 'Update' : 'Create'}</Button>
          </DialogActions>
        </form>
      </Dialog>

      <ConfirmDialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} onConfirm={handleDelete} title="Delete Unit" message={`Delete "${deleteConfirm?.name}"?`} variant="destructive" />
    </Box>
  );
}

import { Grid, Pagination } from '@mui/material';import { Controller } from 'react-hook-form';
