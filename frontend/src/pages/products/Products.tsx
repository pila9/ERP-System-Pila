import { useEffect, useState } from 'react';
import { Box, Grid, Card, CardContent, Typography, Button, Chip, TableContainer, Table, TableHead, TableBody, TableRow, TableCell, Paper, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem, TextField, IconButton } from '@mui/material';
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

const productSchema = z.object({
  code: z.string().min(2, 'Code must be at least 2 characters'),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  categoryId: z.string().uuid().nullable().optional(),
  unitId: z.string().uuid().nullable().optional(),
  costPrice: z.number().min(0).default(0),
  salePrice: z.number().min(0).default(0),
  taxRate: z.number().min(0).max(100).default(0),
  trackInventory: z.boolean().default(true),
  reorderLevel: z.number().min(0).default(0),
  reorderQuantity: z.number().min(0).default(0),
  isActive: z.boolean().default(true),
});

type ProductForm = z.infer<typeof productSchema>;

interface Product {
  id: string;
  code: string;
  sku?: string;
  barcode?: string;
  name: string;
  category?: { name: string };
  unit?: { name: string; abbreviation: string };
  costPrice: number;
  salePrice: number;
  taxRate: number;
  trackInventory: boolean;
  reorderLevel: number;
  isActive: boolean;
  createdAt: string;
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Product | null>(null);
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [categories, setCategories] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const { showToast } = useToast();

