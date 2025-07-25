import React, { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Paper,
  Checkbox,
  IconButton,
  Chip,
  Skeleton,
  Box,
  Typography,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Edit,
  Delete,
  Visibility,
  MoreVert,
} from '@mui/icons-material';
import { TableColumn, PaginationData } from '../../../types';
import Pagination from '../Pagination/Pagination';

interface DataTableProps {
  columns: TableColumn[];
  data: any[];
  loading?: boolean;
  pagination?: PaginationData;
  onPageChange?: (page: number) => void;
  onPerPageChange?: (perPage: number) => void;
  onSort?: (column: string, direction: 'asc' | 'desc') => void;
  onRowClick?: (row: any) => void;
  onEdit?: (row: any) => void;
  onDelete?: (row: any) => void;
  onView?: (row: any) => void;
  selectable?: boolean;
  selectedRows?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  actions?: {
    label: string;
    icon: React.ReactNode;
    onClick: (row: any) => void;
    color?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
  }[];
  emptyMessage?: string;
  stickyHeader?: boolean;
  dense?: boolean;
}

const DataTable: React.FC<DataTableProps> = ({
  columns,
  data,
  loading = false,
  pagination,
  onPageChange,
  onPerPageChange,
  onSort,
  onRowClick,
  onEdit,
  onDelete,
  onView,
  selectable = false,
  selectedRows = [],
  onSelectionChange,
  actions = [],
  emptyMessage = 'No data available',
  stickyHeader = false,
  dense = false,
}) => {
  const theme = useTheme();
  const [sortColumn, setSortColumn] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (column: string) => {
    const isAsc = sortColumn === column && sortDirection === 'asc';
    const direction = isAsc ? 'desc' : 'asc';
    setSortColumn(column);
    setSortDirection(direction);
    onSort?.(column, direction);
  };

  const handleSelectAll = (checked: boolean) => {
    if (onSelectionChange) {
      onSelectionChange(checked ? data.map(row => row.id) : []);
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    if (onSelectionChange) {
      const newSelection = checked
        ? [...selectedRows, id]
        : selectedRows.filter(rowId => rowId !== id);
      onSelectionChange(newSelection);
    }
  };

  const isAllSelected = data.length > 0 && selectedRows.length === data.length;
  const isIndeterminate = selectedRows.length > 0 && selectedRows.length < data.length;

  const defaultActions = useMemo(() => {
    const defaultActionsList = [];
    if (onView) defaultActionsList.push({ label: 'View', icon: <Visibility />, onClick: onView, color: 'info' as const });
    if (onEdit) defaultActionsList.push({ label: 'Edit', icon: <Edit />, onClick: onEdit, color: 'primary' as const });
    if (onDelete) defaultActionsList.push({ label: 'Delete', icon: <Delete />, onClick: onDelete, color: 'error' as const });
    return defaultActionsList;
  }, [onView, onEdit, onDelete]);

  const allActions = [...defaultActions, ...actions];

  const renderCell = (row: any, column: TableColumn) => {
    if (column.render) {
      return column.render(row);
    }

    const value = row[column.key];
    
    if (value === null || value === undefined) {
      return <Typography variant="body2" color="textSecondary">-</Typography>;
    }

    if (typeof value === 'boolean') {
      return (
        <Chip
          label={value ? 'Yes' : 'No'}
          color={value ? 'success' : 'default'}
          size="small"
        />
      );
    }

    if (column.key.includes('date') || column.key.includes('_at')) {
      return new Date(value).toLocaleDateString();
    }

    if (column.key.includes('price') || column.key.includes('amount')) {
      return `Tsh ${parseFloat(value).toFixed(2)}`;
    }

    return value;
  };

  if (loading) {
    return (
      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table stickyHeader={stickyHeader} size={dense ? 'small' : 'medium'}>
          <TableHead>
            <TableRow>
              {selectable && <TableCell padding="checkbox" />}
              {columns.map((column) => (
                <TableCell key={column.key}>
                  <Skeleton variant="text" width="80%" />
                </TableCell>
              ))}
              {allActions.length > 0 && <TableCell />}
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                {selectable && <TableCell padding="checkbox" />}
                {columns.map((column) => (
                  <TableCell key={column.key}>
                    <Skeleton variant="text" />
                  </TableCell>
                ))}
                {allActions.length > 0 && <TableCell />}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  }

  return (
    <Box>
      <TableContainer 
        component={Paper} 
        sx={{ 
          borderRadius: 2,
          boxShadow: theme.shadows[1],
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Table stickyHeader={stickyHeader} size={dense ? 'small' : 'medium'}>
          <TableHead>
            <TableRow
              sx={{
                backgroundColor: theme.palette.primary.main,
                '& .MuiTableCell-head': {
                  backgroundColor: theme.palette.primary.main,
                  color: theme.palette.primary.contrastText,
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                },
              }}
            >
              {selectable && (
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={isIndeterminate}
                    checked={isAllSelected}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    sx={{ color: theme.palette.primary.contrastText }}
                  />
                </TableCell>
              )}
              
              <TableCell sx={{ width: '60px', fontWeight: 600 }}>
                S/N
              </TableCell>
              
              {columns.map((column) => (
                <TableCell
                  key={column.key}
                  align={column.align || 'left'}
                  sx={{ 
                    width: column.width,
                    fontWeight: 600,
                  }}
                >
                  {column.sortable ? (
                    <TableSortLabel
                      active={sortColumn === column.key}
                      direction={sortColumn === column.key ? sortDirection : 'asc'}
                      onClick={() => handleSort(column.key)}
                      sx={{
                        color: `${theme.palette.primary.contrastText} !important`,
                        '& .MuiTableSortLabel-icon': {
                          color: `${theme.palette.primary.contrastText} !important`,
                        },
                      }}
                    >
                      {column.header}
                    </TableSortLabel>
                  ) : (
                    column.header
                  )}
                </TableCell>
              ))}
              
              {allActions.length > 0 && (
                <TableCell align="center" sx={{ width: '120px', fontWeight: 600 }}>
                  Actions
                </TableCell>
              )}
            </TableRow>
          </TableHead>
          
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell 
                  colSpan={columns.length + (selectable ? 1 : 0) + (allActions.length > 0 ? 1 : 0) + 1}
                  align="center"
                  sx={{ py: 8 }}
                >
                  <Typography variant="body1" color="textSecondary">
                    {emptyMessage}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, index) => (
                <TableRow
                  key={row.id || index}
                  hover
                  selected={selectedRows.includes(row.id)}
                  onClick={() => onRowClick?.(row)}
                  sx={{
                    cursor: onRowClick ? 'pointer' : 'default',
                    '&:nth-of-type(odd)': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.02),
                    },
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.04),
                    },
                    '&.Mui-selected': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.08),
                    },
                  }}
                >
                  {selectable && (
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedRows.includes(row.id)}
                        onChange={(e) => handleSelectRow(row.id, e.target.checked)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </TableCell>
                  )}
                  
                  <TableCell sx={{ fontWeight: 500 }}>
                    {pagination ? (pagination.current_page - 1) * pagination.per_page + index + 1 : index + 1}
                  </TableCell>
                  
                  {columns.map((column) => (
                    <TableCell
                      key={column.key}
                      align={column.align || 'left'}
                      sx={{ width: column.width }}
                    >
                      {renderCell(row, column)}
                    </TableCell>
                  ))}
                  
                  {allActions.length > 0 && (
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                        {allActions.map((action, actionIndex) => (
                          <IconButton
                            key={actionIndex}
                            size="small"
                            color={action.color || 'default'}
                            onClick={(e) => {
                              e.stopPropagation();
                              action.onClick(row);
                            }}
                            title={action.label}
                            sx={{
                              '&:hover': {
                                backgroundColor: alpha(theme.palette[action.color || 'primary'].main, 0.1),
                              },
                            }}
                          >
                            {action.icon}
                          </IconButton>
                        ))}
                      </Box>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
      {pagination && (
        <Box sx={{ mt: 2 }}>
          <Pagination
            pagination={pagination}
            onPageChange={onPageChange}
            onPerPageChange={onPerPageChange}
          />
        </Box>
      )}
    </Box>
  );
};

export default DataTable;