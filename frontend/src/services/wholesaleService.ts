// src/services/wholesaleService.ts
import { WholesaleItem, Transaction, Supplier, StockAdjustment, StockReceiving } from '../types/wholesale';
import { Item } from '../types/item';
import { Customer } from '../types/customer';

export const fetchWholesaleReport = async (): Promise<any> => {
  const response = await fetch('http://127.0.0.1:8000/api/wholesale/report');
  if (!response.ok) throw new Error('Failed to fetch wholesale statistics');
  return response.json();
};
export const fetchWholesales = async (): Promise<any> => {
  const response = await fetch('http://127.0.0.1:8000/api/wholesale/stats');
  if (!response.ok) throw new Error('Failed to fetch wholesale statistics');
  return response.json();
};

export const fetchWholesaleItems = async (): Promise<WholesaleItem[]> => {
  const response = await fetch('http://127.0.0.1:8000/api/wholesale/items');
  if (!response.ok) throw new Error('Failed to fetch wholesale items');
  const items: Item[] = await response.json();
  return items.map(item => ({
    ...item,
    wholesalePrice: parseFloat(item.price) * 0.8, // Example: 80% of retail price for wholesale
  }));
};

interface StockAdjustmentResponse {
  date: string;
  itemId: number;
  quantity: number;
  reason: string;
  type: 'increase' | 'decrease';
}

export const getStockAdjustments = async (): Promise<StockAdjustmentResponse[]> => {
  const response = await fetch('http://127.0.0.1:8000/api/wholesale/stock-adjustments');
  if (!response.ok) throw new Error('Failed to fetch stock adjustments');
  return response.json();
};

export const fetchCustomers = async (): Promise<Customer[]> => {
  return customerService.fetchCustomers(); // Reuse customer service
};

export const fetchTransactions = async (): Promise<Transaction[]> => {
  const response = await fetch('http://127.0.0.1:8000/api/wholesale/transactions');
  if (!response.ok) throw new Error('Failed to fetch transactions');
  return response.json();
};

export const createTransaction = async (transaction: Transaction): Promise<void> => {
  const response = await fetch('http://127.0.0.1:8000/api/wholesale/transactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(transaction),
  });
  if (!response.ok) throw new Error('Failed to create transaction');
};

export const fetchSuppliers = async (): Promise<Supplier[]> => {
  const response = await fetch('http://127.0.0.1:8000/api/wholesale/suppliers');
  if (!response.ok) throw new Error('Failed to fetch suppliers');
  return response.json();
};

export const createStockAdjustment = async (adjustment: StockAdjustment): Promise<void> => {
  const response = await fetch('http://127.0.0.1:8000/api/wholesale/stock/adjustment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(adjustment),
  });
  if (!response.ok) throw new Error('Failed to adjust stock');
};

export const fetchStockAdjustments = async (): Promise<StockAdjustment[]> => {
  const response = await fetch('http://127.0.0.1:8000/api/wholesale/stock/adjustments');
  if (!response.ok) throw new Error('Failed to fetch stock adjustments');
  return response.json();
};

export const performStockTaking = async (): Promise<WholesaleItem[]> => {
  const response = await fetch('http://127.0.0.1:8000/api/wholesale/stock/taking');
  if (!response.ok) throw new Error('Failed to perform stock taking');
  const items: Item[] = await response.json();
  return items.map(item => ({
    ...item,
    wholesalePrice: parseFloat(item.price) * 0.8, // Example: 80% of retail price for wholesale
  }));
};

export const receiveStock = async (receiving: StockReceiving): Promise<void> => {
  const response = await fetch('http://127.0.0.1:8000/api/wholesale/stock/receiving', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(receiving),
  });
  if (!response.ok) throw new Error('Failed to receive stock');
};

export const generateWholesaleReport = async (startDate: string, endDate: string): Promise<any> => {
  const response = await fetch(`http://127.0.0.1:8000/api/wholesale/reports?start=${startDate}&end=${endDate}`);
  if (!response.ok) throw new Error('Failed to generate report');
  return response.json();
};

// Import customerService for reuse
import * as customerService from './customerService';