  const { register, handleSubmit: handleFormSubmit, reset, formState: { errors } } = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [productsRes, categoriesRes, unitsRes] = await Promise.all([
        api.get('/products', { params: { page, limit, ...filters } }),
        api.get('/categories', { params: { limit: 1000, isActive: true } }),
        api.get('/units', { params: { limit: 1000, isActive: true } }),
      ]);
      setProducts(productsRes.data.data);
      setTotal(productsRes.data.meta.total);
      setCategories(categoriesRes.data.data);
      setUnits(unitsRes.data.data);
    } catch (error) {
      showToast('Failed to fetch data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [page, filters]);

  const handleSearch = (newFilters: Record<string, any>) => { setFilters(newFilters); setPage(1); };
  const handleClear = () => { setFilters({}); setPage(1); };

  const openCreate = () => { setEditingProduct(null); reset({ isActive: true, trackInventory: true, costPrice: 0, salePrice: 0, taxRate: 0, reorderLevel: 0, reorderQuantity: 0 }); setDialogOpen(true); };
  const openEdit = (product: Product) => { setEditingProduct(product); reset({ code: product.code, sku: product.sku || '', barcode: product.barcode || '', name: product.name, description: product.description || '', categoryId: product.category?.id || null, unitId: product.unit?.id || null, costPrice: product.costPrice, salePrice: product.salePrice, taxRate: product.taxRate, trackInventory: product.trackInventory, reorderLevel: product.reorderLevel, reorderQuantity: product.reorderQuantity, isActive: product.isActive }); setDialogOpen(true); };

  const handleSubmit = async (data: ProductForm) => {
    try {
      if (editingProduct) { await api.put(`/products/${editingProduct.id}`, data); showToast('Product updated', 'success'); }
      else { await api.post('/products', data); showToast('Product created', 'success'); }
      setDialogOpen(false); fetchData();
    } catch (error: any) { showToast(error.response?.data?.error || 'Operation failed', 'error'); }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try { await api.delete(`/products/${deleteConfirm.id}`); showToast('Deleted', 'success'); fetchData(); }
    catch (error: any) { showToast(error.response?.data?.error || 'Delete failed', 'error'); }
    finally { setDeleteConfirm(null); }
  };

  const columns = [
    { field: 'code', header: 'Code', width: 100, sortable: true },
    { field: 'sku', header: 'SKU', width: 100 },
    { field: 'name', header: 'Name', sortable: true },
    { field: 'category.name', header: 'Category', width: 150 },
    { field: 'unit.abbreviation', header: 'Unit', width: 80, align: 'center' as const },
    { field: 'costPrice', header: 'Cost', type: 'currency' as const, align: 'right' as const, width: 100 },
    { field: 'salePrice', header: 'Sale Price', type: 'currency' as const, align: 'right' as const, width: 110, sortable: true },
    { field: 'taxRate', header: 'Tax %', width: 80, align: 'center' as const },
    { field: 'trackInventory', header: 'Track', type: 'badge' as const, badgeColor: v => v ? 'success' : 'default', width: 80, align: 'center' as const },
    { field: 'isActive', header: 'Status', type: 'badge' as const, badgeColor: v => v ? 'success' : 'default', width: 100, align: 'center' as const },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" fontWeight={600}>Products</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={openCreate}>New Product</Button>
      </Box>

      <FilterBar fields={[{ name: 'search', label: 'Search', placeholder: 'Name, code, SKU...' }, { name: 'categoryId', label: 'Category', type: 'select', options: categories.map(c => ({ value: c.id, label: c.name })) }, { name: 'isActive', label: 'Status', type: 'select', options: [{ value: 'true', label: 'Active' }, { value: 'false', label: 'Inactive' }] }]} onSearch={handleSearch} onClear={handleClear} loading={loading} />

      <DataDisplay data={products} columns={columns} loading={loading} emptyMessage="No products found" onRowClick={openEdit} actions={[{ label: 'Edit', icon: <Edit fontSize="small" />, onClick: openEdit }, { label: 'Delete', icon: <Delete fontSize="small" color="error" />, onClick: (p) => setDeleteConfirm(p), color: 'error' }]} />

      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Pagination count={total} page={page} rowsPerPage={limit} onPageChange={setPage} />
      </Box>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth sx={{ maxWidth: 600 }}>
        <DialogTitle>{editingProduct ? 'Edit Product' : 'New Product'}</DialogTitle>
        <form onSubmit={handleFormSubmit(handleSubmit)}>
          <DialogContent sx={{ pt: 0 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 2, maxHeight: '70vh', overflow: 'auto' }}>
              <Grid container spacing={2} columns={12}>
                <Grid item xs={12} sm={6}>
                  <Controller name="code" control={register} render={({ field }) => <TextField {...field} label="Code*" fullWidth size="small" error={!!errors.code} helperText={errors.code?.message} />} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Controller name="sku" control={register} render={({ field }) => <TextField {...field} label="SKU" fullWidth size="small" />} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Controller name="barcode" control={register} render={({ field }) => <TextField {...field} label="Barcode" fullWidth size="small" />} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Controller name="name" control={register} render={({ field }) => <TextField {...field} label="Name*" fullWidth size="small" error={!!errors.name} helperText={errors.name?.message} />} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small">
                    <Controller name="categoryId" control={register} render={({ field }) => (
                      <Select native value={field.value} onChange={field.onChange} label="Category" fullWidth>
                        <option value="">None</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </Select>
                    )} />
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small">
                    <Controller name="unitId" control={register} render={({ field }) => (
                      <Select native value={field.value} onChange={field.onChange} label="Unit*" fullWidth error={!!errors.unitId}>
                        {units.map(u => <option key={u.id} value={u.id}>{u.name} ({u.abbreviation})</option>)}
                      </Select>
                    )} />
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Controller name="costPrice" control={register} render={({ field }) => <TextField {...field} label="Cost Price" type="number" fullWidth size="small" step="0.01" />} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Controller name="salePrice" control={register} render={({ field }) => <TextField {...field} label="Sale Price" type="number" fullWidth size="small" step="0.01" />} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Controller name="taxRate" control={register} render={({ field }) => <TextField {...field} label="Tax %" type="number" fullWidth size="small" step="0.01" />} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Controller name="reorderLevel" control={register} render={({ field }) => <TextField {...field} label="Reorder Level" type="number" fullWidth size="small" />} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Controller name="reorderQuantity" control={register} render={({ field }) => <TextField {...field} label="Reorder Qty" type="number" fullWidth size="small" />} />
                </Grid>
                <Grid item xs={12}>
                  <Controller name="description" control={register} render={({ field }) => <TextField {...field} label="Description" fullWidth size="small" multiline rows={3} />} />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth size="small">
                    <Controller name="trackInventory" control={register} render={({ field }) => (
                      <Select native value={field.value} onChange={field.onChange} label="Track Inventory" fullWidth>
                        <option value={true}>Yes</option>
                        <option value={false}>No</option>
                      </Select>
                    )} />
                  </FormControl>
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
            <Button type="submit" variant="contained" disabled={loading}>{editingProduct ? 'Update' : 'Create'}</Button>
          </DialogActions>
        </form>
      </Dialog>

      <ConfirmDialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} onConfirm={handleDelete} title="Delete Product" message={`Delete "${deleteConfirm?.name}"?`} variant="destructive" />
    </Box>
  );
}