import React from 'react';
import { Chip, ChipProps } from '@mui/material';

interface StatusChipProps extends Omit<ChipProps, 'color'> {
  status: string;
  colorMap?: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'>;
}

const defaultColorMap = {
  active: 'success',
  inactive: 'default',
  pending: 'warning',
  approved: 'success',
  rejected: 'error',
  completed: 'success',
  cancelled: 'error',
  paid: 'success',
  unpaid: 'error',
  expired: 'error',
  'near-expiry': 'warning',
  'in-stock': 'success',
  'low-stock': 'warning',
  'out-of-stock': 'error',
} as const;

const StatusChip: React.FC<StatusChipProps> = ({
  status,
  colorMap = defaultColorMap,
  ...props
}) => {
  const color = colorMap[status.toLowerCase()] || 'default';
  
  return (
    <Chip
      label={status}
      color={color}
      size="small"
      variant="filled"
      sx={{
        fontWeight: 500,
        textTransform: 'capitalize',
      }}
      {...props}
    />
  );
};

export default StatusChip;