import { useState, useCallback } from 'react';

interface NotificationState {
  open: boolean;
  message: string;
  title?: string;
  severity: 'success' | 'error' | 'warning' | 'info';
}

export const useNotification = () => {
  const [notification, setNotification] = useState<NotificationState>({
    open: false,
    message: '',
    severity: 'info',
  });

  const showNotification = useCallback((
    message: string,
    severity: 'success' | 'error' | 'warning' | 'info' = 'info',
    title?: string
  ) => {
    setNotification({
      open: true,
      message,
      severity,
      title,
    });
  }, []);

  const hideNotification = useCallback(() => {
    setNotification(prev => ({ ...prev, open: false }));
  }, []);

  const showSuccess = useCallback((message: string, title?: string) => {
    showNotification(message, 'success', title);
  }, [showNotification]);

  const showError = useCallback((message: string, title?: string) => {
    showNotification(message, 'error', title);
  }, [showNotification]);

  const showWarning = useCallback((message: string, title?: string) => {
    showNotification(message, 'warning', title);
  }, [showNotification]);

  const showInfo = useCallback((message: string, title?: string) => {
    showNotification(message, 'info', title);
  }, [showNotification]);

  return {
    notification,
    showNotification,
    hideNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
};