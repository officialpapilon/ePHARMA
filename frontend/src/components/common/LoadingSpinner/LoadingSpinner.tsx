import React from 'react';
import {
  Box,
  CircularProgress,
  Typography,
  Backdrop,
  useTheme,
} from '@mui/material';

interface LoadingSpinnerProps {
  loading?: boolean;
  message?: string;
  overlay?: boolean;
  size?: number;
  color?: 'primary' | 'secondary' | 'inherit';
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  loading = true,
  message = 'Loading...',
  overlay = false,
  size = 40,
  color = 'primary',
}) => {
  const theme = useTheme();

  if (!loading) return null;

  const content = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        p: 3,
      }}
    >
      <CircularProgress size={size} color={color} />
      {message && (
        <Typography variant="body2" color="textSecondary" textAlign="center">
          {message}
        </Typography>
      )}
    </Box>
  );

  if (overlay) {
    return (
      <Backdrop
        open={loading}
        sx={{
          color: '#fff',
          zIndex: theme.zIndex.modal + 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        }}
      >
        {content}
      </Backdrop>
    );
  }

  return content;
};

export default LoadingSpinner;