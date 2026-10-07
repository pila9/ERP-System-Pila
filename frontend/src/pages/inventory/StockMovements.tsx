import { useEffect, useState } from 'react';
import { Box, Grid, Card, CardContent, Typography, Button, Chip, TableContainer, Table, TableHead, TableBody, TableRow, TableCell, Paper } from '@mui/material';
import { Search, FilterList, Refresh } from '@mui/icons-material';
import { api } from '../lib/api';
import { DataDisplay, FilterBar } from '../components/ui';
import { formatCurrency, formatNumber, formatDate } from '../lib/format';
import { stockMovementTypes } from '../lib/status';

export default function StockMovements() {
  const [movements, setMovements] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<Record<string, any>>({});

  const fetchMovements = async () => {
    setLoading(true);
    try {
      const res = await api.get('/stock/movements', { params: { page, limit, ...filters } });
      setMovements(res.data.data);
      setTotal(res.data.meta.total);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchMovements(); }, [page, filters]);

  const handleSearch = (newFilters: Record<string, any>) => { setFilters(newFilters); setPage(1); };
  const handleClear = () => { setFilters({}); setPage(1); };

  const columns = [
    { field: 'number', header: 'Ref #', width: 150 },
    { field: 'product.name', header: 'Product', sortable: true },
    { field: 'warehouse.name', header: 'From Warehouse', width: 150 },
    { field: 'toWarehouse.name', header: 'To Warehouse', width: 150 },
    { field: 'type', header: 'Type', type: 'badge' as const, badgeColor: (v) => stockMovementTypes[v as keyof typeof stockMovementTypes]?.color || 'default', width: 120, align: 'center' as const },
    { field: 'quantity', header: 'Quantity', type: 'number' as const, align: 'right' as const, width: 120 },
    { field: 'unitCost', header: 'Unit Cost', type: 'currency' as const, align: 'right' as const, width: 120 },
    { field: 'balanceAfter', header: 'Balance', type: 'number' as const, align: 'right' as const, width: 120 },
    { field: 'createdAt', header: 'Date', type: 'datetime' as const, width: 150, sortable: true },
    { field: 'user.name', header: 'User', width: 130 },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" fontWeight={600}>Stock Movements</Typography>
        <Button variant="outlined" startIcon={<Refresh />} onClick={fetchMovements}>Refresh</Button>
      </Box>

      <FilterBar fields={[{ name: 'productId', label: 'Product', type: 'select', options: [] }, { name: 'warehouseId', label: 'Warehouse', type: 'select', options: [] }, { name: 'type', label: 'Type', type: 'select', options: Object.entries(stockMovementTypes).map(([k, v]) => ({ value: k, label: v.label })) }]} onSearch={handleSearch} onClear={handleClear} loading={loading} />

      <DataDisplay data={movements} columns={columns} loading={loading} emptyMessage="No stock movements found" />

      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Pagination count={total} page={page} rowsPerPage={limit} onPageChange={setPage} />
      </Box>
    </Box>
  );
}

import { Pagination } from '@mui/material';