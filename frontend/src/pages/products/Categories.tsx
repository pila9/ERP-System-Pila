import { useEffect, useState } from 'react';
import { Box, Grid, Card, CardContent, Typography, Button, Chip, TableContainer, Table, TableHead, TableBody, TableRow, TableCell, Paper, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem, TextField, Controller, IconButton, TreeView, TreeItem } from '@mui/material';
import { Add, Edit, Delete, Search, FilterList, ExpandMore, ChevronRight } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../lib/api';
import { DataDisplay, FilterBar, ConfirmDialog } from '../components/ui';
import { useToast } from '../context/ToastContext';

const categorySchema = z.object({
  code: z.string().optional(),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  parentId: z.string().uuid().nullable().optional(),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

type CategoryForm = z.infer<typeof categorySchema>;

interface Category {
  id: string;
  code?: string;
  name: string;
  parentId?: string;
  parent?: Category;
  children?: Category[];
  description?: string;
  isActive: boolean;
  _count?: { products: number };
  createdAt: string;
}

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [flatCategories, setFlatCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Category | null>(null);
  const { showToast } = useToast();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CategoryForm>({
    resolver: zodResolver(categorySchema),
  });

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await api.get('/categories/tree');
      setCategories(res.data);
      flattenCategories(res.data);
    } catch (error) { showToast('Failed to fetch', 'error'); }
    finally { setLoading(false); }
  };

  const flattenCategories = (cats: Category[], parentId?: string) => {
    const flat: Category[] = [];
    cats.forEach(cat => {
      flat.push({ ...cat, parentId });
      if (cat.children?.length) flat.push(...flattenCategories(cat.children, cat.id));
    });
    return flat;
  };

  useEffect(() => { fetchCategories(); }, []);

  const openCreate = () => { setEditingCategory(null); reset({ isActive: true }); setDialogOpen(true); };
  const openEdit = (cat: Category) => { setEditingCategory(cat); reset({ code: cat.code || '', name: cat.name, parentId: cat.parentId || null, description: cat.description || '', isActive: cat.isActive }); setDialogOpen(true); };

  const handleSubmit = async (data: CategoryForm) => {
    try {
      if (editingCategory) { await api.put(`/categories/${editingCategory.id}`, data); showToast('Updated', 'success'); }
      else { await api.post('/categories', data); showToast('Created', 'success'); }
      setDialogOpen(false); fetchCategories();
    } catch (error: any) { showToast(error.response?.data?.error || 'Failed', 'error'); }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try { await api.delete(`/categories/${deleteConfirm.id}`); showToast('Deleted', 'success'); fetchCategories(); }
    catch (error: any) { showToast(error.response?.data?.error || 'Failed', 'error'); }
    finally { setDeleteConfirm(null); }
  };

  const columns = [
    { field: 'code', header: 'Code', width: 100 },
    { field: 'name', header: 'Name', sortable: true, render: (row: Category) => <Box sx={{ ml: (row.parentId ? 2 : 0) }}><strong>{row.name}</strong>{row.parentId && <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>→ {row.parent?.name}</Typography>}</Box> },
    { field: 'description', header: 'Description', width: 200 },
    { field: '_count.products', header: 'Products', width: 100, align: 'center' as const },
    { field: 'isActive', header: 'Status', type: 'badge' as const, badgeColor: v => v ? 'success' : 'default', width: 100, align: 'center' as const },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" fontWeight={600}>Categories</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={openCreate}>New Category</Button>
      </Box>

      <FilterBar fields={[{ name: 'search', label: 'Search', placeholder: 'Name, code...' }, { name: 'isActive', label: 'Status', type: 'select', options: [{ value: 'true', label: 'Active' }, { value: 'false', label: 'Inactive' }] }]} onSearch={() => {}} onClear={() => {}} loading={loading} />

      <DataDisplay data={flatCategories} columns={columns} loading={loading} emptyMessage="No categories" onRowClick={openEdit} actions={[{ label: 'Edit', icon: <Edit fontSize="small" />, onClick: openEdit }, { label: 'Delete', icon: <Delete fontSize="small" color="error" />, onClick: (c) => setDeleteConfirm(c), color: 'error' }]} />

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingCategory ? 'Edit Category' : 'New Category'}</DialogTitle>
        <form onSubmit={handleSubmit(handleSubmit)}>
          <DialogContent sx={{ pt: 0 }}>
            <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Grid container spacing={2} columns={12}>
                <Grid item xs={12} sm={6}>
                  <Controller name="code" control={register} render={({ field }) => <TextField {...field} label="Code" fullWidth size="small" />} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Controller name="name" control={register} render={({ field }) => <TextField {...field} label="Name*" fullWidth size="small" error={!!errors.name} helperText={errors.name?.message} />} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small">
                    <Controller name="parentId" control={register} render={({ field }) => (
                      <Select native value={field.value} onChange={field.onChange} label="Parent Category" fullWidth>
                        <option value="">None (Root)</option>
                        {flatCategories.filter(c => c.id !== editingCategory?.id).map(c => <option key={c.id} value={c.id}>{'  '.repeat(c.parentId ? 1 : 0) + c.name}</option>)}
                      </Select>
                    )} />
                  </FormControl>
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
            <Button type="submit" variant="contained" disabled={loading}>{editingCategory ? 'Update' : 'Create'}</Button>
          </DialogActions>
        </form>
      </Dialog>

      <ConfirmDialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} onConfirm={handleDelete} title="Delete Category" message={`Delete "${deleteConfirm?.name}"?`} variant="destructive" />
    </Box>
  );
}

import { Grid } from '@mui/material';