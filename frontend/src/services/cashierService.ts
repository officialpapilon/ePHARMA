// src/services/cashierService.ts
import { Transaction, Receipt, CashierReport } from '../types/cashier';
import { Item } from '../types/item';
import { Customer } from '../types/customer';

export const fetchTransactions = async (): Promise<Transaction[]> => {
  const response = await fetch('http://127.0.0.1:8000/api/cashier/transactions');
  if (!response.ok) throw new Error('Failed to fetch transactions');
  return response.json();
};

export const createTransaction = async (transaction: Transaction): Promise<void> => {
  const response = await fetch('http://127.0.0.1:8000/api/cashier/transactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(transaction),
  });
  if (!response.ok) throw new Error('Failed to create transaction');
};

export const generateReceipt = async (transactionId: string): Promise<Receipt> => {
  const response = await fetch(`http://127.0.0.1:8000/api/cashier/receipts/${transactionId}`);
  if (!response.ok) throw new Error('Failed to generate receipt');
  return response.json();
};

export const generateSalesReport = async (startDate: string, endDate: string): Promise<CashierReport> => {
  const response = await fetch(`http://127.0.0.1:8000/api/cashier/reports/sales?start=${startDate}&end=${endDate}`);
  if (!response.ok) throw new Error('Failed to generate sales report');
  return response.json();
};