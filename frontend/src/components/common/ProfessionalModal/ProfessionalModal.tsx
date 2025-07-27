import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Divider,
  IconButton,
  useTheme,
  alpha
} from '@mui/material';
import { X, Check, AlertCircle } from 'lucide-react';

interface ProfessionalModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  error?: string | null;
}

const ProfessionalModal: React.FC<ProfessionalModalProps> = ({
  open,
  onClose,
  title,
  children,
  actions,
  maxWidth = 'md',
  loading = false,
  error = null
}) => {
  const theme = useTheme();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: theme.shadows[24],
          background: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
        }
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          background: alpha(theme.palette.primary.main, 0.05),
          borderBottom: `1px solid ${theme.palette.divider}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          py: 2,
          px: 3
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
          {title}
        </Typography>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            color: theme.palette.text.secondary,
            '&:hover': {
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
            }
          }}
        >
          <X size={20} />
        </IconButton>
      </DialogTitle>

      {/* Error Message */}
      {error && (
        <Box
          sx={{
            background: theme.palette.error.light,
            border: `1px solid ${theme.palette.error.main}`,
            borderRadius: 1,
            p: 2,
            mx: 3,
            mt: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          <AlertCircle size={16} color={theme.palette.error.main} />
          <Typography variant="body2" color="error.main">
            {error}
          </Typography>
        </Box>
      )}

      {/* Content */}
      <DialogContent sx={{ p: 3 }}>
        {children}
      </DialogContent>

      {/* Actions */}
      {actions && (
        <>
          <Divider />
          <DialogActions sx={{ p: 3, gap: 1 }}>
            {actions}
          </DialogActions>
        </>
      )}
    </Dialog>
  );
};

export default ProfessionalModal; 