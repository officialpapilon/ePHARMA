import React from 'react';
import {
  Snackbar,
  Alert,
  AlertTitle,
  Slide,
  SlideProps,
} from '@mui/material';

interface NotificationSnackbarProps {
  open: boolean;
  onClose: () => void;
  message: string;
  title?: string;
  severity?: 'success' | 'error' | 'warning' | 'info';
  autoHideDuration?: number;
  action?: React.ReactNode;
}

function SlideTransition(props: SlideProps) {
  return <Slide {...props} direction="up" />;
}

const NotificationSnackbar: React.FC<NotificationSnackbarProps> = ({
  open,
  onClose,
  message,
  title,
  severity = 'info',
  autoHideDuration = 6000,
  action,
}) => {
  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={onClose}
      TransitionComponent={SlideTransition}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      <Alert
        onClose={onClose}
        severity={severity}
        variant="filled"
        action={action}
        sx={{
          minWidth: 300,
          boxShadow: 3,
        }}
      >
        {title && <AlertTitle>{title}</AlertTitle>}
        {message}
      </Alert>
    </Snackbar>
  );
};

export default NotificationSnackbar;