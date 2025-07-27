// src/services/cashierService.ts
import { Transaction, Receipt, CashierReport } from '../types/cashier';
import { Item } from '../types/item';
import { Customer } from '../types/customer';
import { API_BASE_URL } from '../constants';

export const fetchTransactions = async () => {
  const response = await fetch(`${API_BASE_URL}/api/cashier/transactions`);
  return response.json();
};

export const createTransaction = async (transactionData: any) => {
  const response = await fetch(`${API_BASE_URL}/api/cashier/transactions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(transactionData),
  });
  return response.json();
};

export const generateReceipt = async (transactionId: number) => {
  const response = await fetch(`${API_BASE_URL}/api/cashier/receipts/${transactionId}`);
  return response.json();
};

export const fetchSalesReport = async (startDate: string, endDate: string) => {
  const response = await fetch(`${API_BASE_URL}/api/cashier/reports/sales?start=${startDate}&end=${endDate}`);
  return response.json();
};