import React from 'react';
import {
  Box,
  Pagination as MuiPagination,
  FormControl,
  Select,
  MenuItem,
  Typography,
  useTheme,
} from '@mui/material';
import { PaginationData } from '../../../types';

interface PaginationProps {
  pagination: PaginationData;
  onPageChange?: (page: number) => void;
  onPerPageChange?: (perPage: number) => void;
  showPerPageSelector?: boolean;
  perPageOptions?: number[];
}

const Pagination: React.FC<PaginationProps> = ({
  pagination,
  onPageChange,
  onPerPageChange,
  showPerPageSelector = true,
  perPageOptions = [5, 10, 25, 50, 100],
}) => {
  const theme = useTheme();

  const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
    onPageChange?.(page);
  };

  const handlePerPageChange = (event: any) => {
    onPerPageChange?.(event.target.value);
  };

  const startItem = (pagination.current_page - 1) * pagination.per_page + 1;
  const endItem = Math.min(pagination.current_page * pagination.per_page, pagination.total);

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 2,
        p: 2,
        backgroundColor: theme.palette.background.paper,
        borderRadius: 1,
        border: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {showPerPageSelector && (
          <>
            <Typography variant="body2" color="textSecondary">
              Rows per page:
            </Typography>
            <FormControl size="small">
              <Select
                value={pagination.per_page}
                onChange={handlePerPageChange}
                sx={{
                  minWidth: 80,
                  '& .MuiSelect-select': {
                    py: 0.5,
                  },
                }}
              >
                {perPageOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </>
        )}
        
        <Typography variant="body2" color="textSecondary">
          Showing {startItem}-{endItem} of {pagination.total} results
        </Typography>
      </Box>

      <MuiPagination
        count={pagination.last_page}
        page={pagination.current_page}
        onChange={handlePageChange}
        color="primary"
        shape="rounded"
        showFirstButton
        showLastButton
        sx={{
          '& .MuiPaginationItem-root': {
            borderRadius: 1,
          },
        }}
      />
    </Box>
  );
};

export default Pagination;