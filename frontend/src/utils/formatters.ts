import { DATE_FORMATS } from './constants';

export const formatCurrency = (amount: number | string, currency = 'Tsh'): string => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numAmount)) return `${currency} 0.00`;
  
  return `${currency} ${numAmount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const formatDate = (date: string | Date | null, format = DATE_FORMATS.DISPLAY): string => {
  if (!date) return '-';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return '-';
  
  switch (format) {
    case DATE_FORMATS.DISPLAY:
      return dateObj.toLocaleDateString('en-GB');
    case DATE_FORMATS.API:
      return dateObj.toISOString().split('T')[0];
    case DATE_FORMATS.DATETIME:
      return dateObj.toLocaleString('en-GB');
    case DATE_FORMATS.TIME:
      return dateObj.toLocaleTimeString('en-GB');
    default:
      return dateObj.toLocaleDateString('en-GB');
  }
};

export const formatDateTime = (date: string | Date | null): string => {
  return formatDate(date, DATE_FORMATS.DATETIME);
};

export const formatTime = (date: string | Date | null): string => {
  return formatDate(date, DATE_FORMATS.TIME);
};

export const formatNumber = (number: number | string): string => {
  const num = typeof number === 'string' ? parseFloat(number) : number;
  if (isNaN(num)) return '0';
  
  return num.toLocaleString('en-US');
};

export const formatPercentage = (value: number, decimals = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatPhoneNumber = (phone: string): string => {
  if (!phone) return '';
  
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Format as XXX-XXX-XXXX if 10 digits
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  
  return phone;
};

export const formatName = (firstName?: string, lastName?: string): string => {
  if (!firstName && !lastName) return 'Unknown';
  if (!firstName) return lastName || 'Unknown';
  if (!lastName) return firstName;
  return `${firstName} ${lastName}`;
};

export const formatInitials = (firstName?: string, lastName?: string): string => {
  const first = firstName?.charAt(0)?.toUpperCase() || '';
  const last = lastName?.charAt(0)?.toUpperCase() || '';
  return first + last || 'U';
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

export const formatStockStatus = (quantity: number, minStock = 10): {
  status: string;
  color: 'success' | 'warning' | 'error';
} => {
  if (quantity === 0) {
    return { status: 'Out of Stock', color: 'error' };
  } else if (quantity <= minStock) {
    return { status: 'Low Stock', color: 'warning' };
  } else {
    return { status: 'In Stock', color: 'success' };
  }
};

export const formatExpiryStatus = (expiryDate: string | Date): {
  status: string;
  color: 'success' | 'warning' | 'error';
  daysLeft: number;
} => {
  const expiry = typeof expiryDate === 'string' ? new Date(expiryDate) : expiryDate;
  const today = new Date();
  const daysLeft = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysLeft < 0) {
    return { status: 'Expired', color: 'error', daysLeft };
  } else if (daysLeft <= 30) {
    return { status: 'Expires Soon', color: 'warning', daysLeft };
  } else if (daysLeft <= 90) {
    return { status: 'Near Expiry', color: 'warning', daysLeft };
  } else {
    return { status: 'Good', color: 'success', daysLeft };
  }
};