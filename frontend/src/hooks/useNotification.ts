import { useCallback } from 'react';

interface NotificationOptions {
  duration?: number;
  severity?: 'success' | 'error' | 'warning' | 'info';
}

export const useNotification = () => {
  const showSuccess = useCallback((message: string, options?: NotificationOptions) => {
    // For now, use console.log and alert as fallback
    console.log('Success:', message);
    alert(`Success: ${message}`);
  }, []);

  const showError = useCallback((message: string, options?: NotificationOptions) => {
    console.error('Error:', message);
    alert(`Error: ${message}`);
  }, []);

  const showWarning = useCallback((message: string, options?: NotificationOptions) => {
    console.warn('Warning:', message);
    alert(`Warning: ${message}`);
  }, []);

  const showInfo = useCallback((message: string, options?: NotificationOptions) => {
    console.info('Info:', message);
    alert(`Info: ${message}`);
  }, []);

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
};