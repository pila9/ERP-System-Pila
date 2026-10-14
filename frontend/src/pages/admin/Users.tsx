import { useEffect, useState } from 'react';
import { Box, Grid, Card, CardContent, Typography, Button, Chip, TableContainer, Table, TableHead, TableBody, TableRow, TableCell, Paper, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem, TextField, IconButton } from '@mui/material';
import { Controller } from 'react-hook-form';
import { Add, Edit, Delete, Search, FilterList, Lock, Visibility, VisibilityOff } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../../lib/api';
import { DataDisplay, FilterBar, ConfirmDialog } from '../../components/ui';
import { formatDate } from '../../lib/format';
import { useToast } from '../../context/ToastContext';

const userSchema = z.object({
  code: z.string().optional(),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  roleId: z.string().uuid().nullable().optional(),
  phone: z.string().optional(),
  isActive: z.boolean().default(true),
});

type UserForm = z.infer<typeof userSchema>;

interface User {
  id: string;
  code?: string;
  name: string;
  email: string;
  phone?: string;
  role?: { name: string; slug: string };
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<User | null>(null);
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [roles, setRoles] = useState<any[]>([]);
  const { showToast } = useToast();

  const { register, handleSubmit: handleFormSubmit, reset, formState: { errors } } = useForm<UserForm>({
    resolver: zodResolver(userSchema),
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, rolesRes] = await Promise.all([
        api.get('/users', { params: { page, limit, ...filters } }),
        api.get('/roles', { params: { limit: 1000 } }),
      ]);
      setUsers(usersRes.data.data);
      setTotal(usersRes.data.meta.total);
      setRoles(rolesRes.data.data);
    } catch (error) { showToast('Failed to fetch', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [page, filters]);

  const handleSearch = (newFilters: Record<string, any>) => { setFilters(newFilters); setPage(1); };
  const handleClear = () => { setFilters({}); setPage(1); };

  const openCreate = () => { setEditingUser(null); reset({ isActive: true }); setDialogOpen(true); };
  const openEdit = (user: User) => { setEditingUser(user); reset({ code: user.code || '', name: user.name, email: user.email, roleId: user.role?.id || null, phone: user.phone || '', isActive: user.isActive }); setDialogOpen(true); };

  const handleSubmit = async (data: UserForm) => {
    try {
      const submitData = { ...data };
      if (!editingUser && !submitData.password) { showToast('Password required for new users', 'error'); return; }
      if (editingUser && !submitData.password) delete submitData.password;
      
      if (editingUser) { await api.put(`/users/${editingUser.id}`, submitData); showToast('Updated', 'success'); }
      else { await api.post('/users', submitData); showToast('Created', 'success'); }
      setDialogOpen(false); fetchData();
    } catch (error: any) { showToast(error.response?.data?.error || 'Failed', 'error'); }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try { await api.delete(`/users/${deleteConfirm.id}`); showToast('Deleted', 'success'); fetchData(); }
    catch (error: any) { showToast(error.response?.data?.error || 'Failed', 'error'); }
    finally { setDeleteConfirm(null); }
  };

  const columns = [
    { field: 'code', header: 'Code', width: 100 },
    { field: 'name', header: 'Name', sortable: true },
    { field: 'email', header: 'Email', width: 200 },
    { field: 'role.name', header: 'Role', width: 150 },
    { field: 'phone', header: 'Phone', width: 130 },
    { field: 'lastLoginAt', header: 'Last Login', type: 'datetime' as const, width: 150 },
    { field: 'isActive', header: 'Status', type: 'badge' as const, badgeColor: v => v ? 'success' : 'default', width: 100, align: 'center' as const },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" fontWeight={600}>Users</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={openCreate}>New User</Button>
      </Box>

      <FilterBar fields={[{ name: 'search', label: 'Search', placeholder: 'Name, email...' }, { name: 'roleId', label: 'Role', type: 'select', options: roles.map(r => ({ value: r.id, label: r.name })) }, { name: 'isActive', label: 'Status', type: 'select', options: [{ value: 'true', label: 'Active' }, { value: 'false', label: 'Inactive' }] }]} onSearch={handleSearch} onClear={handleClear} loading={loading} />

      <DataDisplay data={users} columns={columns} loading={loading} emptyMessage="No users found" onRowClick={openEdit} actions={[{ label: 'Edit', icon: <Edit fontSize="small" />, onClick: openEdit }, { label: 'Delete', icon: <Delete fontSize="small" color="error" />, onClick: (u) => setDeleteConfirm(u), color: 'error' }]} />

      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Pagination count={total} page={page} rowsPerPage={limit} onPageChange={setPage} />
      </Box>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingUser ? 'Edit User' : 'New User'}</DialogTitle>
        <form onSubmit={handleFormSubmit(handleSubmit)}>
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
                  <Controller name="email" control={register} render={({ field }) => <TextField {...field} label="Email*" type="email" fullWidth size="small" error={!!errors.email} helperText={errors.email?.message} />} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Controller name="password" control={register} render={({ field }) => <TextField {...field} label={editingUser ? 'New Password (leave blank to keep current)' : 'Password*'} type="password" fullWidth size="small" error={!!errors.password} helperText={errors.password?.message} />} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small">
                    <Controller name="roleId" control={register} render={({ field }) => (
                      <Select native value={field.value} onChange={field.onChange} label="Role" fullWidth>
                        <option value="">None</option>
                        {roles.map(r => <option key={r.id} value={r.id}>{r.name} ({r.slug})</option>)}
                      </Select>
                    )} />
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Controller name="phone" control={register} render={({ field }) => <TextField {...field} label="Phone" fullWidth size="small" />} />
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
            <Button type="submit" variant="contained" disabled={loading}>{editingUser ? 'Update' : 'Create'}</Button>
          </DialogActions>
        </form>
      </Dialog>

      <ConfirmDialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} onConfirm={handleDelete} title="Delete User" message={`Delete "${deleteConfirm?.name}"?`} variant="destructive" />
    </Box>
  );
}

import { Grid, Pagination } from '@mui/material';import { Controller } from 'react-hook-form';
