// src/services/managementService.ts
import { Staff, ManagementReport } from '../types/management';
import { Item } from '../types/item';
import { Customer } from '../types/customer';
import { Supplier } from '../types/wholesale';


import axios from 'axios';
import { User } from '../types/user';

const API_URL = '/api/users'; // adjust the URL according to your backend
const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api'
});

export const fetchUsers = () => axios.get(API_URL);
export const addUser = (user: Partial<User>) => axios.post(API_URL, user);
export const updateUser = (id: string, update: Partial<User>) => axios.put(`${API_URL}/${id}`, update);
export const deleteUser = (id: string) => axios.delete(`${API_URL}/${id}`);
export const fetchStaffPerformance = async (): Promise<Staff[]> => {
  const response = await fetch('http://127.0.0.1:8000/api/management/staff');
  if (!response.ok) throw new Error('Failed to fetch staff performance');
  return response.json();
};

export const fetchReceiveStockReport = async (start: string, end: string) => {
  return api.get(`/reports/receive-stock?start=${start}&end=${end}`);
};

export const fetchInventory = async (): Promise<Item[]> => {
  const response = await fetch('http://127.0.0.1:8000/api/management/inventory');
  if (!response.ok) throw new Error('Failed to fetch inventory');
  return response.json();
};

export const stockAdjustment = async (id: string, qty: number) => {
  const response = await fetch(`http://127.0.0.1:8000/api/management/inventory/${id}/adjust`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ qty }),
  });
  if (!response.ok) throw new Error('Failed to adjust stock');
};

export const fetchStockAdjustmentSummary = async (): Promise<Item[]> => {
  const response = await fetch('http://127.0.0.1:8000/api/management/stock-adjustment');
  if (!response.ok) throw new Error('Failed to fetch stock adjustment report');
  return response.json();
};

export const fetchReorderLevelReport = async (): Promise<Item[]> => {
  const response = await fetch('http://127.0.0.1:8000/api/management/reorder-level');
  if (!response.ok) throw new Error('Failed to fetch reorder level report');
  return response.json();
};

export const fetchExpiringItemsReport = async (): Promise<Item[]> => {
  const response = await fetch('http://127.0.0.1:8000/api/management/expiring-items');
  if (!response.ok) throw new Error('Failed to fetch expiring items report');
  return response.json();
};

export const fetchStockAdjustmentReport = async (start: string, end: string): Promise<any[]> => {
  const response = await fetch(`http://127.0.0.1:8000/api/management/stock-adjustment?start=${start}&end=${end}`);
  if (!response.ok) throw new Error('Failed to fetch stock adjustment report');
  return response.json();
};

export const fetchStockTakingReport = async (start: string, end: string): Promise<any[]> => {
  const response = await fetch(`http://127..0.0.1:8000/api/management/stock-taking?start=${start}&end=${end}`);
  if (!response.ok) throw new Error('Failed to fetch stock taking report');
  return response.json();
};

export const fetchStockReceivingReport = async (start: string, end: string): Promise<any[]> => {
  const response = await fetch(`http://127.0.0.1:8000/api/management/stock-receiving?start=${start}&end=${end}`);
  if (!response.ok) throw new Error('Failed to fetch stock receiving report');
  return response.json();
};

export const fetchLowStockItemsReport = async (): Promise<any[]> => {
  const response = await fetch('http://127.00.1:8000/api/management/low-stock-items');
  if (!response.ok) throw new Error('Failed to fetch low stock items report');
  return response.json();
};

export const fetchPaymentReport = async (start: string, end: string): Promise<any[]> => {
  const response = await fetch(`http://127.0.0.1:8000/api/management/payment-report?start=${start}&end=${end}`);
  if (!response.ok) throw new Error('Failed to fetch payment report');
  return response.json();
};

 export const fetchAllSales = async (): Promise<any[]> => {
  const response = await fetch('http://127.0.0.1:8000/api/management/sales');
  if (!response.ok) throw new Error('Failed to fetch sales');
  return response.json();
};

export const fetchSalesReport = async (start: string, end: string): Promise<any[]> => {
  const response = await fetch(`http://127.0.0.1:8000/api/management/sales-report?start=${start}&end=${end}`);
  if (!response.ok) throw new Error('Failed to fetch sales report');
  return response.json();
};
 export const fetchDispensingReport = async (start: string, end: string): Promise<any[]> => {
  const response = await fetch(`http://127.0.0.1:8000/api/management/dispensing-report?start=${start}&end=${end}`);
  if (!response.ok) throw new Error('Failed to fetch dispensing report');
  return response.json();
};

export const fetchSuppliers = async (): Promise<Supplier[]> => {
  const response = await fetch('http://127.0.0.1:8000/api/management/suppliers');
  if (!response.ok) throw new Error('Failed to fetch suppliers');
  return response.json();
};

export const fetchCustomers = async (): Promise<Customer[]> => {
  const response = await fetch('http://127.0.0.1:8000/api/management/customers');
  if (!response.ok) throw new Error('Failed to fetch customers');
  return response.json();
};

export const generateManagementReport = async (type: string, startDate: string, endDate: string): Promise<ManagementReport> => {
  const response = await fetch(`http://127.0.0.1:8000/api/management/reports/${type}?start=${startDate}&end=${endDate}`);
  if (!response.ok) throw new Error('Failed to generate report');
  return response.json();
};

export const fetchExpense = async (): Promise<any[]> => {
  const response = await fetch('http://127.0.0.1:8000/api/management/expenses');
  if (!response.ok) throw new Error('Failed to fetch expenses');
  return response.json();
};  

export const addExpense = async (expense: any) => { 
  const response = await fetch('http://127.0.0.1:8000/api/management/expenses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(expense),
  });
  if (!response.ok) throw new Error('Failed to add expense');
  return response.json();
};
export const updateExpense = async (id: string, expense: any) => {
  const response = await fetch(`http://127.0.0.1:8000/api/management/expenses/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(expense),
  });
  if (!response.ok) throw new Error('Failed to update expense');
  return response.json();
};

export const deleteExpense = async (id: string) => {
  const response = await fetch(`http://127.0.0.1:8000/api/management/expenses/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete expense');
};
