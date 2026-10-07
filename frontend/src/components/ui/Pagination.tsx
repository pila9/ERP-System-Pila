import { TablePagination, TablePaginationProps } from '@mui/material';

interface PaginationProps extends Omit<TablePaginationProps, 'onPageChange' | 'onRowsPerPageChange'> {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  rowsPerPage?: number;
  onRowsPerPageChange?: (rowsPerPage: number) => void;
}

export function Pagination({ page, totalPages, onPageChange, rowsPerPage = 10, onRowsPerPageChange, ...props }: PaginationProps) {
  return (
    <TablePagination
      component="div"
      count={totalPages * rowsPerPage}
      page={page - 1}
      rowsPerPage={rowsPerPage}
      onPageChange={(_e, newPage) => onPageChange(newPage + 1)}
      onRowsPerPageChange={onRowsPerPageChange ? (e) => onRowsPerPageChange(Number(e.target.value)) : undefined}
      {...props}
    />
  );
}