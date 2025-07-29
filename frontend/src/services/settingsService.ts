import { PharmacySettings, PaymentMethod, Reason, ExpenseCategory, User, SystemSetting } from '../types/settings';
import { API_BASE_URL } from '../../constants';

export const fetchPharmacySettings = async (): Promise<PharmacySettings[]> => {
  const response = await fetch(`${API_BASE_URL}/api/settings/pharmacy`);
  if (!response.ok) throw new Error('Failed to fetch pharmacy settings');
  return response.json();
};

export const fetchPaymentMethods = async (): Promise<PaymentMethod[]> => {
  const response = await fetch(`${API_BASE_URL}/api/settings/payment-methods`);
  if (!response.ok) throw new Error('Failed to fetch payment methods');
  return response.json();
};

export const fetchStockTakingReasons = async (): Promise<Reason[]> => {
  const response = await fetch(`${API_BASE_URL}/api/settings/stock-taking-reasons`);
  if (!response.ok) throw new Error('Failed to fetch stock taking reasons');
  return response.json();
};

export const fetchAdjustmentReasons = async (): Promise<Reason[]> => {
  const response = await fetch(`${API_BASE_URL}/api/settings/adjustment-reasons`);
  if (!response.ok) throw new Error('Failed to fetch adjustment reasons');
  return response.json();
};

export const fetchExpenseCategories = async (): Promise<ExpenseCategory[]> => {
  const response = await fetch(`${API_BASE_URL}/api/settings/expense-categories`);
  if (!response.ok) throw new Error('Failed to fetch expense categories');
  return response.json();
};

export const fetchUsers = async (): Promise<User[]> => {
  const response = await fetch(`${API_BASE_URL}/api/settings/users`);
  if (!response.ok) throw new Error('Failed to fetch users');
  return response.json();
};

export const fetchSystemSettings = async (): Promise<SystemSetting[]> => {
  const response = await fetch(`${API_BASE_URL}/api/settings/system`);
  if (!response.ok) throw new Error('Failed to fetch system settings');
  return response.json();
};