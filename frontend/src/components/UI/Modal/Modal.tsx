import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  heading: string;
  children: React.ReactNode;
  size?: 'small' | 'medium' | 'large';
  showFooter?: boolean;
  customFooter?: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  heading,
  children,
  size = 'medium',
  showFooter = true,
  customFooter,
}) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const getMaxWidth = () => {
    switch (size) {
      case 'small':
        return 'sm';
      case 'medium':
        return 'md';
      case 'large':
        return 'lg';
      default:
        return 'md';
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      fullScreen={fullScreen}
      maxWidth={getMaxWidth()}
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid',
          borderColor: 'divider',
          py: 2,
          px: 3,
          
        }}
      >
        <span style={{ fontWeight: 600 }}>{heading}</span>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ py: 3, marginTop: 2}}>{children}</DialogContent>

      {showFooter && (
        <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          {customFooter ? (
            customFooter
          ) : (
            <Button
              onClick={onClose}
              variant="outlined"
              color="error"
              sx={{ textTransform: 'none' }}
            >
              Close
            </Button>
          )}
        </DialogActions>
      )}
    </Dialog>
  );
};

export default Modal;