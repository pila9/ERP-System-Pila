import { useEffect, useState } from 'react';
import { Box, Grid, Card, CardContent, Typography, Button, Chip, TableContainer, Table, TableHead, TableBody, TableRow, TableCell, Paper, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem, TextField, Controller, IconButton } from '@mui/material';
import { Add, Edit, Delete, Search, FilterList, Refresh } from '@mui/icons-material';
import { useForm } from 'react-hook_form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../lib/api';
import { DataDisplay, FilterBar, ConfirmDialog } from '../components/ui';
import { formatCurrency, formatNumber } from '../lib/format';
import { useToast } from '../context/ToastContext';

export default function StockLevels() {
  const [levels, setLevels] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<Record<string, any>>({});
  const { showToast } = useToast();

  const fetchLevels = async () => {
    setLoading(true);
    try {
      const res = await api.get('/stock/levels', { params: { page, limit, ...filters } });
      setLevels(res.data.data);
      setTotal(res.data.meta.total);
    } catch (error) { showToast('Failed to fetch', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchLevels(); }, [page, filters]);

  const handleSearch = (newFilters: Record<string, any>) => { setFilters(newFilters); setPage(1); };
  const handleClear = () => { setFilters({}); setPage(1); };

  const columns = [
    { field: 'product.code', header: 'Code', width: 100 },
    { field: 'product.name', header: 'Product', sortable: true },
    { field: 'product.unit.abbreviation', header: 'Unit', width: 80, align: 'center' as const },
    { field: 'warehouse.name', header: 'Warehouse', width: 150 },
    { field: 'quantity', header: 'Quantity', type: 'number' as const, align: 'right' as const, width: 120, render: (row: any) => <strong>{formatNumber(row.quantity)}</strong> },
    { field: 'reserved_quantity', header: 'Reserved', type: 'number' as const, align: 'right' as const, width: 120 },
    { field: 'product.reorderLevel', header: 'Reorder Level', type: 'number' as const, align: 'right' as const, width: 130 },
    { field: 'product.trackInventory', header: 'Track', type: 'badge' as const, badgeColor: v => v ? 'success' : 'default', width: 100, align: 'center' as const },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" fontWeight={600}>Stock Levels</Typography>
        <Button variant="outlined" startIcon={<Refresh />} onClick={fetchLevels}>Refresh</Button>
      </Box>

      <FilterBar fields={[{ name: 'productId', label: 'Product', type: 'select', options: [] }, { name: 'warehouseId', label: 'Warehouse', type: 'select', options: [] }, { name: 'lowStock', label: 'Low Stock Only', type: 'select', options: [{ value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }] }]} onSearch={handleSearch} onClear={handleClear} loading={loading} />

      <DataDisplay data={levels} columns={columns} loading={loading} emptyMessage="No stock levels found" />

      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Pagination count={total} page={page} rowsPerPage={limit} onPageChange={setPage} />
      </Box>
    </Box>
  );
}

import { Pagination } from '@mui/material';