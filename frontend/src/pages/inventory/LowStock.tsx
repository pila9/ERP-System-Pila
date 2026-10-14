import { useEffect, useState } from 'react';
import { Box, Grid, Card, CardContent, Typography, Button, Chip, TableContainer, Table, TableHead, TableBody, TableRow, TableCell, Paper, Alert } from '@mui/material';
import { Warning, Refresh } from '@mui/icons-material';
import { api } from '../../lib/api';
import { DataDisplay } from '../../components/ui';
import { formatNumber, formatCurrency } from '../../lib/format';
import { useToast } from '../../context/ToastContext';

export default function LowStock() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const fetchLowStock = async () => {
    setLoading(true);
    try {
      const res = await api.get('/stock/low-stock');
      setItems(res.data);
    } catch (error) { showToast('Failed to fetch', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchLowStock(); }, []);

  const columns = [
    { field: 'product.code', header: 'Code', width: 100 },
    { field: 'product.name', header: 'Product', sortable: true },
    { field: 'warehouse.name', header: 'Warehouse', width: 150 },
    { field: 'quantity', header: 'Current Qty', type: 'number' as const, align: 'right' as const, width: 120, render: (row: any) => <strong style={{ color: row.quantity <= 0 ? 'red' : 'orange' }}>{formatNumber(row.quantity)}</strong> },
    { field: 'product.reorderLevel', header: 'Reorder Level', type: 'number' as const, align: 'right' as const, width: 130 },
    { field: 'product.reorderQuantity', header: 'Reorder Qty', type: 'number' as const, align: 'right' as const, width: 130 },
    { field: 'product.unit.abbreviation', header: 'Unit', width: 80, align: 'center' as const },
    { field: 'product.category.name', header: 'Category', width: 150 },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Warning color="warning" fontSize="large" />
          <Typography variant="h4" fontWeight={600}>Low Stock Alerts</Typography>
        </Box>
        <Button variant="outlined" startIcon={<Refresh />} onClick={fetchLowStock}>Refresh</Button>
      </Box>

      {items.length > 0 && (
        <Alert severity="warning" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Warning fontSize="small" /> {items.length} product(s) below reorder level
        </Alert>
      )}

      <DataDisplay data={items} columns={columns} loading={loading} emptyMessage="All products are well stocked" />

      {items.length === 0 && (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="h6" color="success" gutterBottom>All Good!</Typography>
            <Typography color="text.secondary">No products are below their reorder level.</Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}