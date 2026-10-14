import { Table, TableHead, TableBody, TableRow, TableCell, TableContainer, Paper, TableSortLabel, Skeleton, IconButton, Tooltip, Box, Typography, Button } from '@mui/material';
import { Sort, ChevronLeft, ChevronRight, Download } from '@mui/icons-material';
import { formatCurrency, formatDate, formatNumber } from '../../lib/format';
import { Badge } from './Badge';

export function PageHeader({ title, subtitle, actions, breadcrumbs }: { title: string; subtitle?: string; actions?: React.ReactNode; breadcrumbs?: { label: string; href?: string }[] }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
      {breadcrumbs && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: '0.875rem', color: 'text.secondary' }}>
          {breadcrumbs.map((crumb, i) => (
            <Box key={crumb.label} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {i > 0 && <span>/</span>}
              {crumb.href ? <a href={crumb.href} style={{ color: 'inherit', textDecoration: 'none' }}>{crumb.label}</a> : <span>{crumb.label}</span>}
            </Box>
          ))}
        </Box>
      )}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={600} sx={{ mb: 0.5 }}>{title}</Typography>
          {subtitle && <Typography variant="body1" color="text.secondary">{subtitle}</Typography>}
        </Box>
        {actions && <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>{actions}</Box>}
      </Box>
    </Box>
  );
}

interface Column<T> {
  field: keyof T | string;
  header: string;
  width?: number;
  sortable?: boolean;
  render?: (row: T, value: any) => React.ReactNode;
  align?: 'left' | 'center' | 'right' | 'inherit' | 'justify';
  type?: 'text' | 'number' | 'currency' | 'date' | 'datetime' | 'badge' | 'actions';
  badgeColor?: (value: any) => string;
}

interface DataDisplayProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  emptyMessage?: string;
  onSort?: (field: string, direction: 'asc' | 'desc') => void;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  onRowClick?: (row: T) => void;
  selectable?: boolean;
  selectedRows?: string[];
  onSelectionChange?: (selected: string[]) => void;
  getRowId?: (row: T) => string;
  actions?: { label: string; icon: React.ReactNode; onClick: (row: T) => void; color?: 'primary' | 'secondary' | 'error' }[];
  striped?: boolean;
  dense?: boolean;
}

export function DataDisplay<T extends { id: string }>({
  data,
  columns,
  loading = false,
  emptyMessage = 'No data available',
  onSort,
  sortField,
  sortDirection,
  onRowClick,
  selectable = false,
  selectedRows = [],
  onSelectionChange,
  getRowId = (row) => row.id,
  actions,
  striped = true,
  dense = false,
}: DataDisplayProps<T>) {
  const handleSort = (field: string) => {
    if (!onSort) return;
    const newDirection = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
    onSort(field, newDirection);
  };

  const renderCell = (row: T, column: Column<T>) => {
    const value = column.field.split('.').reduce((obj: any, key) => obj?.[key], row);
    
    if (column.render) return column.render(row, value);
    
    switch (column.type) {
      case 'currency':
        return formatCurrency(Number(value) || 0);
      case 'number':
        return formatNumber(Number(value) || 0);
      case 'date':
        return value ? formatDate(value) : '-';
      case 'datetime':
        return value ? formatDate(value, 'PPp') : '-';
      case 'badge':
        return <Badge color={column.badgeColor?.(value) as any || 'default'} size="small">{String(value)}</Badge>;
      case 'actions':
        if (!actions) return null;
        return (
          <Tooltip title={actions[0]?.label || 'Actions'}>
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); actions[0]?.onClick(row); }}>
              {actions[0]?.icon}
            </IconButton>
          </Tooltip>
        );
      default:
        return value ? String(value) : '-';
    }
  };

  if (loading) {
    return (
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              {columns.map(col => (
                <TableCell key={String(col.field)} style={{ width: col.width }}>{col.header}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                {columns.map(col => (
                  <TableCell key={String(col.field)}><Skeleton variant="text" width={col.width ? `${col.width}px` : '80%'} /></TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  }

  if (data.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
        {emptyMessage}
      </Paper>
    );
  }

  return (
    <TableContainer component={Paper}>
      <Table stickyHeader>
        <TableHead>
          <TableRow>
            {selectable && <TableCell padding="checkbox"><input type="checkbox" checked={selectedRows.length === data.length && data.length > 0} onChange={() => onSelectionChange?.(selectedRows.length === data.length ? [] : data.map(getRowId))} /></TableCell>}
            {columns.map(col => (
              <TableCell
                key={String(col.field)}
                style={{ width: col.width }}
                align={col.align}
                sortDirection={sortField === col.field ? sortDirection : false}
              >
                {col.sortable ? (
                  <TableSortLabel active={sortField === col.field} direction={sortDirection} onClick={() => handleSort(String(col.field))}>
                    {col.header}
                  </TableSortLabel>
                ) : (
                  col.header
                )}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row, rowIndex) => {
            const rowId = getRowId(row);
            const isSelected = selectedRows.includes(rowId);
            return (
              <TableRow
                key={rowId}
                hover
                selected={isSelected}
                onClick={() => { onRowClick?.(row); onSelectionChange?.(isSelected ? selectedRows.filter(id => id !== rowId) : [...selectedRows, rowId]); }}
                sx={{ '&:nth-of-type(odd)': striped ? { bgcolor: 'action.hover' } : {} }}
              >
                {selectable && (
                  <TableCell padding="checkbox">
                    <input type="checkbox" checked={isSelected} onChange={(e) => { e.stopPropagation(); onSelectionChange?.(e.target.checked ? [...selectedRows, rowId] : selectedRows.filter(id => id !== rowId)); }} />
                  </TableCell>
                )}
                {columns.map(col => (
                  <TableCell key={String(col.field)} align={col.align}>
                    {renderCell(row, col)}
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}